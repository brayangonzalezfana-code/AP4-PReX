import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const pacienteGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const usuarioActual = await authService.obtenerUsuarioActualValidado();

  if (usuarioActual?.rol === 'paciente' && usuarioActual.activo) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
