import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ProgresoPeso {
  fecha: string;
  peso: number;
}

export interface ProgresoMedidas {
  fecha: string;
  pecho: number | null;
  cintura: number | null;
  cadera: number | null;
  brazo_izquierdo: number | null;
  brazo_derecho: number | null;
  muslo_izquierdo: number | null;
  muslo_derecho: number | null;
}

export interface ResumenProgreso {
  usuario_id: number;
  total_sesiones: number;
  total_objetivos: number;
  objetivos_en_progreso: number;
  objetivos_completados: number;
  peso_inicial: number | null;
  peso_actual: number | null;
  cambio_peso: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class ProgresoService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  obtenerPeso(
    usuarioId: number
  ): Observable<ProgresoPeso[]> {
    return this.http.get<ProgresoPeso[]>(
      `${this.apiUrl}/usuarios/${usuarioId}/progreso/peso`
    );
  }

  obtenerMedidas(
    usuarioId: number
  ): Observable<ProgresoMedidas[]> {
    return this.http.get<ProgresoMedidas[]>(
      `${this.apiUrl}/usuarios/${usuarioId}/progreso/medidas`
    );
  }

  obtenerResumen(
    usuarioId: number
  ): Observable<ResumenProgreso> {
    return this.http.get<ResumenProgreso>(
      `${this.apiUrl}/usuarios/${usuarioId}/progreso/resumen`
    );
  }
}