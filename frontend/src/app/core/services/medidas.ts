import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MedidaCorporal {
  id: number;
  usuario_id: number;
  fecha_medicion: string;
  peso: number | null;
  altura: number | null;
  pecho: number | null;
  cintura: number | null;
  cadera: number | null;
  brazo_izquierdo: number | null;
  brazo_derecho: number | null;
  muslo_izquierdo: number | null;
  muslo_derecho: number | null;
}

export interface MedidaCorporalDatos {
  usuario_id: number;
  fecha_medicion: string;
  peso: number | null;
  altura: number | null;
  pecho: number | null;
  cintura: number | null;
  cadera: number | null;
  brazo_izquierdo: number | null;
  brazo_derecho: number | null;
  muslo_izquierdo: number | null;
  muslo_derecho: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class MedidasService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  listarMedidas(): Observable<MedidaCorporal[]> {
    return this.http.get<MedidaCorporal[]>(
      `${this.apiUrl}/medidas`
    );
  }

  listarMedidasUsuario(
    usuarioId: number
  ): Observable<MedidaCorporal[]> {
    return this.http.get<MedidaCorporal[]>(
      `${this.apiUrl}/usuarios/${usuarioId}/medidas`
    );
  }

  crearMedida(
    datos: MedidaCorporalDatos
  ): Observable<MedidaCorporal> {
    return this.http.post<MedidaCorporal>(
      `${this.apiUrl}/medidas`,
      datos
    );
  }

  actualizarMedida(
    id: number,
    datos: MedidaCorporalDatos
  ): Observable<MedidaCorporal> {
    return this.http.put<MedidaCorporal>(
      `${this.apiUrl}/medidas/${id}`,
      datos
    );
  }

  eliminarMedida(id: number): Observable<unknown> {
    return this.http.delete(
      `${this.apiUrl}/medidas/${id}`
    );
  }
}