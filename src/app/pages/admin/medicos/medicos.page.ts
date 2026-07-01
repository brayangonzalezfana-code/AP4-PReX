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
  ToastController,
} from '@ionic/angular/standalone';

import { Usuario } from '../../../interfaces/usuario.interface';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-medicos',
  templateUrl: './medicos.page.html',
  styleUrls: ['./medicos.page.scss'],
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
  ],
})
export class AdminMedicosPage implements OnInit {
  medicos: Usuario[] = [];
  cargando = true;
  mensajeError = '';
  busquedaMedicos = '';

  nombre = '';
  apellido = '';
  correo = '';
  usuario = '';
  password = '';

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  ngOnInit(): void {
    void this.cargarMedicos();
  }

  async cargarMedicos(): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';

    try {
      this.medicos = await this.authService.obtenerTodosMedicos();
    } catch (error) {
      console.error('Error al cargar médicos', error);
      this.medicos = [];
      this.mensajeError = 'No fue posible cargar los médicos.';
    } finally {
      this.cargando = false;
    }
  }

  async crearMedico(): Promise<void> {
    if (
      !this.nombre.trim() ||
      !this.apellido.trim() ||
      !this.correo.trim() ||
      !this.usuario.trim() ||
      !this.password.trim()
    ) {
      await this.mostrarMensaje('Complete todos los campos del médico.', 'warning');
      return;
    }

    const creado = await this.authService.crearMedico({
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim(),
      correo: this.correo.trim(),
      usuario: this.usuario.trim(),
      password: this.password,
    });

    if (!creado) {
      await this.mostrarMensaje('El usuario o correo ya existe.', 'danger');
      return;
    }

    await this.mostrarMensaje('Médico creado correctamente.', 'success');
    this.limpiarFormulario();
    await this.cargarMedicos();
  }

  async cambiarEstado(medico: Usuario): Promise<void> {
    const activar = !medico.activo;
    const confirmado = await this.confirmarCambioEstado(medico, activar);

    if (!confirmado) {
      return;
    }

    const actualizado = await this.authService.cambiarEstadoUsuario(
      medico.id,
      activar
    );

    if (!actualizado) {
      await this.mostrarMensaje('No fue posible actualizar el médico.', 'danger');
      return;
    }

    await this.cargarMedicos();
    await this.mostrarMensaje(
      activar ? 'Médico activado correctamente.' : 'Médico desactivado correctamente.',
      'success'
    );
  }

  volver(): void {
    void this.router.navigate(['/admin/dashboard']);
  }

  get medicosFiltrados(): Usuario[] {
    const texto = this.busquedaMedicos.trim().toLowerCase();

    if (!texto) {
      return this.medicos;
    }

    return this.medicos.filter((medico) => {
      const nombreCompleto = `${medico.nombre} ${medico.apellido}`.toLowerCase();
      return (
        nombreCompleto.includes(texto) ||
        medico.usuario.toLowerCase().includes(texto) ||
        medico.correo.toLowerCase().includes(texto)
      );
    });
  }

  private limpiarFormulario(): void {
    this.nombre = '';
    this.apellido = '';
    this.correo = '';
    this.usuario = '';
    this.password = '';
  }

  private async confirmarCambioEstado(
    medico: Usuario,
    activar: boolean
  ): Promise<boolean> {
    const alerta = await this.alertController.create({
      header: activar ? 'Activar médico' : 'Desactivar médico',
      message: `${activar ? 'Activar' : 'Desactivar'} la cuenta de ${medico.nombre} ${medico.apellido}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: activar ? 'Activar' : 'Desactivar',
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
