
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { Autenticacion } from '../../core/services/autenticacion';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private autenticacionService = inject(Autenticacion);
  private router = inject(Router);
  private changeDetectorRef = inject(ChangeDetectorRef);

  nombreUsuario = '';
  contrasena = '';
  mensajeError = '';
  cargando = false;
  mostrarContrasena = false;

  alternarContrasena(): void {
    this.mostrarContrasena = !this.mostrarContrasena;
  }

  iniciarSesion(): void {
    if (this.cargando) {
      return;
    }

    this.mensajeError = '';

    const nombreUsuario = this.nombreUsuario.trim();

    if (!nombreUsuario || !this.contrasena) {
      this.mensajeError =
        'Ingresa tu nombre de usuario y contraseña.';
      return;
    }

    this.cargando = true;

    this.autenticacionService.login({
      nombre_usuario: nombreUsuario,
      contrasena: this.contrasena
    }).subscribe({
      next: (respuesta) => {
        this.autenticacionService.guardarToken(
          respuesta.access_token
        );

        this.cargando = false;
        this.changeDetectorRef.detectChanges();

        this.router.navigate(['/dashboard']);
      },

      error: (error) => {
        this.cargando = false;

        if (error.status === 401) {
          this.mensajeError =
            'Usuario o contraseña incorrectos.';
        } else if (error.status === 403) {
          this.mensajeError =
            'Tu usuario no se encuentra activo.';
        } else {
          this.mensajeError =
            'No fue posible iniciar sesión. Inténtalo nuevamente.';
        }

        this.changeDetectorRef.detectChanges();
      }
    });
  }
}
