import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Autenticacion } from '../services/autenticacion';

export const autenticacionInterceptor: HttpInterceptorFn = (req, next) => {
  const autenticacionService = inject(Autenticacion);
  const token = autenticacionService.obtenerToken();

  if (token) {
    const solicitudConToken = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next(solicitudConToken);
  }

  return next(req);
};