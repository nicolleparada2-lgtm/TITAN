import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GrupoMuscular {
  id: number;
  nombre: string;
}

export interface Ejercicio {
  id: number;
  grupo_muscular_id: number;
  nombre: string;
  descripcion: string | null;
  instrucciones: string | null;
  fecha_creacion: string | null;
}

export interface EjercicioDatos {
  grupo_muscular_id: number;
  nombre: string;
  descripcion: string | null;
  instrucciones: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class EjerciciosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/ejercicios`;

  listarEjercicios(): Observable<Ejercicio[]> {
    return this.http.get<Ejercicio[]>(this.apiUrl);
  }

  listarGruposMusculares(): Observable<GrupoMuscular[]> {
    return this.http.get<GrupoMuscular[]>(
      `${this.apiUrl}/grupos-musculares`
    );
  }

  crearEjercicio(datos: EjercicioDatos): Observable<Ejercicio> {
    return this.http.post<Ejercicio>(
      this.apiUrl,
      datos
    );
  }

  actualizarEjercicio(
    ejercicioId: number,
    datos: EjercicioDatos
  ): Observable<Ejercicio> {
    return this.http.put<Ejercicio>(
      `${this.apiUrl}/${ejercicioId}`,
      datos
    );
  }

  eliminarEjercicio(ejercicioId: number): Observable<unknown> {
    return this.http.delete(
      `${this.apiUrl}/${ejercicioId}`
    );
  }

  crearGrupoMuscular(nombre: string): Observable<GrupoMuscular> {
    return this.http.post<GrupoMuscular>(
      `${this.apiUrl}/grupos-musculares`,
      { nombre }
    );
  }

  eliminarGrupoMuscular(grupoId: number): Observable<unknown> {
    return this.http.delete(
      `${this.apiUrl}/grupos-musculares/${grupoId}`
    );
  }
}