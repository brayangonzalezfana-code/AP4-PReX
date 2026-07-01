import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  AlertController,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonInput,
  IonSelect,
  IonSelectOption,
  ToastController,
} from '@ionic/angular/standalone';

import { Prescripcion } from '../../../interfaces/prescripcion.interface';
import type { Toma } from '../../../interfaces/toma.interface';
import { Usuario } from '../../../interfaces/usuario.interface';
import { AuthService } from '../../../services/auth.service';
import { MedicoPacienteService } from '../../../services/medico-paciente.service';
import { PrescripcionService } from '../../../services/prescripcion.service';
import { TomaService } from '../../../services/toma.service';

interface SeguimientoPaciente {
  paciente: Usuario;
  prescripciones: Prescripcion[];
  tomasPaciente: Toma[];
  tratamientosActivos: number;
  tratamientosCompletados: number;
  tratamientosAnulados: number;
  tomas: number;
  adherencia: number;
}

type EstadoFiltro = Prescripcion['estado'] | 'todos';

@Component({
  selector: 'app-seguimiento-medico',
  templateUrl: './seguimiento.page.html',
  styleUrls: ['./seguimiento.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonInput,
    IonSelect,
    IonSelectOption,
  ],
})
export class SeguimientoPage implements OnInit {
  seguimientos: SeguimientoPaciente[] = [];
  cargando = true;
  mensajeError = '';
  busqueda = '';
  estadoFiltro: EstadoFiltro = 'todos';

  private readonly authService = inject(AuthService);
  private readonly medicoPacienteService = inject(MedicoPacienteService);
  private readonly prescripcionService = inject(PrescripcionService);
  private readonly tomaService = inject(TomaService);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  ngOnInit(): void {
    void this.cargarSeguimiento();
  }

  async cargarSeguimiento(): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';

    try {
      const medicoActual = await this.authService.getUsuarioActual();

      if (!medicoActual || medicoActual.rol !== 'medico') {
        this.seguimientos = [];
        this.mensajeError = 'No hay un médico autenticado.';
        return;
      }

      const [pacientes, prescripciones, tomas] = await Promise.all([
        this.medicoPacienteService.obtenerPacientesDelMedico(medicoActual.id),
        this.prescripcionService.obtenerPrescripciones(),
        this.tomaService.obtenerTomas(),
      ]);

      const prescripcionesMedico = prescripciones.filter(
        (prescripcion) => prescripcion.medicoId === medicoActual.id
      );
      const pacientesAtendidos = new Set(
        prescripcionesMedico.map((prescripcion) => prescripcion.pacienteId)
      );
      const prescripcionesMedicoIds = new Set(
        prescripcionesMedico.map((prescripcion) => prescripcion.id)
      );
      const tomasMedico = tomas.filter((toma) =>
        prescripcionesMedicoIds.has(toma.prescripcionId)
      );

      this.seguimientos = pacientes
        .filter((paciente) => pacientesAtendidos.has(paciente.id))
        .map((paciente) => {
          const prescripcionesPaciente = prescripcionesMedico.filter(
            (prescripcion) => prescripcion.pacienteId === paciente.id
          );
          const prescripcionesPacienteIds = new Set(
            prescripcionesPaciente.map((prescripcion) => prescripcion.id)
          );
          const tomasPaciente = tomasMedico.filter((toma) =>
            prescripcionesPacienteIds.has(toma.prescripcionId)
          );

          return this.construirSeguimiento(paciente, prescripcionesPaciente, tomasPaciente);
        });
    } catch (error) {
      console.error('Error al cargar seguimiento', error);
      this.seguimientos = [];
      this.mensajeError = 'No fue posible cargar el seguimiento.';
    } finally {
      this.cargando = false;
    }
  }

  get seguimientosFiltrados(): SeguimientoPaciente[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.seguimientos
      .map((seguimiento) => {
        const paciente = seguimiento.paciente;
        const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`.toLowerCase();
        const coincidePaciente =
          !texto ||
          nombreCompleto.includes(texto) ||
          paciente.usuario.toLowerCase().includes(texto) ||
          paciente.correo.toLowerCase().includes(texto);
        const prescripcionesFiltradas = seguimiento.prescripciones.filter((prescripcion) => {
          const coincideEstado =
            this.estadoFiltro === 'todos' || prescripcion.estado === this.estadoFiltro;
          const coincideTratamiento =
            !texto ||
            coincidePaciente ||
            prescripcion.medicamento.toLowerCase().includes(texto);

          return coincideEstado && coincideTratamiento;
        });
        const prescripcionesIds = new Set(
          prescripcionesFiltradas.map((prescripcion) => prescripcion.id)
        );
        const tomasFiltradas = seguimiento.tomasPaciente.filter((toma) =>
          prescripcionesIds.has(toma.prescripcionId)
        );

        return this.construirSeguimiento(paciente, prescripcionesFiltradas, tomasFiltradas);
      })
      .filter((seguimiento) => seguimiento.prescripciones.length > 0);
  }

  volver(): void {
    void this.router.navigate(['/dashboard-medico']);
  }

  async completarPrescripcion(prescripcion: Prescripcion): Promise<void> {
    const confirmar = await this.confirmarAccion(
      'Completar tratamiento',
      `Marcar como completada la prescripción de ${prescripcion.medicamento}?`,
      'Completar'
    );

    if (!confirmar) {
      return;
    }

    await this.prescripcionService.completarPrescripcion(prescripcion.id);
    await this.cargarSeguimiento();
    await this.mostrarMensaje('Prescripción marcada como completada.', 'success');
  }

  async anularPrescripcion(prescripcion: Prescripcion): Promise<void> {
    const confirmar = await this.confirmarAccion(
      'Anular tratamiento',
      `Anular la prescripción de ${prescripcion.medicamento}?`,
      'Anular'
    );

    if (!confirmar) {
      return;
    }

    await this.prescripcionService.desactivarPrescripcion(prescripcion.id);
    await this.cargarSeguimiento();
    await this.mostrarMensaje('Prescripción anulada y conservada en el historial.', 'warning');
  }

  debeMostrarBotonCompletar(prescripcion: Prescripcion): boolean {
    return this.debePermitirCerrarPrescripcion(prescripcion);
  }

  debeMostrarBotonAnular(prescripcion: Prescripcion): boolean {
    return this.debePermitirCerrarPrescripcion(prescripcion);
  }

  formatearEstadoPrescripcion(estado: Prescripcion['estado']): string {
    const estados: Record<Prescripcion['estado'], string> = {
      activa: 'Activa',
      procesando: 'En proceso',
      completada: 'Completada',
      anulada: 'Anulada',
    };

    return estados[estado];
  }

  private construirSeguimiento(
    paciente: Usuario,
    prescripciones: Prescripcion[],
    tomas: Toma[]
  ): SeguimientoPaciente {
    return {
      paciente,
      prescripciones,
      tomasPaciente: tomas,
      tratamientosActivos: prescripciones.filter(
        (prescripcion) => this.debePermitirCerrarPrescripcion(prescripcion)
      ).length,
      tratamientosCompletados: prescripciones.filter(
        (prescripcion) => prescripcion.estado === 'completada'
      ).length,
      tratamientosAnulados: prescripciones.filter(
        (prescripcion) => prescripcion.estado === 'anulada'
      ).length,
      tomas: tomas.length,
      adherencia: this.calcularAdherencia(prescripciones, tomas),
    };
  }

  private calcularAdherencia(prescripciones: Prescripcion[], tomas: Toma[]): number {
    if (prescripciones.length === 0) {
      return 0;
    }

    const totalEsperado = prescripciones.reduce((sum, prescripcion) => {
      const fechaInicio = new Date(prescripcion.fechaInicio).getTime();
      const fechaFin = new Date(prescripcion.fechaFin).getTime();
      const dias = Math.max(
        1,
        Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1
      );

      return sum + dias;
    }, 0);
    const porcentaje = totalEsperado === 0 ? 0 : Math.round((tomas.length / totalEsperado) * 100);
    return Math.min(100, porcentaje);
  }

  private debePermitirCerrarPrescripcion(prescripcion: Prescripcion): boolean {
    return prescripcion.estado === 'activa' || prescripcion.estado === 'procesando';
  }

  private async confirmarAccion(
    encabezado: string,
    mensaje: string,
    textoConfirmacion: string
  ): Promise<boolean> {
    const alerta = await this.alertController.create({
      header: encabezado,
      message: mensaje,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: textoConfirmacion,
          role: 'confirm',
        },
      ],
    });

    await alerta.present();
    const resultado = await alerta.onDidDismiss();
    return resultado.role === 'confirm';
  }

  private async mostrarMensaje(
    mensaje: string,
    color: 'success' | 'warning' | 'danger' = 'success'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2400,
      color,
      position: 'bottom',
    });

    await toast.present();
  }
}
