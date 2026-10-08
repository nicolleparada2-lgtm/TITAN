import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  Notificacion,
  Notificaciones
} from '../../core/services/notificaciones';

@Component({
  selector: 'app-notificaciones',
  imports: [],
  templateUrl: './notificaciones.html',
  styleUrl: './notificaciones.css'
})
export class NotificacionesPage implements OnInit {

  private notificacionesService = inject(Notificaciones);
  private cdr = inject(ChangeDetectorRef);

  notificaciones: Notificacion[] = [];

  cargando = true;
  procesando = false;
  mensajeError = '';

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.notificacionesService
      .listarNotificaciones()
      .subscribe({
        next: (notificaciones) => {
          this.notificaciones = notificaciones;
          this.cargando = false;
          this.cdr.detectChanges();
        },

        error: (error) => {
          this.cargando = false;

          this.mensajeError =
            error.error?.detail ??
            'No fue posible cargar tus notificaciones.';

          this.cdr.detectChanges();
        }
      });
  }

  cantidadNoLeidas(): number {
    return this.notificaciones.filter(
      notificacion => !notificacion.leida
    ).length;
  }

  cantidadLeidas(): number {
    return this.notificaciones.filter(
      notificacion => notificacion.leida
    ).length;
  }

  hayNoLeidas(): boolean {
    return this.cantidadNoLeidas() > 0;
  }

  marcarComoLeida(notificacion: Notificacion): void {
    if (notificacion.leida) {
      return;
    }

    this.mensajeError = '';

    this.notificacionesService
      .marcarComoLeida(notificacion.id)
      .subscribe({
        next: (actualizada) => {
          this.notificaciones =
            this.notificaciones.map(
              item =>
                item.id === actualizada.id
                  ? actualizada
                  : item
            );

          this.cdr.detectChanges();
        },

        error: (error) => {
          this.mensajeError =
            error.error?.detail ??
            'No fue posible marcar la notificación como leída.';

          this.cdr.detectChanges();
        }
      });
  }

  marcarTodasComoLeidas(): void {
    if (!this.hayNoLeidas() || this.procesando) {
      return;
    }

    this.procesando = true;
    this.mensajeError = '';

    this.notificacionesService
      .marcarTodasComoLeidas()
      .subscribe({
        next: () => {
          this.notificaciones =
            this.notificaciones.map(
              notificacion => ({
                ...notificacion,
                leida: true
              })
            );

          this.procesando = false;
          this.cdr.detectChanges();
        },

        error: (error) => {
          this.procesando = false;

          this.mensajeError =
            error.error?.detail ??
            'No fue posible marcar las notificaciones como leídas.';

          this.cdr.detectChanges();
        }
      });
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) {
      return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat(
      'es-CO',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    ).format(new Date(fecha));
  }

  nombreTipo(tipo: string): string {
    if (tipo === 'MENSUALIDAD_POR_VENCER') {
      return 'Membresía por vencer';
    }

    if (tipo === 'MENSUALIDAD_VENCIDA') {
      return 'Membresía vencida';
    }

    return 'Información';
  }
}