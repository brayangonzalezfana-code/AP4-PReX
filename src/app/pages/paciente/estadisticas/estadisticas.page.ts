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

import { AuthService } from '../../../services/auth.service';
import { PrescripcionService } from '../../../services/prescripcion.service';
import { TomaService } from '../../../services/toma.service';

interface ResumenCumplimiento {
  prescripcionesActivas: number;
  prescripcionesCompletadas: number;
  prescripcionesAnuladas: number;
  tomasRegistradas: number;
  cumplimiento: number;
}

@Component({
  selector: 'app-estadisticas',
  templateUrl: './estadisticas.page.html',
  styleUrls: ['./estadisticas.page.scss'],
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
export class EstadisticasPage implements OnInit {
  resumen: ResumenCumplimiento = {
    prescripcionesActivas: 0,
    prescripcionesCompletadas: 0,
    prescripcionesAnuladas: 0,
    tomasRegistradas: 0,
    cumplimiento: 0,
  };

  cargando = true;
  mensajeError = '';

  private readonly authService = inject(AuthService);
  private readonly prescripcionService = inject(PrescripcionService);
  private readonly tomaService = inject(TomaService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.cargarEstadisticas();
  }

  async cargarEstadisticas(): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';

    try {
      const usuarioActual = await this.authService.getUsuarioActual();

      if (!usuarioActual || usuarioActual.rol !== 'paciente') {
        this.reiniciarResumen();
        this.mensajeError = 'No hay un paciente autenticado.';
        return;
      }

      const [prescripciones, tomas] = await Promise.all([
        this.prescripcionService.obtenerPrescripcionesPaciente(
          usuarioActual.id
        ),
        this.tomaService.obtenerTomasPorPaciente(usuarioActual.id),
      ]);

      const prescripcionesActivas = prescripciones.filter(
        (prescripcion) => prescripcion.estado === 'activa'
      ).length;
      const prescripcionesCompletadas = prescripciones.filter(
        (prescripcion) => prescripcion.estado === 'completada'
      ).length;
      const prescripcionesAnuladas = prescripciones.filter(
        (prescripcion) => prescripcion.estado === 'anulada'
      ).length;
      const tomasRegistradas = tomas.length;

      this.resumen = {
        prescripcionesActivas,
        prescripcionesCompletadas,
        prescripcionesAnuladas,
        tomasRegistradas,
        cumplimiento: this.calcularCumplimiento(tomasRegistradas),
      };
    } catch (error) {
      console.error('Error al cargar las estadísticas', error);
      this.reiniciarResumen();
      this.mensajeError = 'No fue posible cargar las estadísticas.';
    } finally {
      this.cargando = false;
    }
  }

  volver(): void {
    void this.router.navigate(['/dashboard-paciente']);
  }

  private calcularCumplimiento(tomasRegistradas: number): number {
    const porcentaje = (tomasRegistradas / 30) * 100;
    return Math.min(100, Math.round(porcentaje * 10) / 10);
  }

  private reiniciarResumen(): void {
    this.resumen = {
      prescripcionesActivas: 0,
      prescripcionesCompletadas: 0,
      prescripcionesAnuladas: 0,
      tomasRegistradas: 0,
      cumplimiento: 0,
    };
  }
}
