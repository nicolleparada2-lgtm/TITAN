import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { Usuarios } from '../services/usuarios';


export const usuarioGuard: CanActivateFn = () => {
  const usuariosService = inject(Usuarios);
  const router = inject(Router);

  return usuariosService.obtenerMiPerfil().pipe(
    map(usuario => {
      if (usuario.rol === 'USUARIO') {
        return true;
      }

      return router.createUrlTree(['/dashboard']);
    }),
    catchError(() => {
      return of(
        router.createUrlTree(['/login'])
      );
    })
  );
};