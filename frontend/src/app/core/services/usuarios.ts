import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Usuario {
  id: number;
  nombre_completo: string;
  nombre_usuario: string;
  correo: string;
  rol: string;
  estado: string;
  fecha_creacion: string | null;
}

export interface UsuarioCrear {
  nombre_completo: string;
  nombre_usuario: string;
  correo: string;
  contrasena: string;
}

export interface UsuarioAdministrar {
  rol: string;
  estado: string;
}

export interface PerfilActualizar {
  nombre_completo: string;
  nombre_usuario: string;
  correo: string;
}

export interface ContrasenaActualizar {
  contrasena_actual: string;
  contrasena_nueva: string;
}

export interface MensajeRespuesta {
  mensaje: string;
}

@Injectable({
  providedIn: 'root'
})
export class Usuarios {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  obtenerMiPerfil(): Observable<Usuario> {
    return this.http.get<Usuario>(
      `${this.apiUrl}/mi-perfil`
    );
  }

  actualizarMiPerfil(
    datos: PerfilActualizar
  ): Observable<Usuario> {
    return this.http.put<Usuario>(
      `${this.apiUrl}/mi-perfil`,
      datos
    );
  }

  actualizarMiContrasena(
    datos: ContrasenaActualizar
  ): Observable<MensajeRespuesta> {
    return this.http.put<MensajeRespuesta>(
      `${this.apiUrl}/mi-perfil/contrasena`,
      datos
    );
  }

  registrarUsuario(
    datos: UsuarioCrear
  ): Observable<Usuario> {
    return this.http.post<Usuario>(
      `${this.apiUrl}/usuarios`,
      datos
    );
  }

  listarUsuarios(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(
      `${this.apiUrl}/usuarios`
    );
  }

  obtenerUsuario(
    usuarioId: number
  ): Observable<Usuario> {
    return this.http.get<Usuario>(
      `${this.apiUrl}/usuarios/${usuarioId}`
    );
  }

  administrarUsuario(
    usuarioId: number,
    datos: UsuarioAdministrar
  ): Observable<Usuario> {
    return this.http.patch<Usuario>(
      `${this.apiUrl}/usuarios/${usuarioId}`,
      datos
    );
  }
}