import { NgFor } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonButton,
  IonContent,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  ToastController,
} from '@ionic/angular/standalone';

import { Prescripcion } from '../../../interfaces/prescripcion.interface';
import { Usuario } from '../../../interfaces/usuario.interface';
import { AuthService } from '../../../services/auth.service';
import { MedicoPacienteService } from '../../../services/medico-paciente.service';
import { PrescripcionService } from '../../../services/prescripcion.service';

@Component({
  selector: 'app-nueva-prescripcion',
  templateUrl: './nueva-prescripcion.page.html',
  styleUrls: ['./nueva-prescripcion.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgFor,
    IonButton,
    IonContent,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
  ],
})
export class NuevaPrescripcionPage implements OnInit {
  pacientes: Usuario[] = [];
  pacienteId = '';
  medicamento = '';
  dosis = '';
  frecuencia = '';
  hora = '';
  fechaInicio = '';
  fechaFin = '';
  observaciones = '';
  private medicoActual: Usuario | null = null;

  private readonly authService = inject(AuthService);
  private readonly medicoPacienteService = inject(MedicoPacienteService);
  private readonly prescripcionService = inject(PrescripcionService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  ngOnInit(): void {
    void this.inicializarPagina();
  }

  async inicializarPagina(): Promise<void> {
    const medicoActual = await this.obtenerMedicoAutenticado();

    if (!medicoActual) {
      return;
    }

    this.medicoActual = medicoActual;
    await this.cargarPacientes();
  }

  async cargarPacientes(): Promise<void> {
    const medicoActual = this.medicoActual ?? (await this.obtenerMedicoAutenticado());

    if (!medicoActual) {
      this.pacientes = [];
      return;
    }

    this.pacientes = await this.medicoPacienteService.obtenerPacientesDelMedico(medicoActual.id);
  }

  async guardarPrescripcion(): Promise<void> {
    const medicoActual =
      this.medicoActual ?? (await this.obtenerMedicoAutenticado());

    if (!medicoActual) {
      return;
    }

    if (
      !this.pacienteId ||
      !this.pacientes.some((paciente) => paciente.id === this.pacienteId)
    ) {
      await this.mostrarMensaje('Seleccione un paciente.', 'warning');
      return;
    }

    if (
      !this.medicamento.trim() ||
      !this.dosis.trim() ||
      !this.frecuencia.trim() ||
      !this.hora ||
      !this.fechaInicio ||
      !this.fechaFin
    ) {
      await this.mostrarMensaje('Complete todos los campos obligatorios.', 'warning');
      return;
    }

    const fechaInicio = new Date(this.fechaInicio);
    const fechaFin = new Date(this.fechaFin);

    if (fechaInicio > fechaFin) {
      await this.mostrarMensaje('La fecha de inicio no puede ser posterior a la fecha de fin.', 'warning');
      return;
    }

    const prescripcion: Prescripcion = {
      id: Date.now().toString(),
      pacienteId: this.pacienteId,
      medicoId: medicoActual.id,
      medicamento: this.medicamento.trim(),
      dosis: this.dosis.trim(),
      frecuencia: this.frecuencia.trim(),
      hora: this.hora,
      fechaInicio,
      fechaFin,
      observaciones: this.observaciones.trim(),
      estado: 'activa',
      activa: true,
      ocultaParaPaciente: false,
    };

    try {
      await this.prescripcionService.crearPrescripcion(prescripcion);
      await this.mostrarMensaje('Prescripción creada correctamente.', 'success');
      this.limpiarFormulario();
    } catch (error) {
      console.error('Error al crear la prescripción', error);
      await this.mostrarMensaje('No se pudo crear la prescripción. Inténtelo nuevamente.', 'danger');
    }
  }

  volver(): void {
    void this.router.navigate(['/dashboard-medico']);
  }

  private limpiarFormulario(): void {
    this.pacienteId = '';
    this.medicamento = '';
    this.dosis = '';
    this.frecuencia = '';
    this.hora = '';
    this.fechaInicio = '';
    this.fechaFin = '';
    this.observaciones = '';
  }

  private async obtenerMedicoAutenticado(): Promise<Usuario | null> {
    const usuarioActual = await this.authService.getUsuarioActual();

    if (usuarioActual?.rol === 'medico' && usuarioActual.activo) {
      return usuarioActual;
    }

    await this.mostrarMensaje('Debe iniciar sesión como médico para crear prescripciones.', 'danger');
    await this.router.navigateByUrl('/login', { replaceUrl: true });
    return null;
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
