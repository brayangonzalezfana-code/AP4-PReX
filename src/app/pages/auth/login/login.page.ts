import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import {
  IonButton,
  IonContent,
  IonInput,
  ToastController,
} from '@ionic/angular/standalone';

import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonContent,
    IonInput,
    RouterLink,
    FormsModule,
  ],
})
export class LoginPage {
  usuario = '';
  password = '';

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  async ingresar(): Promise<void> {
    if (!this.usuario.trim() || !this.password.trim()) {
      await this.mostrarMensaje('Todos los campos son obligatorios.', 'warning');
      return;
    }

    const usuario = await this.authService.login(
      this.usuario,
      this.password
    );

    if (!usuario) {
      await this.mostrarMensaje('Credenciales incorrectas.', 'danger');
      return;
    }

    if (usuario.rol === 'paciente') {
      this.router.navigate(['/dashboard-paciente']);
      return;
    }

    if (usuario.rol === 'medico') {
      this.router.navigate(['/dashboard-medico']);
      return;
    }

    if (usuario.rol === 'admin') {
      this.router.navigate(['/admin/dashboard']);
    }
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
