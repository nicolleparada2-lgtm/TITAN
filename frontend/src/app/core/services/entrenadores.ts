import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Usuario } from './usuarios';

export interface EntrenadorUsuario {
  id: number;
  entrenador_id: number;
  usuario_id: number;
  fecha_asignacion: string | null;
}

export interface EntrenadorUsuarioCrear {
  entrenador_id: number;
  usuario_id: number;
}

@Injectable({
  providedIn: 'root'
})
export class Entrenadores {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000';

  listarAsignaciones(): Observable<EntrenadorUsuario[]> {
    return this.http.get<EntrenadorUsuario[]>(
      `${this.apiUrl}/entrenador-usuarios`
    );
  }

  crearAsignacion(
    datos: EntrenadorUsuarioCrear
  ): Observable<EntrenadorUsuario> {
    return this.http.post<EntrenadorUsuario>(
      `${this.apiUrl}/entrenador-usuarios`,
      datos
    );
  }

  eliminarAsignacion(
    asignacionId: number
  ): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(
      `${this.apiUrl}/entrenador-usuarios/${asignacionId}`
    );
  }

  listarUsuariosEntrenador(
    entrenadorId: number
  ): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(
      `${this.apiUrl}/entrenadores/${entrenadorId}/usuarios`
    );
  }
}