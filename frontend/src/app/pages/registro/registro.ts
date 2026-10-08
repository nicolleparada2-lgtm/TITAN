
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Usuarios } from '../../core/services/usuarios';

@Component({
  selector: 'app-registro',
  imports: [FormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  private usuariosService = inject(Usuarios);
  private router = inject(Router);
  private changeDetectorRef = inject(ChangeDetectorRef);

  nombreCompleto = '';
  nombreUsuario = '';
  correo = '';
  contrasena = '';
  confirmarContrasena = '';

  mensajeError = '';
  mensajeExito = '';
  cargando = false;

  mostrarContrasena = false;
  mostrarConfirmacion = false;

  alternarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  alternarConfirmacion(): void {
    this.mostrarConfirmacion = !this.mostrarConfirmacion;
  }

  registrar(): void {
    if (this.cargando || this.mensajeExito) {
      return;
    }

    this.mensajeError = '';

    const nombreCompleto = this.nombreCompleto.trim();
    const nombreUsuario = this.nombreUsuario.trim();
    const correo = this.correo.trim();

    if (
      !nombreCompleto ||
      !nombreUsuario ||
      !correo ||
      !this.contrasena ||
      !this.confirmarContrasena
    ) {
      this.mensajeError = 'Todos los campos son obligatorios.';
      return;
    }

    const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formatoCorreo.test(correo)) {
      this.mensajeError = 'Ingresa un correo electrónico válido.';
      return;
    }

    if (this.contrasena.length < 8) {
      this.mensajeError =
        'La contraseña debe tener mínimo 8 caracteres.';
      return;
    }

    if (this.contrasena !== this.confirmarContrasena) {
      this.mensajeError = 'Las contraseñas no coinciden.';
      return;
    }

    this.cargando = true;

    this.usuariosService.registrarUsuario({
      nombre_completo: nombreCompleto,
      nombre_usuario: nombreUsuario,
      correo: correo,
      contrasena: this.contrasena
    }).subscribe({
      next: () => {
        this.cargando = false;

        this.mensajeExito =
          'Cuenta creada correctamente. Ahora puedes iniciar sesión.';

        this.changeDetectorRef.detectChanges();

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },

      error: (error) => {
        this.cargando = false;

        if (error.status === 400) {
          const detalle = error.error?.detail;

          this.mensajeError =
            typeof detalle === 'string'
              ? detalle
              : 'Revisa los datos ingresados e inténtalo nuevamente.';
        } else if (error.status === 422) {
          this.mensajeError =
            'Algunos datos no son válidos. Revisa el formulario.';
        } else {
          this.mensajeError =
            'No fue posible crear la cuenta. Inténtalo nuevamente.';
        }

        this.changeDetectorRef.detectChanges();
      }
    });
  }
}
