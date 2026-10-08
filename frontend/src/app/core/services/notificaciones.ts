import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';


export interface Notificacion {
  id: number;
  usuario_id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  fecha_creacion: string | null;
}


@Injectable({
  providedIn: 'root'
})
export class Notificaciones {
  private http = inject(HttpClient);

  private apiUrl =
    'http://127.0.0.1:8000/notificaciones';

  private cantidadNoLeidasSubject =
    new BehaviorSubject<number>(0);

  cantidadNoLeidas$ =
    this.cantidadNoLeidasSubject.asObservable();


  listarNotificaciones(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(
      this.apiUrl
    ).pipe(
      tap((notificaciones) => {
        this.actualizarContadorDesdeLista(
          notificaciones
        );
      })
    );
  }


  listarNoLeidas(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(
      `${this.apiUrl}/no-leidas`
    ).pipe(
      tap((notificaciones) => {
        this.cantidadNoLeidasSubject.next(
          notificaciones.length
        );
      })
    );
  }


  marcarComoLeida(
    notificacionId: number
  ): Observable<Notificacion> {
    return this.http.patch<Notificacion>(
      `${this.apiUrl}/${notificacionId}/leer`,
      {}
    ).pipe(
      tap(() => {
        const cantidadActual =
          this.cantidadNoLeidasSubject.value;

        this.cantidadNoLeidasSubject.next(
          Math.max(0, cantidadActual - 1)
        );
      })
    );
  }


  marcarTodasComoLeidas(): Observable<{
    mensaje: string;
  }> {
    return this.http.patch<{
      mensaje: string;
    }>(
      `${this.apiUrl}/leer-todas`,
      {}
    ).pipe(
      tap(() => {
        this.cantidadNoLeidasSubject.next(0);
      })
    );
  }


  actualizarContador(): void {
    this.listarNoLeidas().subscribe({
      error: () => {
        this.cantidadNoLeidasSubject.next(0);
      }
    });
  }


  private actualizarContadorDesdeLista(
    notificaciones: Notificacion[]
  ): void {
    const cantidad =
      notificaciones.filter(
        notificacion => !notificacion.leida
      ).length;

    this.cantidadNoLeidasSubject.next(
      cantidad
    );
  }
}