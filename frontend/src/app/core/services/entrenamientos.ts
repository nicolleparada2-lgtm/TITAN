import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SesionEntrenamiento {
  id: number;
  usuario_id: number;
  rutina_id: number | null;
  fecha_inicio: string;
  fecha_fin: string | null;
  notas: string | null;
}

export interface SesionCrear {
  usuario_id: number;
  rutina_id: number | null;
  fecha_inicio: string;
  notas: string | null;
}

export interface EjercicioEntrenamiento {
  id: number;
  sesion_id: number;
  ejercicio_id: number;
  orden_ejercicio: number;
  notas: string | null;
}

export interface SerieEntrenamiento {
  id: number;
  ejercicio_entrenamiento_id: number;
  numero_serie: number;
  repeticiones: number;
  peso: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class EntrenamientosService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  listarSesiones(): Observable<SesionEntrenamiento[]> {
    return this.http.get<SesionEntrenamiento[]>(
      `${this.apiUrl}/sesiones`
    );
  }

  crearSesion(datos: SesionCrear): Observable<SesionEntrenamiento> {
    return this.http.post<SesionEntrenamiento>(
      `${this.apiUrl}/sesiones`,
      datos
    );
  }

  eliminarSesion(id: number): Observable<unknown> {
    return this.http.delete(
      `${this.apiUrl}/sesiones/${id}`
    );
  }

  finalizarSesion(id: number): Observable<SesionEntrenamiento> {
    return this.http.patch<SesionEntrenamiento>(
      `${this.apiUrl}/sesiones/${id}/finalizar`,
      {}
    );
  }

  listarEjercicios(
    sesionId: number
  ): Observable<EjercicioEntrenamiento[]> {
    return this.http.get<EjercicioEntrenamiento[]>(
      `${this.apiUrl}/sesiones/${sesionId}/ejercicios`
    );
  }

  agregarEjercicio(
    sesionId: number,
    datos: {
      ejercicio_id: number;
      orden_ejercicio: number;
      notas: string | null;
    }
  ): Observable<EjercicioEntrenamiento> {
    return this.http.post<EjercicioEntrenamiento>(
      `${this.apiUrl}/sesiones/${sesionId}/ejercicios`,
      datos
    );
  }

  eliminarEjercicio(
    sesionId: number,
    ejercicioEntrenamientoId: number
  ): Observable<unknown> {
    return this.http.delete(
      `${this.apiUrl}/sesiones/${sesionId}/ejercicios/${ejercicioEntrenamientoId}`
    );
  }

  listarSeries(
    ejercicioEntrenamientoId: number
  ): Observable<SerieEntrenamiento[]> {
    return this.http.get<SerieEntrenamiento[]>(
      `${this.apiUrl}/ejercicios-entrenamiento/${ejercicioEntrenamientoId}/series`
    );
  }

  crearSerie(
    ejercicioEntrenamientoId: number,
    datos: {
      numero_serie: number;
      repeticiones: number;
      peso: number | null;
    }
  ): Observable<SerieEntrenamiento> {
    return this.http.post<SerieEntrenamiento>(
      `${this.apiUrl}/ejercicios-entrenamiento/${ejercicioEntrenamientoId}/series`,
      datos
    );
  }

  eliminarSerie(serieId: number): Observable<unknown> {
    return this.http.delete(
      `${this.apiUrl}/series/${serieId}`
    );
  }
}