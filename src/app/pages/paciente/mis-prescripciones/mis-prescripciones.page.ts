import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  ToastController,
} from '@ionic/angular/standalone';

import { Prescripcion } from '../../../interfaces/prescripcion.interface';
import { Toma } from '../../../interfaces/toma.interface';
import { AuthService } from '../../../services/auth.service';
import { PrescripcionService } from '../../../services/prescripcion.service';
import { TomaService } from '../../../services/toma.service';

@Component({
  selector: 'app-mis-prescripciones',
  templateUrl: './mis-prescripciones.page.html',
  styleUrls: ['./mis-prescripciones.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
  ],
})
export class MisPrescripcionesPage implements OnInit {
  prescripciones: Prescripcion[] = [];
  cargando = true;
  mensajeError = '';
  tomasRegistradas = new Set<string>();
  private pacienteId = '';

  private readonly authService = inject(AuthService);
  private readonly prescripcionService = inject(PrescripcionService);
  private readonly tomaService = inject(TomaService);
  private readonly router = inject(Router);
  private readonly toastController = inject(ToastController);

  ngOnInit(): void {
    void this.cargarPrescripciones();
  }

  async cargarPrescripciones(): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';

    try {
      const usuarioActual = await this.authService.getUsuarioActual();

      if (!usuarioActual || usuarioActual.rol !== 'paciente') {
        this.pacienteId = '';
        this.prescripciones = [];
        this.mensajeError = 'No hay un paciente autenticado.';
        return;
      }

      this.pacienteId = usuarioActual.id;
      const [prescripciones, tomas] = await Promise.all([
        this.prescripcionService.obtenerPrescripcionesPaciente(usuarioActual.id),
        this.tomaService.obtenerTomasPorPaciente(usuarioActual.id),
      ]);

      this.prescripciones = prescripciones.filter(
        (prescripcion) => prescripcion.estado !== 'anulada'
      );
      this.tomasRegistradas = new Set(
        tomas.map((toma) => toma.claveUnica)
      );
    } catch (error) {
      console.error('Error al cargar las prescripciones', error);
      this.pacienteId = '';
      this.prescripciones = [];
      this.mensajeError = 'No fue posible cargar las prescripciones.';
    } finally {
      this.cargando = false;
    }
  }

  async marcarComoTomado(prescripcion: Prescripcion): Promise<void> {
    if (!this.pacienteId) {
      await this.mostrarMensaje('No hay un paciente autenticado.', 'danger');
      return;
    }

    if (!this.puedeMarcarToma(prescripcion)) {
      await this.mostrarMensaje('Este tratamiento no admite registro de tomas.', 'warning');
      return;
    }

    const hoy = new Date();
    const claveUnica = this.tomaService.generarClaveUnica(prescripcion.id, this.pacienteId, hoy);
    const toma: Toma = {
      id: Date.now().toString(),
      prescripcionId: prescripcion.id,
      pacienteId: this.pacienteId,
      fecha: hoy,
      hora: hoy.toTimeString().slice(0, 5),
      claveUnica,
    };

    try {
      await this.tomaService.registrarToma(toma);
      this.tomasRegistradas.add(claveUnica);
      await this.mostrarMensaje('Medicamento tomado correctamente.', 'success');
    } catch (error) {
      console.error('Error al registrar la toma', error);
      await this.mostrarMensaje('No se pudo registrar la toma.', 'danger');
    }
  }

  volver(): void {
    void this.router.navigate(['/dashboard-paciente']);
  }

  async recargar(): Promise<void> {
    await this.cargarPrescripciones();
  }

  yaRegistrada(prescripcion: Prescripcion): boolean {
    if (!this.pacienteId) {
      return false;
    }

    const hoy = new Date();
    const claveUnica = this.tomaService.generarClaveUnica(prescripcion.id, this.pacienteId, hoy);
    return this.tomasRegistradas.has(claveUnica);
  }

  puedeMarcarToma(prescripcion: Prescripcion): boolean {
    return (
      (prescripcion.estado === 'activa' || prescripcion.estado === 'procesando') &&
      !prescripcion.ocultaParaPaciente
    );
  }

  textoBotonToma(prescripcion: Prescripcion): string {
    if (!this.puedeMarcarToma(prescripcion)) {
      return prescripcion.estado === 'completada' || prescripcion.estado === 'anulada'
        ? 'Tratamiento finalizado'
        : 'No disponible';
    }

    return this.yaRegistrada(prescripcion) ? 'Ya tomado' : 'Marcar como tomado';
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
    const fechaNormalizada =
      fecha instanceof Date ? fecha : new Date(fecha);

    if (Number.isNaN(fechaNormalizada.getTime())) {
      return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat('es-DO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(fechaNormalizada);
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
