import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Objetivo {
  id: number;
  usuario_id: number;
  titulo: string;
  descripcion: string | null;
  tipo_objetivo: string;
  valor_objetivo: number;
  unidad: string;
  fecha_inicio: string;
  fecha_objetivo: string | null;
  estado: string;
}

export interface ObjetivoCrear {
  usuario_id: number;
  titulo: string;
  descripcion: string | null;
  tipo_objetivo: string;
  valor_objetivo: number;
  unidad: string;
  fecha_inicio: string;
  fecha_objetivo: string | null;
}

export interface ObjetivoActualizar {
  titulo: string;
  descripcion: string | null;
  tipo_objetivo: string;
  valor_objetivo: number;
  unidad: string;
  fecha_inicio: string;
  fecha_objetivo: string | null;
  estado: string;
}

@Injectable({
  providedIn: 'root'
})
export class ObjetivosService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000';

  listarObjetivos(): Observable<Objetivo[]> {
    return this.http.get<Objetivo[]>(
      `${this.apiUrl}/objetivos`
    );
  }

  listarObjetivosUsuario(
    usuarioId: number
  ): Observable<Objetivo[]> {
    return this.http.get<Objetivo[]>(
      `${this.apiUrl}/usuarios/${usuarioId}/objetivos`
    );
  }

  crearObjetivo(
    datos: ObjetivoCrear
  ): Observable<Objetivo> {
    return this.http.post<Objetivo>(
      `${this.apiUrl}/objetivos`,
      datos
    );
  }

  actualizarObjetivo(
    id: number,
    datos: ObjetivoActualizar
  ): Observable<Objetivo> {
    return this.http.put<Objetivo>(
      `${this.apiUrl}/objetivos/${id}`,
      datos
    );
  }

  eliminarObjetivo(id: number): Observable<unknown> {
    return this.http.delete(
      `${this.apiUrl}/objetivos/${id}`
    );
  }
}