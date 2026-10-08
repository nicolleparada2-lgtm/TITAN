import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Rutina {
  id: number;
  usuario_id: number;
  nombre: string;
  descripcion: string | null;
  fecha_creacion: string | null;
}

export interface RutinaDatos {
  usuario_id: number;
  nombre: string;
  descripcion: string | null;
}

export interface EjercicioRutina {
  id: number;
  rutina_id: number;
  ejercicio_id: number;
  series: number;
  repeticiones: number;
  descanso_segundos: number | null;
  orden_ejercicio: number;
}

export interface EjercicioRutinaDatos {
  ejercicio_id: number;
  series: number;
  repeticiones: number;
  descanso_segundos: number | null;
  orden_ejercicio: number;
}

@Injectable({
  providedIn: 'root'
})
export class RutinasService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000';

  listarRutinas(): Observable<Rutina[]> {
    return this.http.get<Rutina[]>(`${this.apiUrl}/rutinas`);
  }

  crearRutina(datos: RutinaDatos): Observable<Rutina> {
    return this.http.post<Rutina>(`${this.apiUrl}/rutinas`, datos);
  }

  actualizarRutina(id: number, datos: RutinaDatos): Observable<Rutina> {
    return this.http.put<Rutina>(`${this.apiUrl}/rutinas/${id}`, datos);
  }

  eliminarRutina(id: number): Observable<unknown> {
    return this.http.delete(`${this.apiUrl}/rutinas/${id}`);
  }

  listarEjerciciosRutina(rutinaId: number): Observable<EjercicioRutina[]> {
    return this.http.get<EjercicioRutina[]>(
      `${this.apiUrl}/rutinas/${rutinaId}/ejercicios`
    );
  }

  agregarEjercicio(
    rutinaId: number,
    datos: EjercicioRutinaDatos
  ): Observable<EjercicioRutina> {
    return this.http.post<EjercicioRutina>(
      `${this.apiUrl}/rutinas/${rutinaId}/ejercicios`,
      datos
    );
  }

  eliminarEjercicio(rutinaId: number, ejercicioRutinaId: number): Observable<unknown> {
    return this.http.delete(
      `${this.apiUrl}/rutinas/${rutinaId}/ejercicios/${ejercicioRutinaId}`
    );
  }
}