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
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';

import { Prescripcion } from '../../../interfaces/prescripcion.interface';
import { Toma } from '../../../interfaces/toma.interface';
import { Usuario } from '../../../interfaces/usuario.interface';
import { AuthService } from '../../../services/auth.service';
import { PrescripcionService } from '../../../services/prescripcion.service';
import { TomaService } from '../../../services/toma.service';

interface TomaDetalle {
  toma: Toma;
  prescripcion: Prescripcion | null;
  estado: Prescripcion['estado'];
}

@Component({
  selector: 'app-historial-paciente',
  templateUrl: './historial.page.html',
  styleUrls: ['./historial.page.scss'],
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
export class HistorialPage implements OnInit {
  tomas: TomaDetalle[] = [];
  medicos: Usuario[] = [];
  cargando = true;
  mensajeError = '';
  fechaDesde = '';
  fechaHasta = '';
  medicoFiltro = 'todos';

  private readonly authService = inject(AuthService);
  private readonly prescripcionService = inject(PrescripcionService);
  private readonly tomaService = inject(TomaService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.cargarHistorial();
  }

  async cargarHistorial(): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';

    try {
      const usuarioActual = await this.authService.getUsuarioActual();

      if (!usuarioActual || usuarioActual.rol !== 'paciente') {
        this.mensajeError = 'No hay un paciente autenticado.';
        this.tomas = [];
        return;
      }

      const [tomas, prescripciones, medicos] = await Promise.all([
        this.tomaService.obtenerTomasPorPaciente(usuarioActual.id),
        this.prescripcionService.obtenerPrescripcionesPaciente(
          usuarioActual.id
        ),
        this.authService.obtenerTodosMedicos(),
      ]);

      const prescripcionesPorId = new Map(
        prescripciones.map((prescripcion) => [prescripcion.id, prescripcion])
      );
      const medicosRelacionadosIds = new Set(
        prescripciones.map((prescripcion) => prescripcion.medicoId)
      );

      this.medicos = medicos.filter((medico) =>
        medicosRelacionadosIds.has(medico.id)
      );

      this.tomas = tomas
        .map((toma) => {
          const prescripcion = prescripcionesPorId.get(toma.prescripcionId) ?? null;
          const estado = prescripcion?.estado ?? 'activa';

          return {
            toma,
            prescripcion,
            estado,
          };
        })
        .sort((a, b) => this.obtenerTiempo(b.toma) - this.obtenerTiempo(a.toma));
    } catch (error) {
      console.error('Error al cargar el historial', error);
      this.tomas = [];
      this.medicos = [];
      this.mensajeError = 'No fue posible cargar tu historial.';
    } finally {
      this.cargando = false;
    }
  }

  volver(): void {
    void this.router.navigate(['/dashboard-paciente']);
  }

  get tomasFiltradas(): TomaDetalle[] {
    const fechaInicio = this.crearFechaLocal(this.fechaDesde);
    const fechaFin = this.crearFechaLocal(this.fechaHasta, true);

    return this.tomas.filter((detalle) => {
      const tiempo = this.obtenerTiempo(detalle.toma);
      const despuesDesde = !fechaInicio || tiempo >= fechaInicio.getTime();
      const antesHasta = !fechaFin || tiempo <= fechaFin.getTime();
      const coincideMedico =
        this.medicoFiltro === 'todos' ||
        detalle.prescripcion?.medicoId === this.medicoFiltro;

      return despuesDesde && antesHasta && coincideMedico;
    });
  }

  limpiarFiltros(): void {
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.medicoFiltro = 'todos';
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

  formatearEstado(estado: Prescripcion['estado']): string {
    const estados: Record<Prescripcion['estado'], string> = {
      activa: 'Activa',
      procesando: 'En proceso',
      completada: 'Completada',
      anulada: 'Anulada',
    };

    return estados[estado];
  }

  tieneFiltrosActivos(): boolean {
    return Boolean(
      this.fechaDesde ||
      this.fechaHasta ||
      this.medicoFiltro !== 'todos'
    );
  }

  obtenerNombreMedico(medicoId: string | undefined): string {
    if (!medicoId) {
      return 'No disponible';
    }

    const medico = this.medicos.find((medicoRegistrado) => medicoRegistrado.id === medicoId);
    return medico ? `${medico.nombre} ${medico.apellido}` : 'No disponible';
  }

  private crearFechaLocal(valor: string, finDelDia = false): Date | null {
    if (!valor) {
      return null;
    }

    const partes = valor.split('-').map((parte) => Number(parte));

    if (partes.length !== 3 || partes.some((parte) => Number.isNaN(parte))) {
      return null;
    }

    const [anio, mes, dia] = partes;
    return new Date(
      anio,
      mes - 1,
      dia,
      finDelDia ? 23 : 0,
      finDelDia ? 59 : 0,
      finDelDia ? 59 : 0,
      finDelDia ? 999 : 0
    );
  }

  private obtenerTiempo(toma: Toma): number {
    const fecha = toma.fecha instanceof Date ? toma.fecha : new Date(toma.fecha);
    return Number.isNaN(fecha.getTime()) ? 0 : fecha.getTime();
  }
}
