import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
} from '@ionic/angular/standalone';

import { AuthService } from '../../../services/auth.service';
import { PrescripcionService } from '../../../services/prescripcion.service';
import { TomaService } from '../../../services/toma.service';

interface ResumenAdministrativo {
  pacientes: number;
  medicos: number;
  prescripciones: number;
  tomas: number;
}

@Component({
  selector: 'app-dashboard-admin',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
})
export class DashboardAdminPage implements OnInit {
  resumen: ResumenAdministrativo = {
    pacientes: 0,
    medicos: 0,
    prescripciones: 0,
    tomas: 0,
  };

  cargando = true;
  mensajeError = '';

  private readonly authService = inject(AuthService);
  private readonly prescripcionService = inject(PrescripcionService);
  private readonly tomaService = inject(TomaService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.cargarResumen();
  }

  async cargarResumen(): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';

    try {
      const [pacientes, medicos, prescripciones, tomas] = await Promise.all([
        this.authService.obtenerPacientes(),
        this.authService.obtenerMedicos(),
        this.prescripcionService.obtenerPrescripciones(),
        this.tomaService.obtenerTomas(),
      ]);

      this.resumen = {
        pacientes: pacientes.length,
        medicos: medicos.length,
        prescripciones: prescripciones.length,
        tomas: tomas.length,
      };
    } catch (error) {
      console.error('Error al cargar el resumen administrativo', error);
      this.reiniciarResumen();
      this.mensajeError = 'No fue posible cargar los datos administrativos.';
    } finally {
      this.cargando = false;
    }
  }

  irAMedicos(): void {
    void this.router.navigate(['/admin/medicos']);
  }

  irAPacientes(): void {
    void this.router.navigate(['/admin/pacientes']);
  }

  irAPerfil(): void {
    void this.router.navigate(['/perfil']);
  }

  private reiniciarResumen(): void {
    this.resumen = {
      pacientes: 0,
      medicos: 0,
      prescripciones: 0,
      tomas: 0,
    };
  }
}
