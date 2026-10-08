import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Autenticacion } from '../services/autenticacion';

export const autenticacionGuard: CanActivateFn = () => {
  const autenticacionService = inject(Autenticacion);
  const router = inject(Router);

  if (autenticacionService.estaAutenticado()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};