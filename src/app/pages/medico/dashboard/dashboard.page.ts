import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-dashboard-medico',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonContent,
  ],
})
export class DashboardMedicoPage {
  private readonly router = inject(Router);

  irAPacientes(): void {
    this.router.navigate(['/medico/pacientes']);
  }

  irAPrescripciones(): void {
    this.router.navigate(['/medico/prescripciones']);
  }

  irASeguimiento(): void {
    this.router.navigate(['/medico/seguimiento']);
  }

  irAReportes(): void {
    this.router.navigate(['/medico/reportes']);
  }

  irAPerfil(): void {
    this.router.navigate(['/perfil']);
  }
}

export { DashboardMedicoPage as DashboardPage };
