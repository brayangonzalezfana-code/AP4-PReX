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
import { Usuario } from '../../../interfaces/usuario.interface';
import { AuthService } from '../../../services/auth.service';
import { PrescripcionService } from '../../../services/prescripcion.service';

type EstadoFiltro = Prescripcion['estado'] | 'todos';

@Component({
  selector: 'app-prescripciones-medico',
  templateUrl: './prescripciones.page.html',
  styleUrls: ['./prescripciones.page.scss'],
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
export class PrescripcionesMedicoPage implements OnInit {
  prescripciones: Prescripcion[] = [];
  pacientes: Usuario[] = [];
  cargando = true;
  mensajeError = '';
  busqueda = '';
  pacienteFiltro = 'todos';
  estadoFiltro: EstadoFiltro = 'todos';

  private readonly authService = inject(AuthService);
  private readonly prescripcionService = inject(PrescripcionService);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  ngOnInit(): void {
    void this.cargarPrescripciones();
  }

  async cargarPrescripciones(): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';

    try {
      const medicoActual = await this.authService.getUsuarioActual();

      if (!medicoActual || medicoActual.rol !== 'medico') {
        this.prescripciones = [];
        this.pacientes = [];
        this.mensajeError = 'No hay un médico autenticado.';
        return;
      }

      const [prescripciones, pacientes] = await Promise.all([
        this.prescripcionService.obtenerPrescripcionesMedico(medicoActual.id),
        this.authService.obtenerTodosPacientes(),
      ]);
      const pacientesIds = new Set(
        prescripciones.map((prescripcion) => prescripcion.pacienteId)
      );

      this.prescripciones = prescripciones;
      this.pacientes = pacientes.filter((paciente) => pacientesIds.has(paciente.id));
    } catch (error) {
      console.error('Error al cargar prescripciones', error);
      this.prescripciones = [];
      this.pacientes = [];
      this.mensajeError = 'No fue posible cargar las prescripciones.';
    } finally {
      this.cargando = false;
    }
  }

  get prescripcionesFiltradas(): Prescripcion[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.prescripciones.filter((prescripcion) => {
      const nombrePaciente = this.obtenerNombrePaciente(prescripcion.pacienteId).toLowerCase();
      const coincideTexto =
        !texto ||
        prescripcion.medicamento.toLowerCase().includes(texto) ||
        nombrePaciente.includes(texto);
      const coincidePaciente =
        this.pacienteFiltro === 'todos' || prescripcion.pacienteId === this.pacienteFiltro;
      const coincideEstado =
        this.estadoFiltro === 'todos' || prescripcion.estado === this.estadoFiltro;

      return coincideTexto && coincidePaciente && coincideEstado;
    });
  }

  volver(): void {
    void this.router.navigate(['/dashboard-medico']);
  }

  irANuevaPrescripcion(): void {
    void this.router.navigate(['/medico/nueva-prescripcion']);
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
    await this.cargarPrescripciones();
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
    await this.cargarPrescripciones();
    await this.mostrarMensaje('Prescripción anulada y conservada en el historial.', 'warning');
  }

  async alternarVisibilidadPrescripcion(prescripcion: Prescripcion): Promise<void> {
    const ocultar = !prescripcion.ocultaParaPaciente;
    const accion = ocultar ? 'Ocultar al paciente' : 'Mostrar al paciente';
    const confirmar = await this.confirmarAccion(
      accion,
      `${accion} la prescripción de ${prescripcion.medicamento}?`,
      ocultar ? 'Ocultar' : 'Mostrar'
    );

    if (!confirmar) {
      return;
    }

    await this.prescripcionService.actualizarPrescripcion({
      ...prescripcion,
      ocultaParaPaciente: ocultar,
    });
    await this.cargarPrescripciones();
    await this.mostrarMensaje(
      ocultar ? 'Prescripción oculta para el paciente.' : 'Prescripción visible para el paciente.',
      'success'
    );
  }

  puedeCerrarPrescripcion(prescripcion: Prescripcion): boolean {
    return prescripcion.estado === 'activa' || prescripcion.estado === 'procesando';
  }

  textoAccionVisibilidad(prescripcion: Prescripcion): string {
    return prescripcion.ocultaParaPaciente ? 'Mostrar al paciente' : 'Ocultar al paciente';
  }

  obtenerNombrePaciente(pacienteId: string): string {
    const paciente = this.pacientes.find((pacienteRegistrado) => pacienteRegistrado.id === pacienteId);
    return paciente ? `${paciente.nombre} ${paciente.apellido}` : 'Paciente no disponible';
  }

  formatearEstado(estado: Prescripcion['estado']): string {
    const estados: Record<Prescripcion['estado'], string> = {
      activa: 'Activa',
      procesando: 'En proceso',
      completada: 'Completada',
      anulada: 'Anulada',
    };

    return estados[estado];
  }

  formatearFecha(fecha: Date | string): string {
    const fechaNormalizada = fecha instanceof Date ? fecha : new Date(fecha);

    if (Number.isNaN(fechaNormalizada.getTime())) {
      return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(fechaNormalizada);
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
