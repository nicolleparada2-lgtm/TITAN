import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';


export interface Plan {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion_dias: number;
  estado: string;
}


export interface Mensualidad {
  id: number;
  usuario_id: number;
  plan_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  monto: number;
  fecha_pago: string | null;
  estado: string;
}


export interface MensualidadCrear {
  usuario_id: number;
  plan_id: number;
  fecha_inicio: string;
}


export interface MensualidadActualizar {
  plan_id: number;
  fecha_inicio: string;
}


@Injectable({
  providedIn: 'root'
})
export class Mensualidades {
  private http = inject(HttpClient);

  private apiUrl = environment.apiUrl;


  listarPlanes(): Observable<Plan[]> {
    return this.http.get<Plan[]>(
      `${this.apiUrl}/mensualidades/planes`
    );
  }


  listarMensualidades(): Observable<Mensualidad[]> {
    return this.http.get<Mensualidad[]>(
      `${this.apiUrl}/mensualidades`
    );
  }


  listarMisMensualidades(): Observable<Mensualidad[]> {
    return this.http.get<Mensualidad[]>(
      `${this.apiUrl}/mensualidades/mis-mensualidades`
    );
  }


  listarMensualidadesUsuario(
    usuarioId: number
  ): Observable<Mensualidad[]> {
    return this.http.get<Mensualidad[]>(
      `${this.apiUrl}/mensualidades/usuario/${usuarioId}`
    );
  }


  obtenerMensualidad(
    mensualidadId: number
  ): Observable<Mensualidad> {
    return this.http.get<Mensualidad>(
      `${this.apiUrl}/mensualidades/${mensualidadId}`
    );
  }


  crearMensualidad(
    datos: MensualidadCrear
  ): Observable<Mensualidad> {
    return this.http.post<Mensualidad>(
      `${this.apiUrl}/mensualidades`,
      datos
    );
  }


  actualizarMensualidad(
    mensualidadId: number,
    datos: MensualidadActualizar
  ): Observable<Mensualidad> {
    return this.http.put<Mensualidad>(
      `${this.apiUrl}/mensualidades/${mensualidadId}`,
      datos
    );
  }


  eliminarMensualidad(
    mensualidadId: number
  ): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(
      `${this.apiUrl}/mensualidades/${mensualidadId}`
    );
  }
}