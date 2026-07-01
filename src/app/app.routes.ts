import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { authGuard } from './guards/auth.guard';
import { medicoGuard } from './guards/medico.guard';
import { pacienteGuard } from './guards/paciente.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./pages/auth/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'dashboard-paciente',
    loadComponent: () =>
      import('./pages/paciente/dashboard/dashboard.page').then(
        (m) => m.DashboardPage
      ),
    canActivate: [pacienteGuard],
  },
  {
    path: 'mis-prescripciones',
    loadComponent: () =>
      import(
        './pages/paciente/mis-prescripciones/mis-prescripciones.page'
      ).then((m) => m.MisPrescripcionesPage),
    canActivate: [pacienteGuard],
  },
  {
    path: 'paciente/historial',
    loadComponent: () =>
      import('./pages/paciente/historial/historial.page').then(
        (m) => m.HistorialPage
      ),
    canActivate: [pacienteGuard],
  },
  {
    path: 'paciente/recordatorios',
    loadComponent: () =>
      import('./pages/paciente/recordatorios/recordatorios.page').then(
        (m) => m.RecordatoriosPage
      ),
    canActivate: [pacienteGuard],
  },
  {
    path: 'estadisticas',
    loadComponent: () =>
      import('./pages/paciente/estadisticas/estadisticas.page').then(
        (m) => m.EstadisticasPage
      ),
    canActivate: [pacienteGuard],
  },
  {
    path: 'perfil',
    loadComponent: () =>
      import('./pages/perfil/perfil.page').then((m) => m.PerfilPage),
    canActivate: [authGuard],
  },
  {
    path: 'dashboard-medico',
    loadComponent: () =>
      import('./pages/medico/dashboard/dashboard.page').then(
        (m) => m.DashboardPage
      ),
    canActivate: [medicoGuard],
  },
  {
    path: 'admin/dashboard',
    loadComponent: () =>
      import('./pages/admin/dashboard/dashboard.page').then(
        (m) => m.DashboardAdminPage
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/medicos',
    loadComponent: () =>
      import('./pages/admin/medicos/medicos.page').then(
        (m) => m.AdminMedicosPage
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/pacientes',
    loadComponent: () =>
      import('./pages/admin/pacientes/pacientes.page').then(
        (m) => m.AdminPacientesPage
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'medico/pacientes',
    loadComponent: () =>
      import('./pages/medico/pacientes/pacientes.page').then(
        (m) => m.PacientesMedicoPage
      ),
    canActivate: [medicoGuard],
  },
  {
    path: 'medico/prescripciones',
    loadComponent: () =>
      import('./pages/medico/prescripciones/prescripciones.page').then(
        (m) => m.PrescripcionesMedicoPage
      ),
    canActivate: [medicoGuard],
  },
  {
    path: 'medico/nueva-prescripcion',
    loadComponent: () =>
      import(
        './pages/medico/nueva-prescripcion/nueva-prescripcion.page'
      ).then((m) => m.NuevaPrescripcionPage),
    canActivate: [medicoGuard],
  },
  {
    path: 'medico/seguimiento',
    loadComponent: () =>
      import('./pages/medico/seguimiento/seguimiento.page').then(
        (m) => m.SeguimientoPage
      ),
    canActivate: [medicoGuard],
  },
  {
    path: 'medico/reportes',
    loadComponent: () =>
      import('./pages/medico/reportes/reportes.page').then(
        (m) => m.ReportesPage
      ),
    canActivate: [medicoGuard],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
