
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { EntrenadorUsuario, Entrenadores } from '../../core/services/entrenadores';
import { Usuario, Usuarios } from '../../core/services/usuarios';

@Component({
  selector: 'app-asignaciones',
  imports: [FormsModule],
  templateUrl: './asignaciones.html',
  styleUrl: './asignaciones.css'
})
export class Asignaciones implements OnInit {
  private entrenadoresService = inject(Entrenadores);
  private usuariosService = inject(Usuarios);
  private cdr = inject(ChangeDetectorRef);

  usuarios: Usuario[] = [];
  entrenadores: Usuario[] = [];
  usuariosDisponibles: Usuario[] = [];
  asignaciones: EntrenadorUsuario[] = [];

  entrenadorId: number | null = null;
  usuarioId: number | null = null;

  cargando = true;
  guardando = false;
  eliminando = false;

  asignacionPorEliminar: EntrenadorUsuario | null = null;

  mensajeExito = '';
  mensajeError = '';

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;

    let terminadas = 0;

    const terminar = (): void => {
      terminadas++;

      if (terminadas === 2) {
        this.prepararUsuarios();
        this.cargando = false;
        this.cdr.detectChanges();
      }
    };

    this.usuariosService.listarUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        terminar();
      },
      error: (error) => {
        this.mostrarError(
          error,
          'No fue posible cargar los usuarios.'
        );
        terminar();
      }
    });

    this.entrenadoresService.listarAsignaciones().subscribe({
      next: (asignaciones) => {
        this.asignaciones = asignaciones;
        terminar();
      },
      error: (error) => {
        this.mostrarError(
          error,
          'No fue posible cargar las asignaciones.'
        );
        terminar();
      }
    });
  }

  prepararUsuarios(): void {
    this.entrenadores = this.usuarios.filter(
      (usuario) =>
        usuario.rol === 'ENTRENADOR' &&
        usuario.estado === 'ACTIVO'
    );

    this.usuariosDisponibles = this.usuarios.filter(
      (usuario) =>
        usuario.rol === 'USUARIO' &&
        usuario.estado === 'ACTIVO'
    );
  }

  crearAsignacion(): void {
    if (this.guardando) {
      return;
    }

    this.limpiarMensajes();

    if (
      this.entrenadorId === null ||
      this.usuarioId === null
    ) {
      this.mensajeError =
        'Selecciona un entrenador y un usuario.';
      return;
    }

    this.guardando = true;

    this.entrenadoresService.crearAsignacion({
      entrenador_id: this.entrenadorId,
      usuario_id: this.usuarioId
    }).subscribe({
      next: () => {
        this.guardando = false;
        this.entrenadorId = null;
        this.usuarioId = null;

        this.mensajeExito =
          'Usuario asignado correctamente.';

        this.cargarDatos();
      },
      error: (error) => {
        this.guardando = false;

        this.mostrarError(
          error,
          'No fue posible crear la asignación.'
        );
      }
    });
  }

  eliminarAsignacion(asignacion: EntrenadorUsuario): void {
    if (this.eliminando) {
      return;
    }

    this.limpiarMensajes();
    this.asignacionPorEliminar = asignacion;
  }

  cancelarEliminacion(): void {
    if (this.eliminando) {
      return;
    }

    this.asignacionPorEliminar = null;
  }

  confirmarEliminacion(): void {
    if (!this.asignacionPorEliminar || this.eliminando) {
      return;
    }

    const asignacionId = this.asignacionPorEliminar.id;

    this.eliminando = true;
    this.limpiarMensajes();

    this.entrenadoresService
      .eliminarAsignacion(asignacionId)
      .subscribe({
        next: () => {
          this.eliminando = false;
          this.asignacionPorEliminar = null;

          this.mensajeExito =
            'Asignación eliminada correctamente.';

          this.cargarDatos();
        },
        error: (error) => {
          this.eliminando = false;
          this.asignacionPorEliminar = null;

          this.mostrarError(
            error,
            'No fue posible eliminar la asignación.'
          );
        }
      });
  }

  nombreUsuario(usuarioId: number): string {
    return (
      this.usuarios.find(
        (usuario) => usuario.id === usuarioId
      )?.nombre_completo ?? `Usuario #${usuarioId}`
    );
  }

  correoUsuario(usuarioId: number): string {
    return (
      this.usuarios.find(
        (usuario) => usuario.id === usuarioId
      )?.correo ?? ''
    );
  }

  iniciales(usuarioId: number): string {
    const nombre = this.nombreUsuario(usuarioId);

    return nombre
      .split(' ')
      .filter((parte) => parte.length > 0)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join('');
  }

  formatearFecha(fecha: string | null): string {
    if (!fecha) {
      return '—';
    }

    return new Date(fecha).toLocaleDateString('es-CO');
  }

  private limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  private mostrarError(error: any, mensaje: string): void {
    this.mensajeError =
      error.error?.detail ?? mensaje;

    this.cdr.detectChanges();
  }
}
