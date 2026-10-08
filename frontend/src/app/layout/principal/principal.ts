
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { Autenticacion } from '../../core/services/autenticacion';
import { Notificaciones } from '../../core/services/notificaciones';
import { Tema } from '../../core/services/tema';
import { Usuario, Usuarios } from '../../core/services/usuarios';

@Component({
  selector: 'app-principal',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './principal.html',
  styleUrl: './principal.css'
})
export class Principal implements OnInit {
  private usuariosService = inject(Usuarios);
  private notificacionesService = inject(Notificaciones);
  private autenticacionService = inject(Autenticacion);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  readonly temaService = inject(Tema);

  usuario: Usuario | null = null;
  cantidadNotificacionesNoLeidas = 0;

  constructor() {
    this.escucharNotificaciones();
  }

  ngOnInit(): void {
    this.cargarPerfil();
    this.notificacionesService.actualizarContador();
  }

  cargarPerfil(): void {
    this.usuariosService.obtenerMiPerfil().subscribe({
      next: (usuario) => {
        this.usuario = usuario;
        this.cdr.detectChanges();
      },
      error: () => {
        this.autenticacionService.cerrarSesion();
        this.router.navigate(['/login']);
      }
    });
  }

  escucharNotificaciones(): void {
    this.notificacionesService.cantidadNoLeidas$
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (cantidad) => {
          this.cantidadNotificacionesNoLeidas = cantidad;
          this.cdr.detectChanges();
        }
      });
  }

  cambiarTema(): void {
    this.temaService.alternarModo();
  }

  esAdmin(): boolean {
    return this.usuario?.rol === 'ADMIN';
  }

  esEntrenador(): boolean {
    return this.usuario?.rol === 'ENTRENADOR';
  }

  esUsuario(): boolean {
    return this.usuario?.rol === 'USUARIO';
  }

  inicialesUsuario(): string {
    if (!this.usuario) {
      return '';
    }

    return this.usuario.nombre_completo
      .split(' ')
      .filter((parte) => parte.length > 0)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join('');
  }

  cerrarSesion(): void {
    this.autenticacionService.cerrarSesion();
    this.router.navigate(['/login']);
  }
}
