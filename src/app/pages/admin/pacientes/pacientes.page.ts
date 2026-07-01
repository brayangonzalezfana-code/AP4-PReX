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
  selector: 'app-admin-pacientes',
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
  ],
})
export class AdminPacientesPage implements OnInit {
  pacientes: Usuario[] = [];
  cargando = true;
  mensajeError = '';
  busquedaPacientes = '';

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly alertController = inject(AlertController);
  private readonly toastController = inject(ToastController);

  ngOnInit(): void {
    void this.cargarPacientes();
  }

  async cargarPacientes(): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';

    try {
      this.pacientes = await this.authService.obtenerTodosPacientes();
    } catch (error) {
      console.error('Error al cargar pacientes', error);
      this.pacientes = [];
      this.mensajeError = 'No fue posible cargar los pacientes.';
    } finally {
      this.cargando = false;
    }
  }

  async cambiarEstado(paciente: Usuario): Promise<void> {
    const activar = !paciente.activo;
    const confirmado = await this.confirmarCambioEstado(paciente, activar);

    if (!confirmado) {
      return;
    }

    const actualizado = await this.authService.cambiarEstadoUsuario(
      paciente.id,
      activar
    );

    if (!actualizado) {
      await this.mostrarMensaje('No fue posible actualizar el paciente.', 'danger');
      return;
    }

    await this.cargarPacientes();
    await this.mostrarMensaje(
      activar ? 'Paciente activado correctamente.' : 'Paciente desactivado correctamente.',
      'success'
    );
  }

  volver(): void {
    void this.router.navigate(['/admin/dashboard']);
  }

  get pacientesFiltrados(): Usuario[] {
    const texto = this.busquedaPacientes.trim().toLowerCase();

    if (!texto) {
      return this.pacientes;
    }

    return this.pacientes.filter((paciente) => {
      const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`.toLowerCase();
      return (
        nombreCompleto.includes(texto) ||
        paciente.usuario.toLowerCase().includes(texto) ||
        paciente.correo.toLowerCase().includes(texto)
      );
    });
  }

  private async confirmarCambioEstado(
    paciente: Usuario,
    activar: boolean
  ): Promise<boolean> {
    const alerta = await this.alertController.create({
      header: activar ? 'Activar paciente' : 'Desactivar paciente',
      message: `${activar ? 'Activar' : 'Desactivar'} la cuenta de ${paciente.nombre} ${paciente.apellido}?`,
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
