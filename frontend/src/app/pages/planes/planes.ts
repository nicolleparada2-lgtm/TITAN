import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import {
  Mensualidad,
  Mensualidades,
  Plan
} from '../../core/services/mensualidades';

import {
  Usuario,
  Usuarios
} from '../../core/services/usuarios';


@Component({
  selector: 'app-planes',
  imports: [],
  templateUrl: './planes.html',
  styleUrl: './planes.css'
})
export class PlanesPage implements OnInit {

  private mensualidadesService = inject(Mensualidades);
  private usuariosService = inject(Usuarios);
  private cdr = inject(ChangeDetectorRef);

  usuario: Usuario | null = null;

  planes: Plan[] = [];
  mensualidades: Mensualidad[] = [];

  cargando = true;
  mensajeError = '';


  ngOnInit(): void {
    this.cargarInformacion();
  }


  cargarInformacion(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.usuariosService
      .obtenerMiPerfil()
      .subscribe({
        next: (usuario) => {
          this.usuario = usuario;

          this.cargarPlanes();
        },

        error: () => {
          this.cargando = false;

          this.mensajeError =
            'No fue posible cargar la información de tu cuenta.';

          this.cdr.detectChanges();
        }
      });
  }


  cargarPlanes(): void {
    this.mensualidadesService
      .listarPlanes()
      .subscribe({
        next: (planes) => {
          this.planes = planes;

          if (this.usuario?.rol === 'USUARIO') {
            this.cargarMembresiasUsuario();
            return;
          }

          this.cargando = false;
          this.cdr.detectChanges();
        },

        error: () => {
          this.planes = [];
          this.cargando = false;

          this.mensajeError =
            'No fue posible cargar los planes del gimnasio.';

          this.cdr.detectChanges();
        }
      });
  }


  cargarMembresiasUsuario(): void {
    this.mensualidadesService
      .listarMisMensualidades()
      .subscribe({
        next: (mensualidades) => {
          this.mensualidades = mensualidades;

          this.cargando = false;
          this.cdr.detectChanges();
        },

        error: () => {
          this.mensualidades = [];

          this.cargando = false;
          this.cdr.detectChanges();
        }
      });
  }


  esPlanActual(planId: number): boolean {
    return this.mensualidades.some(
      mensualidad =>
        mensualidad.plan_id === planId &&
        mensualidad.estado === 'VIGENTE'
    );
  }


  formatearDinero(valor: number): string {
    return new Intl.NumberFormat(
      'es-CO',
      {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }
    ).format(valor);
  }
}