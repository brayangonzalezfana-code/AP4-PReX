import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const medicoGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const usuarioActual = await authService.obtenerUsuarioActualValidado();

  if (usuarioActual?.rol === 'medico' && usuarioActual.activo) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
