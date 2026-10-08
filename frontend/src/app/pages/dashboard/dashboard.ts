import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  Router
} from '@angular/router';

import {
  Autenticacion
} from '../../core/services/autenticacion';

import {
  Usuario,
  Usuarios
} from '../../core/services/usuarios';

import {
  Entrenadores
} from '../../core/services/entrenadores';

import {
  ProgresoService,
  ResumenProgreso
} from '../../core/services/progreso';


@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  private usuariosService = inject(Usuarios);
  private autenticacionService = inject(Autenticacion);
  private entrenadoresService = inject(Entrenadores);
  private progresoService = inject(ProgresoService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuario: Usuario | null = null;

  resumenProgreso: ResumenProgreso | null = null;

  usuariosAsignados: Usuario[] = [];
  usuariosSistema: Usuario[] = [];

  cargando = true;
  mensajeError = '';


  ngOnInit(): void {
    this.cargarPerfil();
  }


  cargarPerfil(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.usuariosService
      .obtenerMiPerfil()
      .subscribe({
        next: (usuario) => {
          this.usuario = usuario;

          if (usuario.rol === 'ADMIN') {
            this.cargarDashboardAdmin();
            return;
          }

          if (usuario.rol === 'ENTRENADOR') {
            this.cargarDashboardEntrenador();
            return;
          }

          this.cargarDashboardUsuario();
        },

        error: (error) => {
          this.cargando = false;

          if (error.status === 401) {
            this.autenticacionService.cerrarSesion();
            this.router.navigate(['/login']);
            return;
          }

          this.mensajeError =
            'No fue posible cargar tu perfil.';

          this.cdr.detectChanges();
        }
      });
  }


  cargarDashboardUsuario(): void {
    if (!this.usuario) {
      return;
    }

    this.progresoService
      .obtenerResumen(this.usuario.id)
      .subscribe({
        next: (resumen) => {
          this.resumenProgreso = resumen;
          this.cargando = false;

          this.cdr.detectChanges();
        },

        error: () => {
          this.resumenProgreso = null;
          this.cargando = false;

          this.cdr.detectChanges();
        }
      });
  }


  cargarDashboardEntrenador(): void {
    if (!this.usuario) {
      return;
    }

    let solicitudesTerminadas = 0;

    const terminarSolicitud = (): void => {
      solicitudesTerminadas++;

      if (solicitudesTerminadas === 2) {
        this.cargando = false;
        this.cdr.detectChanges();
      }
    };


    this.entrenadoresService
      .listarUsuariosEntrenador(
        this.usuario.id
      )
      .subscribe({
        next: (usuarios) => {
          this.usuariosAsignados = usuarios;
          terminarSolicitud();
        },

        error: () => {
          this.usuariosAsignados = [];
          terminarSolicitud();
        }
      });


    this.progresoService
      .obtenerResumen(
        this.usuario.id
      )
      .subscribe({
        next: (resumen) => {
          this.resumenProgreso = resumen;
          terminarSolicitud();
        },

        error: () => {
          this.resumenProgreso = null;
          terminarSolicitud();
        }
      });
  }


  cargarDashboardAdmin(): void {
    this.usuariosService
      .listarUsuarios()
      .subscribe({
        next: (usuarios) => {
          this.usuariosSistema = usuarios;
          this.cargando = false;

          this.cdr.detectChanges();
        },

        error: (error) => {
          this.cargando = false;

          this.mensajeError =
            error.error?.detail ??
            'No fue posible cargar la información administrativa.';

          this.cdr.detectChanges();
        }
      });
  }


  get nombreCorto(): string {
    if (!this.usuario) {
      return '';
    }

    return this.usuario.nombre_completo
      .trim()
      .split(' ')[0];
  }


  get totalUsuarios(): number {
    return this.usuariosSistema.length;
  }


  get totalEntrenadores(): number {
    return this.usuariosSistema.filter(
      usuario =>
        usuario.rol === 'ENTRENADOR'
    ).length;
  }


  get totalUsuariosRegulares(): number {
    return this.usuariosSistema.filter(
      usuario =>
        usuario.rol === 'USUARIO'
    ).length;
  }


  get totalActivos(): number {
    return this.usuariosSistema.filter(
      usuario =>
        usuario.estado === 'ACTIVO'
    ).length;
  }


  get objetivosActivos(): number {
    return (
      this.resumenProgreso
        ?.objetivos_en_progreso ?? 0
    );
  }


  get objetivosCompletados(): number {
    return (
      this.resumenProgreso
        ?.objetivos_completados ?? 0
    );
  }


  get totalSesiones(): number {
    return (
      this.resumenProgreso
        ?.total_sesiones ?? 0
    );
  }


  get pesoActual(): string {
    const peso =
      this.resumenProgreso?.peso_actual;

    if (
      peso === null ||
      peso === undefined
    ) {
      return '—';
    }

    return `${Number(peso).toFixed(2)} kg`;
  }


  irA(ruta: string): void {
    this.router.navigate([ruta]);
  }


  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter(parte => parte.length > 0)
      .slice(0, 2)
      .map(
        parte =>
          parte[0].toUpperCase()
      )
      .join('');
  }
}