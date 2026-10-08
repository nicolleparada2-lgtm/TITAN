import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  Usuario,
  Usuarios as UsuariosService
} from '../../core/services/usuarios';

@Component({
  selector: 'app-usuarios',
  imports: [FormsModule, SlicePipe],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class Usuarios implements OnInit {
  private usuariosService = inject(UsuariosService);
  private cdr = inject(ChangeDetectorRef);

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];

  cargando = true;
  guardando = false;

  busqueda = '';
  filtroRol = 'TODOS';
  filtroEstado = 'TODOS';

  usuarioEditando: Usuario | null = null;

  rolSeleccionado = '';
  estadoSeleccionado = '';

  mensajeExito = '';
  mensajeError = '';

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando = true;

    this.usuariosService.listarUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios;
        this.aplicarFiltros();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.cargando = false;
        this.mostrarError(
          error,
          'No fue posible cargar los usuarios.'
        );
      }
    });
  }

  aplicarFiltros(): void {
    const texto = this.busqueda
      .trim()
      .toLowerCase();

    this.usuariosFiltrados = this.usuarios.filter(
      (usuario) => {
        const coincideBusqueda =
          !texto ||
          usuario.nombre_completo
            .toLowerCase()
            .includes(texto) ||
          usuario.nombre_usuario
            .toLowerCase()
            .includes(texto) ||
          usuario.correo
            .toLowerCase()
            .includes(texto);

        const coincideRol =
          this.filtroRol === 'TODOS' ||
          usuario.rol === this.filtroRol;

        const coincideEstado =
          this.filtroEstado === 'TODOS' ||
          usuario.estado === this.filtroEstado;

        return (
          coincideBusqueda &&
          coincideRol &&
          coincideEstado
        );
      }
    );
  }

  abrirEdicion(usuario: Usuario): void {
    this.limpiarMensajes();

    this.usuarioEditando = usuario;
    this.rolSeleccionado = usuario.rol;
    this.estadoSeleccionado = usuario.estado;
  }

  cancelarEdicion(): void {
    this.usuarioEditando = null;
    this.rolSeleccionado = '';
    this.estadoSeleccionado = '';
  }

  guardarCambios(): void {
    if (!this.usuarioEditando) {
      return;
    }

    this.limpiarMensajes();
    this.guardando = true;

    this.usuariosService.administrarUsuario(
      this.usuarioEditando.id,
      {
        rol: this.rolSeleccionado,
        estado: this.estadoSeleccionado
      }
    ).subscribe({
      next: () => {
        this.guardando = false;
        this.cancelarEdicion();

        this.mensajeExito =
          'Usuario actualizado correctamente.';

        this.cargarUsuarios();
      },
      error: (error) => {
        this.guardando = false;

        this.mostrarError(
          error,
          'No fue posible actualizar el usuario.'
        );
      }
    });
  }

  claseRol(rol: string): string {
    if (rol === 'ADMIN') {
      return 'admin';
    }

    if (rol === 'ENTRENADOR') {
      return 'entrenador';
    }

    return 'usuario';
  }

  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .filter((parte) => parte.length > 0)
      .slice(0, 2)
      .map((parte) => parte[0].toUpperCase())
      .join('');
  }

  private limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  private mostrarError(
    error: any,
    mensaje: string
  ): void {
    this.mensajeError =
      error.error?.detail ?? mensaje;

    this.cdr.detectChanges();
  }
}