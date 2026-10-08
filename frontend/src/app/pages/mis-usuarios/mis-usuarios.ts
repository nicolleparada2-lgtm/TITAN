import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { Router } from '@angular/router';

import {
  Entrenadores
} from '../../core/services/entrenadores';

import {
  Usuario,
  Usuarios
} from '../../core/services/usuarios';

@Component({
  selector: 'app-mis-usuarios',
  imports: [],
  templateUrl: './mis-usuarios.html',
  styleUrl: './mis-usuarios.css'
})
export class MisUsuarios implements OnInit {
  private entrenadoresService = inject(Entrenadores);
  private usuariosService = inject(Usuarios);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuarioActual: Usuario | null = null;
  usuariosAsignados: Usuario[] = [];

  cargando = true;
  mensajeError = '';

  ngOnInit(): void {
    this.cargarPerfil();
  }

  cargarPerfil(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.usuariosService.obtenerMiPerfil().subscribe({
      next: (usuario) => {
        this.usuarioActual = usuario;

        if (usuario.rol !== 'ENTRENADOR') {
          this.cargando = false;
          this.mensajeError =
            'Esta sección está disponible únicamente para entrenadores.';
          this.cdr.detectChanges();
          return;
        }

        this.cargarUsuariosAsignados(usuario.id);
      },
      error: (error) => {
        this.cargando = false;
        this.mostrarError(
          error,
          'No fue posible cargar tu perfil.'
        );
      }
    });
  }

  cargarUsuariosAsignados(entrenadorId: number): void {
    this.entrenadoresService
      .listarUsuariosEntrenador(entrenadorId)
      .subscribe({
        next: (usuarios) => {
          this.usuariosAsignados = usuarios;
          this.cargando = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.cargando = false;

          this.mostrarError(
            error,
            'No fue posible cargar tus usuarios asignados.'
          );
        }
      });
  }

  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter((parte) => parte.length > 0)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join('');
  }

  verRutinas(usuario: Usuario): void {
    this.router.navigate(
      ['/rutinas'],
      {
        queryParams: {
          usuario: usuario.id
        }
      }
    );
  }

  verObjetivos(usuario: Usuario): void {
    this.router.navigate(
      ['/objetivos'],
      {
        queryParams: {
          usuario: usuario.id
        }
      }
    );
  }

  verMedidas(usuario: Usuario): void {
    this.router.navigate(
      ['/medidas'],
      {
        queryParams: {
          usuario: usuario.id
        }
      }
    );
  }

  verProgreso(usuario: Usuario): void {
    this.router.navigate(
      ['/progreso'],
      {
        queryParams: {
          usuario: usuario.id
        }
      }
    );
  }

  private mostrarError(
    error: any,
    mensaje: string
  ): void {
    this.mensajeError =
      error.error?.detail ?? mensaje;

    this.cdr.detectChanges();
  }
verEntrenamientos(usuario: Usuario): void {
  this.router.navigate(
    ['/entrenamientos'],
    {
      queryParams: {
        usuario: usuario.id
      }
    }
  );
}  
}