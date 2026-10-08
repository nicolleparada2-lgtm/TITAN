
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { EjercicioRutina, Rutina, RutinasService } from '../../core/services/rutinas';
import { Ejercicio, EjerciciosService } from '../../core/services/ejercicios';
import { Usuario, Usuarios } from '../../core/services/usuarios';
import { Entrenadores } from '../../core/services/entrenadores';

@Component({
  selector: 'app-rutinas',
  imports: [FormsModule],
  templateUrl: './rutinas.html',
  styleUrl: './rutinas.css'
})
export class Rutinas implements OnInit {
  private rutinasService = inject(RutinasService);
  private ejerciciosService = inject(EjerciciosService);
  private usuariosService = inject(Usuarios);
  private entrenadoresService = inject(Entrenadores);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuario: Usuario | null = null;
  usuarioSeguimiento: Usuario | null = null;

  rutinas: Rutina[] = [];
  ejercicios: Ejercicio[] = [];
  ejerciciosRutina: EjercicioRutina[] = [];

  rutinaSeleccionada: Rutina | null = null;

  cargando = true;
  guardando = false;
  eliminando = false;

  mensajeError = '';
  mensajeExito = '';

  mostrarFormulario = false;
  editando = false;
  rutinaEditandoId: number | null = null;

  nombre = '';
  descripcion = '';
  usuarioId = 0;

  mostrarFormularioEjercicio = false;

  ejercicioId = 0;
  series = 3;
  repeticiones = 10;
  descansoSegundos = 60;
  ordenEjercicio = 1;

  busqueda = '';

  rutinaPorEliminar: Rutina | null = null;
  ejercicioPorQuitar: EjercicioRutina | null = null;

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

        if (usuarioParametro && usuarioParametro !== usuario.id) {
          this.cargarUsuarioSeguimiento(usuarioParametro);
        } else {
          this.usuarioSeguimiento = null;
          this.usuarioId = usuario.id;
          this.cargarEjercicios();
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
            this.cargarEjercicios();
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
          this.cargarEjercicios();
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
      ['/rutinas'],
      { replaceUrl: true }
    );

    this.cargarEjercicios();
  }

  cargarEjercicios(): void {
    this.ejerciciosService.listarEjercicios().subscribe({
      next: (ejercicios) => {
        this.ejercicios = ejercicios;
        this.cargarRutinas();
      },
      error: (error) => {
        this.cargando = false;

        this.mostrarError(
          error,
          'No fue posible cargar los ejercicios.'
        );
      }
    });
  }

  cargarRutinas(): void {
    this.rutinasService.listarRutinas().subscribe({
      next: (rutinas) => {
        this.rutinas = rutinas.filter(
          (rutina) => rutina.usuario_id === this.usuarioId
        );

        this.rutinaSeleccionada = null;
        this.ejerciciosRutina = [];
        this.mostrarFormularioEjercicio = false;

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.cargando = false;

        this.mostrarError(
          error,
          'No fue posible cargar las rutinas.'
        );
      }
    });
  }

  get esSeguimiento(): boolean {
    return !!this.usuario &&
      this.usuarioId !== 0 &&
      this.usuarioId !== this.usuario.id;
  }

  get tituloRutinas(): string {
    if (this.esSeguimiento && this.usuarioSeguimiento) {
      return `Rutinas de ${this.usuarioSeguimiento.nombre_completo}`;
    }

    return 'Mis rutinas';
  }

  get descripcionPagina(): string {
    if (this.esSeguimiento && this.usuarioSeguimiento) {
      return `Consulta y administra las rutinas de ${this.usuarioSeguimiento.nombre_completo}.`;
    }

    return 'Organiza tus ejercicios, series, repeticiones y tiempos de descanso.';
  }

  get rutinasFiltradas(): Rutina[] {
    const texto = this.busqueda.trim().toLowerCase();

    if (!texto) {
      return this.rutinas;
    }

    return this.rutinas.filter(
      (rutina) =>
        rutina.nombre.toLowerCase().includes(texto) ||
        (rutina.descripcion ?? '').toLowerCase().includes(texto)
    );
  }

  abrirFormulario(): void {
    this.limpiarFormulario();

    if (!this.usuarioId && this.usuario) {
      this.usuarioId = this.usuario.id;
    }

    this.mostrarFormulario = true;
  }

  editarRutina(rutina: Rutina): void {
    this.rutinaEditandoId = rutina.id;
    this.editando = true;
    this.mostrarFormulario = true;

    this.usuarioId = rutina.usuario_id;
    this.nombre = rutina.nombre;
    this.descripcion = rutina.descripcion ?? '';

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
  }

  guardarRutina(): void {
    if (this.guardando) {
      return;
    }

    this.limpiarMensajes();

    if (!this.nombre.trim()) {
      this.mensajeError = 'El nombre de la rutina es obligatorio.';
      return;
    }

    if (!this.usuarioId) {
      this.mensajeError =
        'No se pudo determinar el usuario de la rutina.';
      return;
    }

    const datos = {
      usuario_id: this.usuarioId,
      nombre: this.nombre.trim(),
      descripcion: this.descripcion.trim() || null
    };

    this.guardando = true;

    if (this.editando && this.rutinaEditandoId !== null) {
      this.rutinasService
        .actualizarRutina(this.rutinaEditandoId, datos)
        .subscribe({
          next: () => {
            this.guardando = false;
            this.mostrarFormulario = false;
            this.mensajeExito = 'Rutina actualizada correctamente.';

            this.limpiarFormulario();
            this.cargarRutinas();
          },
          error: (error) => {
            this.guardando = false;

            this.mostrarError(
              error,
              'No fue posible actualizar la rutina.'
            );
          }
        });

      return;
    }

    this.rutinasService.crearRutina(datos).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;
        this.mensajeExito = 'Rutina creada correctamente.';

        this.limpiarFormulario();
        this.cargarRutinas();
      },
      error: (error) => {
        this.guardando = false;

        this.mostrarError(
          error,
          'No fue posible crear la rutina.'
        );
      }
    });
  }

  eliminarRutina(rutina: Rutina): void {
    if (this.eliminando) {
      return;
    }

    this.limpiarMensajes();
    this.rutinaPorEliminar = rutina;
  }

  cerrarConfirmacionRutina(): void {
    if (this.eliminando) {
      return;
    }

    this.rutinaPorEliminar = null;
  }

  confirmarEliminarRutina(): void {
    if (!this.rutinaPorEliminar || this.eliminando) {
      return;
    }

    const id = this.rutinaPorEliminar.id;

    this.eliminando = true;
    this.limpiarMensajes();

    this.rutinasService.eliminarRutina(id).subscribe({
      next: () => {
        this.rutinas = this.rutinas.filter(
          (rutina) => rutina.id !== id
        );

        if (this.rutinaSeleccionada?.id === id) {
          this.rutinaSeleccionada = null;
          this.ejerciciosRutina = [];
          this.mostrarFormularioEjercicio = false;
        }

        this.eliminando = false;
        this.rutinaPorEliminar = null;
        this.mensajeExito = 'Rutina eliminada correctamente.';

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.eliminando = false;

        this.mostrarError(
          error,
          'No fue posible eliminar la rutina.'
        );
      }
    });
  }

  seleccionarRutina(rutina: Rutina): void {
    this.rutinaSeleccionada = rutina;
    this.mostrarFormularioEjercicio = false;
    this.cargarEjerciciosRutina();
  }

  cargarEjerciciosRutina(): void {
    if (!this.rutinaSeleccionada) {
      return;
    }

    this.rutinasService
      .listarEjerciciosRutina(this.rutinaSeleccionada.id)
      .subscribe({
        next: (ejercicios) => {
          this.ejerciciosRutina = ejercicios;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.mostrarError(
            error,
            'No fue posible cargar los ejercicios de la rutina.'
          );
        }
      });
  }

  abrirAgregarEjercicio(): void {
    this.ejercicioId = 0;
    this.series = 3;
    this.repeticiones = 10;
    this.descansoSegundos = 60;
    this.ordenEjercicio = this.ejerciciosRutina.length + 1;

    this.mostrarFormularioEjercicio = true;
  }

  cancelarAgregarEjercicio(): void {
    this.mostrarFormularioEjercicio = false;
  }

  agregarEjercicio(): void {
    if (!this.rutinaSeleccionada || this.guardando) {
      return;
    }

    this.limpiarMensajes();

    if (!this.ejercicioId) {
      this.mensajeError = 'Selecciona un ejercicio.';
      return;
    }

    if (
      this.series < 1 ||
      this.repeticiones < 1 ||
      this.ordenEjercicio < 1
    ) {
      this.mensajeError =
        'Series, repeticiones y orden deben ser mayores que cero.';
      return;
    }

    const datos = {
      ejercicio_id: this.ejercicioId,
      series: this.series,
      repeticiones: this.repeticiones,
      descanso_segundos:
        this.descansoSegundos > 0
          ? this.descansoSegundos
          : null,
      orden_ejercicio: this.ordenEjercicio
    };

    this.guardando = true;

    this.rutinasService
      .agregarEjercicio(this.rutinaSeleccionada.id, datos)
      .subscribe({
        next: () => {
          this.guardando = false;
          this.mostrarFormularioEjercicio = false;
          this.mensajeExito = 'Ejercicio agregado a la rutina.';

          this.cargarEjerciciosRutina();
        },
        error: (error) => {
          this.guardando = false;

          this.mostrarError(
            error,
            'No fue posible agregar el ejercicio.'
          );
        }
      });
  }

  quitarEjercicio(item: EjercicioRutina): void {
    if (!this.rutinaSeleccionada || this.eliminando) {
      return;
    }

    this.limpiarMensajes();
    this.ejercicioPorQuitar = item;
  }

  cerrarConfirmacionEjercicio(): void {
    if (this.eliminando) {
      return;
    }

    this.ejercicioPorQuitar = null;
  }

  confirmarQuitarEjercicio(): void {
    if (
      !this.rutinaSeleccionada ||
      !this.ejercicioPorQuitar ||
      this.eliminando
    ) {
      return;
    }

    const rutinaId = this.rutinaSeleccionada.id;
    const ejercicioRutinaId = this.ejercicioPorQuitar.id;

    this.eliminando = true;
    this.limpiarMensajes();

    this.rutinasService
      .eliminarEjercicio(rutinaId, ejercicioRutinaId)
      .subscribe({
        next: () => {
          this.ejerciciosRutina = this.ejerciciosRutina.filter(
            (item) => item.id !== ejercicioRutinaId
          );

          this.eliminando = false;
          this.ejercicioPorQuitar = null;
          this.mensajeExito = 'Ejercicio eliminado de la rutina.';

          this.cdr.detectChanges();
        },
        error: (error) => {
          this.eliminando = false;

          this.mostrarError(
            error,
            'No fue posible quitar el ejercicio.'
          );
        }
      });
  }

  volverMisUsuarios(): void {
    this.router.navigate(['/mis-usuarios']);
  }

  obtenerNombreEjercicio(ejercicioId: number): string {
    return (
      this.ejercicios.find(
        (ejercicio) => ejercicio.id === ejercicioId
      )?.nombre ?? 'Ejercicio'
    );
  }

  obtenerGrupoEjercicio(ejercicioId: number): string {
    const ejercicio = this.ejercicios.find(
      (item) => item.id === ejercicioId
    );

    if (!ejercicio) {
      return '';
    }

    return ejercicio.descripcion ?? 'Ejercicio del catálogo';
  }

  private limpiarFormulario(): void {
    this.editando = false;
    this.rutinaEditandoId = null;
    this.nombre = '';
    this.descripcion = '';
  }

  private limpiarMensajes(): void {
    this.mensajeError = '';
    this.mensajeExito = '';
  }

  private mostrarError(error: any, mensaje: string): void {
    const detalle = error?.error?.detail;

    this.mensajeError =
      typeof detalle === 'string'
        ? detalle
        : mensaje;

    this.cdr.detectChanges();
  }
}
