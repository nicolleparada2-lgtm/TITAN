import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';

import {
  Usuario,
  Usuarios
} from '../../core/services/usuarios';

@Component({
  selector: 'app-perfil',
  imports: [
    FormsModule
  ],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css'
})
export class Perfil implements OnInit {

  private usuariosService = inject(Usuarios);
  private cdr = inject(ChangeDetectorRef);

  usuario: Usuario | null = null;

  formularioPerfil = {
    nombre_completo: '',
    nombre_usuario: '',
    correo: ''
  };

  formularioContrasena = {
    contrasena_actual: '',
    contrasena_nueva: '',
    confirmar_contrasena: ''
  };

  cargando = true;
  guardandoPerfil = false;
  guardandoContrasena = false;

  mensajePerfil = '';
  errorPerfil = '';

  mensajeContrasena = '';
  errorContrasena = '';


  ngOnInit(): void {
    this.cargarPerfil();
  }


  cargarPerfil(): void {
    this.cargando = true;

    this.usuariosService
      .obtenerMiPerfil()
      .subscribe({
        next: (usuario) => {
          this.usuario = usuario;

          this.formularioPerfil = {
            nombre_completo: usuario.nombre_completo,
            nombre_usuario: usuario.nombre_usuario,
            correo: usuario.correo
          };

          this.cargando = false;
          this.cdr.detectChanges();
        },

        error: () => {
          this.cargando = false;

          this.errorPerfil =
            'No fue posible cargar la información de tu perfil.';

          this.cdr.detectChanges();
        }
      });
  }


  guardarPerfil(): void {
    this.mensajePerfil = '';
    this.errorPerfil = '';

    const nombreCompleto =
      this.formularioPerfil.nombre_completo.trim();

    const nombreUsuario =
      this.formularioPerfil.nombre_usuario.trim();

    const correo =
      this.formularioPerfil.correo.trim();


    if (
      !nombreCompleto ||
      !nombreUsuario ||
      !correo
    ) {
      this.errorPerfil =
        'Completa todos los campos del perfil.';

      return;
    }


    this.guardandoPerfil = true;


    this.usuariosService
      .actualizarMiPerfil({
        nombre_completo: nombreCompleto,
        nombre_usuario: nombreUsuario,
        correo
      })
      .subscribe({
        next: (usuario) => {
          this.usuario = usuario;

          this.formularioPerfil = {
            nombre_completo: usuario.nombre_completo,
            nombre_usuario: usuario.nombre_usuario,
            correo: usuario.correo
          };

          this.guardandoPerfil = false;

          this.mensajePerfil =
            'Tus datos se actualizaron correctamente.';

          this.cdr.detectChanges();
        },

        error: (error) => {
          this.guardandoPerfil = false;

          this.errorPerfil =
            error.error?.detail ??
            'No fue posible actualizar tu perfil.';

          this.cdr.detectChanges();
        }
      });
  }


  cambiarContrasena(): void {
    this.mensajeContrasena = '';
    this.errorContrasena = '';

    const actual =
      this.formularioContrasena.contrasena_actual;

    const nueva =
      this.formularioContrasena.contrasena_nueva;

    const confirmar =
      this.formularioContrasena.confirmar_contrasena;


    if (!actual || !nueva || !confirmar) {
      this.errorContrasena =
        'Completa todos los campos de contraseña.';

      return;
    }


    if (nueva.length < 8) {
      this.errorContrasena =
        'La nueva contraseña debe tener mínimo 8 caracteres.';

      return;
    }


    if (nueva !== confirmar) {
      this.errorContrasena =
        'La confirmación no coincide con la nueva contraseña.';

      return;
    }


    this.guardandoContrasena = true;


    this.usuariosService
      .actualizarMiContrasena({
        contrasena_actual: actual,
        contrasena_nueva: nueva
      })
      .subscribe({
        next: (respuesta) => {
          this.guardandoContrasena = false;

          this.mensajeContrasena =
            respuesta.mensaje;

          this.formularioContrasena = {
            contrasena_actual: '',
            contrasena_nueva: '',
            confirmar_contrasena: ''
          };

          this.cdr.detectChanges();
        },

        error: (error) => {
          this.guardandoContrasena = false;

          this.errorContrasena =
            error.error?.detail ??
            'No fue posible actualizar la contraseña.';

          this.cdr.detectChanges();
        }
      });
  }


  iniciales(): string {
    if (!this.usuario) {
      return '';
    }

    return this.usuario.nombre_completo
      .split(' ')
      .filter(
        (parte) => parte.length > 0
      )
      .slice(0, 2)
      .map(
        (parte) => parte[0].toUpperCase()
      )
      .join('');
  }


  formatearRol(rol: string): string {
    if (rol === 'ADMIN') {
      return 'Administrador';
    }

    if (rol === 'ENTRENADOR') {
      return 'Entrenador';
    }

    return 'Usuario';
  }


  formatearFecha(
    fecha: string | null
  ): string {
    if (!fecha) {
      return 'No disponible';
    }

    return new Intl.DateTimeFormat(
      'es-CO',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }
    ).format(
      new Date(fecha)
    );
  }
}