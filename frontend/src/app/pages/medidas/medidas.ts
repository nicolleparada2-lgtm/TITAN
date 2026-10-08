
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MedidaCorporal, MedidaCorporalDatos, MedidasService } from '../../core/services/medidas';
import { Usuario, Usuarios } from '../../core/services/usuarios';
import { Entrenadores } from '../../core/services/entrenadores';

@Component({
  selector: 'app-medidas',
  imports: [FormsModule],
  templateUrl: './medidas.html',
  styleUrl: './medidas.css'
})
export class Medidas implements OnInit {
  private medidasService = inject(MedidasService);
  private usuariosService = inject(Usuarios);
  private entrenadoresService = inject(Entrenadores);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuario: Usuario | null = null;
  usuarioSeguimiento: Usuario | null = null;
  usuarioId = 0;

  medidas: MedidaCorporal[] = [];

  cargando = true;
  guardando = false;
  eliminando = false;
  mostrarFormulario = false;
  editando = false;

  medidaEditandoId: number | null = null;
  medidaPorEliminar: MedidaCorporal | null = null;

  fechaMedicion = '';

  peso: number | null = null;
  altura: number | null = null;
  pecho: number | null = null;
  cintura: number | null = null;
  cadera: number | null = null;
  brazoIzquierdo: number | null = null;
  brazoDerecho: number | null = null;
  musloIzquierdo: number | null = null;
  musloDerecho: number | null = null;

  mensajeExito = '';
  mensajeError = '';

  ngOnInit(): void {
    this.cargarTodo();
  }

  cargarTodo(): void {
    this.cargando = true;
    this.limpiarMensajes();

    this.usuariosService.obtenerMiPerfil().subscribe({
      next: (usuario) => {
        this.usuario = usuario;

        const usuarioParametro = Number(
          this.route.snapshot.queryParamMap.get('usuario')
        );

        if (
          usuarioParametro &&
          usuarioParametro !== usuario.id
        ) {
          this.cargarUsuarioSeguimiento(usuarioParametro);
        } else {
          this.usuarioSeguimiento = null;
          this.usuarioId = usuario.id;
          this.cargarMedidas();
        }
      },
      error: (error) => {
        this.cargando = false;

        this.mostrarError(
          error,
          'No fue posible obtener tu perfil.'
        );
      }
    });
  }

  cargarUsuarioSeguimiento(usuarioId: number): void {
    if (!this.usuario) {
      return;
    }

    if (this.usuario.rol === 'ENTRENADOR') {
      this.entrenadoresService
        .listarUsuariosEntrenador(this.usuario.id)
        .subscribe({
          next: (usuarios) => {
            const usuarioEncontrado = usuarios.find(
              (item) => item.id === usuarioId
            );

            if (!usuarioEncontrado) {
              this.cargando = false;
              this.mensajeError =
                'Este usuario no se encuentra entre tus usuarios asignados.';
              this.cdr.detectChanges();
              return;
            }

            this.usuarioSeguimiento = usuarioEncontrado;
            this.usuarioId = usuarioEncontrado.id;
            this.cargarMedidas();
          },
          error: (error) => {
            this.cargando = false;

            this.mostrarError(
              error,
              'No fue posible cargar la información del usuario asignado.'
            );
          }
        });

      return;
    }

    if (this.usuario.rol === 'ADMIN') {
      this.usuariosService.listarUsuarios().subscribe({
        next: (usuarios) => {
          const usuarioEncontrado = usuarios.find(
            (item) => item.id === usuarioId
          );

          if (!usuarioEncontrado) {
            this.cargando = false;
            this.mensajeError =
              'No fue posible encontrar el usuario seleccionado.';
            this.cdr.detectChanges();
            return;
          }

          this.usuarioSeguimiento = usuarioEncontrado;
          this.usuarioId = usuarioEncontrado.id;
          this.cargarMedidas();
        },
        error: (error) => {
          this.cargando = false;

          this.mostrarError(
            error,
            'No fue posible obtener el usuario seleccionado.'
          );
        }
      });

      return;
    }

    this.usuarioSeguimiento = null;
    this.usuarioId = this.usuario.id;

    this.router.navigate(
      ['/medidas'],
      { replaceUrl: true }
    );

    this.cargarMedidas();
  }

  cargarMedidas(): void {
    this.medidasService.listarMedidas().subscribe({
      next: (medidas) => {
        this.medidas = medidas.filter(
          (medida) => medida.usuario_id === this.usuarioId
        );

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.cargando = false;

        this.mostrarError(
          error,
          'No fue posible cargar las medidas corporales.'
        );
      }
    });
  }

  get esSeguimiento(): boolean {
    return !!this.usuario &&
      this.usuarioId !== 0 &&
      this.usuarioId !== this.usuario.id;
  }

  get descripcionPagina(): string {
    if (this.esSeguimiento && this.usuarioSeguimiento) {
      return `Consulta y administra las medidas corporales de ${this.usuarioSeguimiento.nombre_completo}.`;
    }

    return 'Registra tus medidas para observar los cambios de tu cuerpo a lo largo del tiempo.';
  }

  abrirFormulario(): void {
    this.limpiarFormulario();
    this.fechaMedicion = this.fechaActual();
    this.mostrarFormulario = true;
  }

  editarMedida(medida: MedidaCorporal): void {
    this.editando = true;
    this.medidaEditandoId = medida.id;

    this.fechaMedicion = medida.fecha_medicion;
    this.peso = medida.peso;
    this.altura = medida.altura;
    this.pecho = medida.pecho;
    this.cintura = medida.cintura;
    this.cadera = medida.cadera;
    this.brazoIzquierdo = medida.brazo_izquierdo;
    this.brazoDerecho = medida.brazo_derecho;
    this.musloIzquierdo = medida.muslo_izquierdo;
    this.musloDerecho = medida.muslo_derecho;

    this.mostrarFormulario = true;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  guardarMedida(): void {
    if (this.guardando || !this.usuarioId) {
      return;
    }

    this.limpiarMensajes();

    if (!this.fechaMedicion) {
      this.mensajeError = 'Selecciona la fecha de medición.';
      return;
    }

    if (!this.hayAlgunaMedida()) {
      this.mensajeError = 'Ingresa al menos una medida corporal.';
      return;
    }

    const datos: MedidaCorporalDatos = {
      usuario_id: this.usuarioId,
      fecha_medicion: this.fechaMedicion,
      peso: this.peso,
      altura: this.altura,
      pecho: this.pecho,
      cintura: this.cintura,
      cadera: this.cadera,
      brazo_izquierdo: this.brazoIzquierdo,
      brazo_derecho: this.brazoDerecho,
      muslo_izquierdo: this.musloIzquierdo,
      muslo_derecho: this.musloDerecho
    };

    this.guardando = true;

    if (this.editando && this.medidaEditandoId !== null) {
      this.medidasService
        .actualizarMedida(this.medidaEditandoId, datos)
        .subscribe({
          next: () => {
            this.guardando = false;
            this.mostrarFormulario = false;
            this.mensajeExito = 'Medición actualizada correctamente.';

            this.limpiarFormulario();
            this.cargarMedidas();
          },
          error: (error) => {
            this.guardando = false;

            this.mostrarError(
              error,
              'No fue posible actualizar la medición.'
            );
          }
        });

      return;
    }

    this.medidasService.crearMedida(datos).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.mensajeExito = 'Medición registrada correctamente.';

        this.limpiarFormulario();
        this.cargarMedidas();
      },
      error: (error) => {
        this.guardando = false;

        this.mostrarError(
          error,
          'No fue posible registrar la medición.'
        );
      }
    });
  }

  eliminarMedida(medida: MedidaCorporal): void {
    if (this.eliminando) {
      return;
    }

    this.limpiarMensajes();
    this.medidaPorEliminar = medida;
  }

  cerrarConfirmacion(): void {
    if (this.eliminando) {
      return;
    }

    this.medidaPorEliminar = null;
  }

  confirmarEliminacion(): void {
    if (!this.medidaPorEliminar || this.eliminando) {
      return;
    }

    const id = this.medidaPorEliminar.id;

    this.eliminando = true;
    this.limpiarMensajes();

    this.medidasService.eliminarMedida(id).subscribe({
      next: () => {
        this.eliminando = false;
        this.medidaPorEliminar = null;

        this.medidas = this.medidas.filter(
          (medida) => medida.id !== id
        );

        this.mensajeExito = 'Medición eliminada correctamente.';
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.eliminando = false;

        this.mostrarError(
          error,
          'No fue posible eliminar la medición.'
        );
      }
    });
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
  }

  volverMisUsuarios(): void {
    this.router.navigate(['/mis-usuarios']);
  }

  formatearFecha(fecha: string): string {
    const partes = fecha.split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  private hayAlgunaMedida(): boolean {
    return [
      this.peso,
      this.altura,
      this.pecho,
      this.cintura,
      this.cadera,
      this.brazoIzquierdo,
      this.brazoDerecho,
      this.musloIzquierdo,
      this.musloDerecho
    ].some((valor) => valor !== null);
  }

  private fechaActual(): string {
    const fecha = new Date();

    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private limpiarFormulario(): void {
    this.editando = false;
    this.medidaEditandoId = null;

    this.fechaMedicion = '';

    this.peso = null;
    this.altura = null;
    this.pecho = null;
    this.cintura = null;
    this.cadera = null;
    this.brazoIzquierdo = null;
    this.brazoDerecho = null;
    this.musloIzquierdo = null;
    this.musloDerecho = null;
  }

  private limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
  }

  private mostrarError(error: any, mensaje: string): void {
    const detalle = error.error?.detail;

    this.mensajeError =
      typeof detalle === 'string'
        ? detalle
        : mensaje;

    this.cdr.detectChanges();
  }
}
