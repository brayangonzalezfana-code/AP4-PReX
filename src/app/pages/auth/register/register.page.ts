import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  IonButton,
  IonContent,
  IonInput,
  ToastController,
} from '@ionic/angular/standalone';

import { Usuario } from '../../../interfaces/usuario.interface';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    IonInput,
    FormsModule,
    RouterLink,
  ],
})
export class RegisterPage {
  nombre = '';
  apellido = '';
  correo = '';
  usuario = '';
  password = '';

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  async registrar(): Promise<void> {
    if (
      !this.nombre.trim() ||
      !this.apellido.trim() ||
      !this.correo.trim() ||
      !this.usuario.trim() ||
      !this.password.trim()
    ) {
      await this.mostrarMensaje('Todos los campos son obligatorios.', 'warning');
      return;
    }

    const usuario: Usuario & { activo: boolean } = {
      id: Date.now().toString(),
      nombre: this.nombre.trim(),
      apellido: this.apellido.trim(),
      correo: this.correo.trim(),
      usuario: this.usuario.trim(),
      password: this.password,
      rol: 'paciente',
      fechaRegistro: new Date(),
      activo: true,
    };

    const registrado = await this.authService.registrar(usuario);

    if (registrado) {
      await this.mostrarMensaje('Usuario registrado correctamente.', 'success');
      this.router.navigate(['/login']);
      return;
    }

    await this.mostrarMensaje('El usuario o correo ya existe.', 'danger');
  }

  private async mostrarMensaje(
    mensaje: string,
    color: 'success' | 'warning' | 'danger' = 'success'
  ): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2200,
      color,
      position: 'bottom',
    });

    await toast.present();
  }
}
