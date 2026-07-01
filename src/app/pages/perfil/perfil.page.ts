import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
} from '@ionic/angular/standalone';

import { Usuario } from '../../interfaces/usuario.interface';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButton,
  ],
})
export class PerfilPage implements OnInit {
  usuarioActual: Usuario | null = null;
  cargando = true;
  cerrandoSesion = false;
  mensajeError = '';

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.cargarPerfil();
  }

  async cargarPerfil(): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';

    try {
      this.usuarioActual = await this.authService.getUsuarioActual();

      if (!this.usuarioActual) {
        this.mensajeError = 'No hay un usuario autenticado.';
      }
    } catch (error) {
      console.error('Error al cargar el perfil', error);
      this.usuarioActual = null;
      this.mensajeError = 'No fue posible cargar la información del perfil.';
    } finally {
      this.cargando = false;
    }
  }

  async cerrarSesion(): Promise<void> {
    if (this.cerrandoSesion) {
      return;
    }

    this.cerrandoSesion = true;

    try {
      await this.authService.logout();
      await this.router.navigateByUrl('/login', { replaceUrl: true });
    } catch (error) {
      console.error('Error al cerrar sesión', error);
      this.mensajeError = 'No fue posible cerrar la sesión.';
      this.cerrandoSesion = false;
    }
  }

  volver(): void {
    if (!this.usuarioActual) {
      void this.router.navigate(['/login']);
      return;
    }

    const rutasPorRol: Record<Usuario['rol'], string> = {
      paciente: '/dashboard-paciente',
      medico: '/dashboard-medico',
      admin: '/admin/dashboard',
    };

    void this.router.navigate([rutasPorRol[this.usuarioActual.rol]]);
  }

  formatearFecha(fecha: Date | string): string {
    const fechaNormalizada =
      fecha instanceof Date ? fecha : new Date(fecha);

    if (Number.isNaN(fechaNormalizada.getTime())) {
      return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat('es-DO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(fechaNormalizada);
  }

  formatearRol(rol: Usuario['rol']): string {
    const roles: Record<Usuario['rol'], string> = {
      paciente: 'Paciente',
      medico: 'Médico',
      admin: 'Administrador',
    };

    return roles[rol];
  }
}
