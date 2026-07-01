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

import { Prescripcion } from '../../../interfaces/prescripcion.interface';
import { AuthService } from '../../../services/auth.service';
import { PrescripcionService } from '../../../services/prescripcion.service';

@Component({
  selector: 'app-recordatorios-paciente',
  templateUrl: './recordatorios.page.html',
  styleUrls: ['./recordatorios.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
  ],
})
export class RecordatoriosPage implements OnInit {
  recordatorios: Prescripcion[] = [];
  cargando = true;
  mensajeError = '';

  private readonly authService = inject(AuthService);
  private readonly prescripcionService = inject(PrescripcionService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.cargarRecordatorios();
  }

  async cargarRecordatorios(): Promise<void> {
    this.cargando = true;
    this.mensajeError = '';

    try {
      const usuarioActual = await this.authService.getUsuarioActual();

      if (!usuarioActual || usuarioActual.rol !== 'paciente') {
        this.recordatorios = [];
        this.mensajeError = 'No hay un paciente autenticado.';
        return;
      }

      const prescripciones =
        await this.prescripcionService.obtenerPrescripcionesPaciente(
          usuarioActual.id
        );

      this.recordatorios = prescripciones.filter(
        (prescripcion) => prescripcion.activa
      );
    } catch (error) {
      console.error('Error al cargar recordatorios', error);
      this.recordatorios = [];
      this.mensajeError = 'No fue posible cargar tus recordatorios.';
    } finally {
      this.cargando = false;
    }
  }

  volver(): void {
    void this.router.navigate(['/dashboard-paciente']);
  }
}
