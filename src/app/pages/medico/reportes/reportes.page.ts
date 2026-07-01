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
import { MedicoPacienteService } from '../../../services/medico-paciente.service';
import { PrescripcionService } from '../../../services/prescripcion.service';
import { TomaService } from '../../../services/toma.service';

interface ResumenReportes {
  pacientes: number;
  prescripciones: number;
  tomas: number;
  tratamientosActivos: number;
  tratamientosCompletados: number;
  tratamientosAnulados: number;
  adherenciaGeneral: number;
}

@Component({
  selector: 'app-reportes-medico',
  templateUrl: './reportes.page.html',
  styleUrls: ['./reportes.page.scss'],
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
export class ReportesPage implements OnInit {
  resumen: ResumenReportes = {
    pacientes: 0,
    prescripciones: 0,
    tomas: 0,
    tratamientosActivos: 0,
    tratamientosCompletados: 0,
    tratamientosAnulados: 0,
    adherenciaGeneral: 0,
  };

  cargando = true;
  mensajeError = '';
  pacientesRelacionados: Usuario[] = [];
  pacienteFiltro = 'todos';
  estadoFiltro = 'todos';
  fechaDesde = '';
  fechaHasta = '';

  private prescripcionesMedico: Prescripcion[] = [];
  private tomasMedico: Toma[] = [];
  private readonly authService = inject(AuthService);
  private readonly medicoPacienteService = inject(MedicoPacienteService);
  private readonly prescripcionService = inject(PrescripcionService);
  private readonly tomaService = inject(TomaService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.cargarReportes();
  }

  async cargarReportes(): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';

    try {
      const medicoActual = await this.authService.getUsuarioActual();

      if (!medicoActual || medicoActual.rol !== 'medico') {
        this.reiniciarResumen();
        this.mensajeError = 'No hay un médico autenticado.';
        return;
      }

      const [prescripciones, tomas, pacientesRelacionados] = await Promise.all([
        this.prescripcionService.obtenerPrescripciones(),
        this.tomaService.obtenerTomas(),
        this.medicoPacienteService.obtenerPacientesDelMedico(medicoActual.id),
      ]);
      this.prescripcionesMedico = prescripciones.filter(
        (prescripcion) => prescripcion.medicoId === medicoActual.id
      );
      const prescripcionesMedicoIds = new Set(
        this.prescripcionesMedico.map((prescripcion) => prescripcion.id)
      );
      this.tomasMedico = tomas.filter((toma) =>
        prescripcionesMedicoIds.has(toma.prescripcionId)
      );
      this.pacientesRelacionados = pacientesRelacionados;

      this.actualizarResumen();
    } catch (error) {
      console.error('Error al cargar reportes', error);
      this.reiniciarResumen();
      this.mensajeError = 'No fue posible cargar los reportes.';
    } finally {
      this.cargando = false;
    }
  }

  volver(): void {
    void this.router.navigate(['/dashboard-medico']);
  }

  actualizarResumen(): void {
    const prescripcionesFiltradas = this.filtrarPrescripciones(this.prescripcionesMedico);
    const tomasFiltradas = this.filtrarTomas(
      this.tomasMedico,
      prescripcionesFiltradas.map((prescripcion) => prescripcion.id)
    );

    this.resumen = {
      pacientes: new Set(prescripcionesFiltradas.map((prescripcion) => prescripcion.pacienteId)).size,
      prescripciones: prescripcionesFiltradas.length,
      tomas: tomasFiltradas.length,
      tratamientosActivos: prescripcionesFiltradas.filter(
        (prescripcion) => prescripcion.estado === 'activa' || prescripcion.estado === 'procesando'
      ).length,
      tratamientosCompletados: prescripcionesFiltradas.filter(
        (prescripcion) => prescripcion.estado === 'completada'
      ).length,
      tratamientosAnulados: prescripcionesFiltradas.filter(
        (prescripcion) => prescripcion.estado === 'anulada'
      ).length,
      adherenciaGeneral: this.calcularAdherenciaGeneral(prescripcionesFiltradas, tomasFiltradas),
    };
  }

  private reiniciarResumen(): void {
    this.resumen = {
      pacientes: 0,
      prescripciones: 0,
      tomas: 0,
      tratamientosActivos: 0,
      tratamientosCompletados: 0,
      tratamientosAnulados: 0,
      adherenciaGeneral: 0,
    };
    this.prescripcionesMedico = [];
    this.tomasMedico = [];
    this.pacientesRelacionados = [];
  }

  private filtrarPrescripciones(prescripciones: Prescripcion[]): Prescripcion[] {
    return prescripciones.filter((prescripcion) => {
      const coincidePaciente = this.pacienteFiltro === 'todos' || prescripcion.pacienteId === this.pacienteFiltro;
      const coincideEstado = this.estadoFiltro === 'todos' || prescripcion.estado === this.estadoFiltro;
      const fechaInicio = this.fechaDesde ? new Date(this.fechaDesde) : null;
      const fechaFin = this.fechaHasta ? new Date(this.fechaHasta) : null;
      const fechaPrescripcion = new Date(prescripcion.fechaInicio);
      const enRango =
        (!fechaInicio || fechaPrescripcion >= fechaInicio) &&
        (!fechaFin || fechaPrescripcion <= fechaFin);

      return coincidePaciente && coincideEstado && enRango;
    });
  }

  private filtrarTomas(tomas: Toma[], prescripcionesIds: string[]): Toma[] {
    return tomas.filter((toma) => prescripcionesIds.includes(toma.prescripcionId));
  }

  private calcularAdherenciaGeneral(
    prescripciones: Array<{ fechaInicio: Date; fechaFin: Date }>,
    tomas: Array<{ prescripcionId: string }>
  ): number {
    if (prescripciones.length === 0) {
      return 0;
    }

    const totalEsperado = prescripciones.reduce((sum, prescripcion) => {
      const dias = Math.max(
        1,
        Math.ceil(
          (new Date(prescripcion.fechaFin).getTime() -
            new Date(prescripcion.fechaInicio).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1
      );
      return sum + dias;
    }, 0);

    const porcentaje = totalEsperado === 0 ? 0 : Math.round((tomas.length / totalEsperado) * 100);
    return Math.min(100, porcentaje);
  }
}
