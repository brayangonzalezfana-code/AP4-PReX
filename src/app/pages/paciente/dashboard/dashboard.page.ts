import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-dashboard-paciente',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonContent,
  ],
})
export class DashboardPacientePage {
  private readonly router = inject(Router);

  irAMisPrescripciones() {
    this.router.navigate(['/mis-prescripciones']);
  }

  irAHistorial(): void {
    this.router.navigate(['/paciente/historial']);
  }

  irARecordatorios(): void {
    this.router.navigate(['/paciente/recordatorios']);
  }

  irAEstadisticas() {
    this.router.navigate(['/estadisticas']);
  }

  irAPerfil() {
    this.router.navigate(['/perfil']);
  }

}

export { DashboardPacientePage as DashboardPage };
