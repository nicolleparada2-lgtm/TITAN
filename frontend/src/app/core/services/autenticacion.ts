
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface LoginDatos {
  nombre_usuario: string;
  contrasena: string;
}

interface TokenRespuesta {
  access_token: string;
  token_type: string;
}

@Injectable({
  
  providedIn: 'root'
})
export class Autenticacion {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  login(datos: LoginDatos): Observable<TokenRespuesta> {
    return this.http.post<TokenRespuesta>(
      `${this.apiUrl}/login`,
      datos
    );
  }

  guardarToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  obtenerToken(): string | null {
    return localStorage.getItem('access_token');
  }

  cerrarSesion(): void {
    localStorage.removeItem('access_token');
  }

  estaAutenticado(): boolean {
    return this.obtenerToken() !== null;
  }
}

