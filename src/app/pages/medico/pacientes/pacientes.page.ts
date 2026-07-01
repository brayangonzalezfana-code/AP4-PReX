import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonInput,
  IonTextarea,
  ToastController,
} from '@ionic/angular/standalone';

import { MedicoPaciente } from '../../../interfaces/medico-paciente.interface';
import { Usuario } from '../../../interfaces/usuario.interface';
import { AuthService } from '../../../services/auth.service';
import { MedicoPacienteService } from '../../../services/medico-paciente.service';

interface PacienteResumen {
  paciente: Usuario;
  relacion: MedicoPaciente;
}

@Component({
  selector: 'app-pacientes-medico',
  templateUrl: './pacientes.page.html',
  styleUrls: ['./pacientes.page.scss'],
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
    IonTextarea,
  ],
})
export class PacientesMedicoPage implements OnInit {
  pacientes: PacienteResumen[] = [];
  pacientesDisponibles: Usuario[] = [];
  cargando = true;
  mensajeError = '';
  busquedaPacientesAgregados = '';
  busquedaPaciente = '';
  pacienteSeleccionadoId = '';
  motivoConsulta = '';
  antecedentes = '';
  alergias = '';
  observaciones = '';
  agregando = false;

  private medicoActual: Usuario | null = null;
  private readonly authService = inject(AuthService);
  private readonly medicoPacienteService = inject(MedicoPacienteService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  ngOnInit(): void {
    void this.cargarPacientes();
  }

  async cargarPacientes(): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';

    try {
      const medicoActual = await this.authService.getUsuarioActual();

      if (!medicoActual || medicoActual.rol !== 'medico') {
        this.medicoActual = null;
        this.pacientes = [];
        this.pacientesDisponibles = [];
        this.mensajeError = 'No hay un médico autenticado.';
        return;
      }

      this.medicoActual = medicoActual;

      const [pacientes, relaciones] = await Promise.all([
        this.authService.obtenerTodosPacientes(),
        this.medicoPacienteService.obtenerRelacionesPorMedico(medicoActual.id),
      ]);

      const relacionesPorPaciente = new Map(
        relaciones.map((relacion) => [relacion.pacienteId, relacion])
      );
      const pacientesAgregadosIds = new Set(relacionesPorPaciente.keys());

      this.pacientes = pacientes
        .filter((paciente) => pacientesAgregadosIds.has(paciente.id))
        .map((paciente) => {
          const relacion = relacionesPorPaciente.get(paciente.id);

          if (!relacion) {
            return null;
          }

          return { paciente, relacion };
        })
        .filter((resumen): resumen is PacienteResumen => resumen !== null);

      this.pacientesDisponibles = pacientes.filter(
        (paciente) => paciente.activo && !pacientesAgregadosIds.has(paciente.id)
      );
    } catch (error) {
      console.error('Error al cargar pacientes', error);
      this.pacientes = [];
      this.pacientesDisponibles = [];
      this.mensajeError = 'No fue posible cargar los pacientes.';
    } finally {
      this.cargando = false;
    }
  }

  get pacientesFiltrados(): Usuario[] {
    const texto = this.busquedaPaciente.trim().toLowerCase();

    if (!texto) {
      return this.pacientesDisponibles;
    }

    return this.pacientesDisponibles.filter((paciente) => {
      const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`.toLowerCase();
      return (
        nombreCompleto.includes(texto) ||
        paciente.usuario.toLowerCase().includes(texto) ||
        paciente.correo.toLowerCase().includes(texto)
      );
    });
  }

  get pacientesAgregadosFiltrados(): PacienteResumen[] {
    const texto = this.busquedaPacientesAgregados.trim().toLowerCase();

    if (!texto) {
      return this.pacientes;
    }

    return this.pacientes.filter(({ paciente }) => {
      const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`.toLowerCase();
      return (
        nombreCompleto.includes(texto) ||
        paciente.usuario.toLowerCase().includes(texto) ||
        paciente.correo.toLowerCase().includes(texto)
      );
    });
  }

  async agregarPaciente(): Promise<void> {
    const medicoActual = this.medicoActual ?? (await this.authService.getUsuarioActual());

    if (!medicoActual || medicoActual.rol !== 'medico') {
      await this.mostrarMensaje('Debe iniciar sesión como médico para agregar pacientes.', 'danger');
      return;
    }

    if (!this.pacienteSeleccionadoId) {
      await this.mostrarMensaje('Seleccione un paciente para agregar.', 'warning');
      return;
    }

    if (!this.motivoConsulta.trim()) {
      await this.mostrarMensaje('Describa el motivo de consulta inicial.', 'warning');
      return;
    }

    this.agregando = true;

    try {
      const yaExiste = await this.medicoPacienteService.existeRelacion(
        medicoActual.id,
        this.pacienteSeleccionadoId
      );

      if (yaExiste) {
        await this.mostrarMensaje('Este paciente ya está agregado a su relación clínica.', 'warning');
        return;
      }

      const relacion: MedicoPaciente = {
        id: Date.now().toString(),
        medicoId: medicoActual.id,
        pacienteId: this.pacienteSeleccionadoId,
        motivoConsulta: this.motivoConsulta.trim(),
        antecedentes: this.antecedentes.trim(),
        alergias: this.alergias.trim(),
        observaciones: this.observaciones.trim(),
        fechaRegistro: new Date(),
        activo: true,
      };

      await this.medicoPacienteService.crearRelacion(relacion);
      this.limpiarFormulario();
      await this.cargarPacientes();
      await this.mostrarMensaje('Paciente agregado correctamente a su lista clínica.', 'success');
    } catch (error) {
      console.error('Error al agregar paciente', error);
      await this.mostrarMensaje('No se pudo agregar el paciente. Inténtelo nuevamente.', 'danger');
    } finally {
      this.agregando = false;
    }
  }

  seleccionarPaciente(paciente: Usuario): void {
    this.pacienteSeleccionadoId = paciente.id;
    this.busquedaPaciente = `${paciente.nombre} ${paciente.apellido}`;
  }

  volver(): void {
    void this.router.navigate(['/dashboard-medico']);
  }

  formatearEstado(activo: boolean): string {
    return activo ? 'Activo' : 'Inactivo';
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

  private limpiarFormulario(): void {
    this.busquedaPaciente = '';
    this.pacienteSeleccionadoId = '';
    this.motivoConsulta = '';
    this.antecedentes = '';
    this.alergias = '';
    this.observaciones = '';
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
