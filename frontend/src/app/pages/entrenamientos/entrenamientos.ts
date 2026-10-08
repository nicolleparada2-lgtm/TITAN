
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { EntrenamientosService, EjercicioEntrenamiento, SerieEntrenamiento, SesionEntrenamiento } from '../../core/services/entrenamientos';
import { Ejercicio, EjerciciosService } from '../../core/services/ejercicios';
import { Rutina, RutinasService } from '../../core/services/rutinas';
import { Usuario, Usuarios } from '../../core/services/usuarios';
import { Entrenadores } from '../../core/services/entrenadores';

type TipoConfirmacion = 'FINALIZAR_SESION' | 'ELIMINAR_SESION' | 'QUITAR_EJERCICIO' | 'ELIMINAR_SERIE';

@Component({
  selector: 'app-entrenamientos',
  imports: [FormsModule],
  templateUrl: './entrenamientos.html',
  styleUrl: './entrenamientos.css'
})
export class Entrenamientos implements OnInit {
  private entrenamientosService = inject(EntrenamientosService);
  private ejerciciosService = inject(EjerciciosService);
  private rutinasService = inject(RutinasService);
  private usuariosService = inject(Usuarios);
  private entrenadoresService = inject(Entrenadores);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuario: Usuario | null = null;
  usuarioSeguimiento: Usuario | null = null;
  usuarioId = 0;

  sesiones: SesionEntrenamiento[] = [];
  rutinas: Rutina[] = [];
  ejercicios: Ejercicio[] = [];

  sesionSeleccionada: SesionEntrenamiento | null = null;
  ejerciciosSesion: EjercicioEntrenamiento[] = [];

  seriesPorEjercicio: Record<number, SerieEntrenamiento[]> = {};

  cargando = true;
  guardando = false;
  procesandoConfirmacion = false;

  mensajeError = '';
  mensajeExito = '';

  mostrarNuevaSesion = false;
  mostrarNuevoEjercicio = false;

  rutinaId = 0;
  notasSesion = '';

  ejercicioId = 0;
  ordenEjercicio = 1;
  notasEjercicio = '';

  ejercicioSerieActivo: number | null = null;
  numeroSerie = 1;
  repeticiones = 10;
  peso: number | null = null;

  tipoConfirmacion: TipoConfirmacion | null = null;
  sesionPorEliminar: SesionEntrenamiento | null = null;
  ejercicioPorQuitar: EjercicioEntrenamiento | null = null;
  seriePorEliminar: SerieEntrenamiento | null = null;
  ejercicioIdDeSerie: number | null = null;

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
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
          this.cargarDatosEntrenamiento();
        }
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No fue posible obtener tu perfil.';
        this.cdr.detectChanges();
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
            this.cargarDatosEntrenamiento();
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
          this.cargarDatosEntrenamiento();
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
      ['/entrenamientos'],
      { replaceUrl: true }
    );

    this.cargarDatosEntrenamiento();
  }

  cargarDatosEntrenamiento(): void {
    this.rutinasService.listarRutinas().subscribe({
      next: (rutinas) => {
        this.rutinas = rutinas.filter(
          (rutina) => rutina.usuario_id === this.usuarioId
        );

        this.ejerciciosService.listarEjercicios().subscribe({
          next: (ejercicios) => {
            this.ejercicios = ejercicios;
            this.cargarSesiones();
          },
          error: () => {
            this.cargando = false;
            this.mensajeError = 'No fue posible cargar los ejercicios.';
            this.cdr.detectChanges();
          }
        });
      },
      error: () => {
        this.cargando = false;
        this.mensajeError = 'No fue posible cargar las rutinas.';
        this.cdr.detectChanges();
      }
    });
  }

  cargarSesiones(): void {
    this.entrenamientosService.listarSesiones().subscribe({
      next: (sesiones) => {
        this.sesiones = sesiones.filter(
          (sesion) => sesion.usuario_id === this.usuarioId
        );

        if (this.sesionSeleccionada) {
          const seleccionada = this.sesiones.find(
            (sesion) => sesion.id === this.sesionSeleccionada?.id
          );

          if (seleccionada) {
            this.sesionSeleccionada = seleccionada;
          } else {
            this.limpiarSeleccion();
          }
        }

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.cargando = false;

        this.mostrarError(
          error,
          'No fue posible cargar los entrenamientos.'
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
      return `Consulta y administra los entrenamientos de ${this.usuarioSeguimiento.nombre_completo}.`;
    }

    return 'Registra tus sesiones, ejercicios, series, repeticiones y pesos utilizados.';
  }

  get tituloHistorial(): string {
    if (this.esSeguimiento && this.usuarioSeguimiento) {
      return `Entrenamientos de ${this.usuarioSeguimiento.nombre_completo}`;
    }

    return 'Historial';
  }

  get tituloConfirmacion(): string {
    switch (this.tipoConfirmacion) {
      case 'FINALIZAR_SESION':
        return '¿Finalizar entrenamiento?';

      case 'ELIMINAR_SESION':
        return '¿Eliminar entrenamiento?';

      case 'QUITAR_EJERCICIO':
        return '¿Quitar ejercicio?';

      case 'ELIMINAR_SERIE':
        return '¿Eliminar serie?';

      default:
        return '';
    }
  }

  get descripcionConfirmacion(): string {
    switch (this.tipoConfirmacion) {
      case 'FINALIZAR_SESION':
        return 'Esta sesión se marcará como finalizada y ya no podrás agregar ejercicios ni series.';

      case 'ELIMINAR_SESION':
        return 'La sesión y sus registros se eliminarán de forma permanente. Esta acción no se puede deshacer.';

      case 'QUITAR_EJERCICIO':
        return 'El ejercicio y las series registradas en esta sesión se eliminarán. El ejercicio seguirá disponible en el catálogo.';

      case 'ELIMINAR_SERIE':
        return 'Esta serie se eliminará del entrenamiento. Esta acción no se puede deshacer.';

      default:
        return '';
    }
  }

  get nombreElementoConfirmacion(): string {
    switch (this.tipoConfirmacion) {
      case 'FINALIZAR_SESION':
        return this.sesionSeleccionada
          ? this.obtenerNombreRutina(this.sesionSeleccionada.rutina_id)
          : '';

      case 'ELIMINAR_SESION':
        return this.sesionPorEliminar
          ? this.obtenerNombreRutina(this.sesionPorEliminar.rutina_id)
          : '';

      case 'QUITAR_EJERCICIO':
        return this.ejercicioPorQuitar
          ? this.obtenerNombreEjercicio(this.ejercicioPorQuitar.ejercicio_id)
          : '';

      case 'ELIMINAR_SERIE':
        return this.seriePorEliminar
          ? `Serie ${this.seriePorEliminar.numero_serie}`
          : '';

      default:
        return '';
    }
  }

  get textoBotonConfirmacion(): string {
    switch (this.tipoConfirmacion) {
      case 'FINALIZAR_SESION':
        return this.procesandoConfirmacion
          ? 'Finalizando...'
          : 'Finalizar sesión';

      case 'ELIMINAR_SESION':
        return this.procesandoConfirmacion
          ? 'Eliminando...'
          : 'Eliminar sesión';

      case 'QUITAR_EJERCICIO':
        return this.procesandoConfirmacion
          ? 'Quitando...'
          : 'Quitar ejercicio';

      case 'ELIMINAR_SERIE':
        return this.procesandoConfirmacion
          ? 'Eliminando...'
          : 'Eliminar serie';

      default:
        return '';
    }
  }

  abrirNuevaSesion(): void {
    this.limpiarMensajes();
    this.rutinaId = 0;
    this.notasSesion = '';
    this.mostrarNuevaSesion = true;
  }

  crearSesion(): void {
    if (!this.usuario || !this.usuarioId || this.guardando) {
      return;
    }

    this.limpiarMensajes();
    this.guardando = true;

    const ahora = new Date().toISOString();

    this.entrenamientosService.crearSesion({
      usuario_id: this.usuarioId,
      rutina_id: this.rutinaId || null,
      fecha_inicio: ahora,
      notas: this.notasSesion.trim() || null
    }).subscribe({
      next: (sesion) => {
        this.guardando = false;
        this.mostrarNuevaSesion = false;
        this.mensajeExito =
          'Sesión de entrenamiento iniciada correctamente.';

        this.sesiones = [sesion, ...this.sesiones];
        this.seleccionarSesion(sesion);
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.guardando = false;

        this.mostrarError(
          error,
          'No fue posible iniciar la sesión.'
        );
      }
    });
  }

  seleccionarSesion(sesion: SesionEntrenamiento): void {
    this.sesionSeleccionada = sesion;
    this.mostrarNuevoEjercicio = false;
    this.ejercicioSerieActivo = null;
    this.ejerciciosSesion = [];
    this.seriesPorEjercicio = {};

    const sesionId = sesion.id;

    this.entrenamientosService.listarEjercicios(sesionId).subscribe({
      next: (ejercicios) => {
        if (this.sesionSeleccionada?.id !== sesionId) {
          return;
        }

        this.ejerciciosSesion = ejercicios;

        for (const ejercicio of ejercicios) {
          this.cargarSeries(ejercicio.id);
        }

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.mostrarError(
          error,
          'No fue posible cargar el detalle de la sesión.'
        );
      }
    });
  }

  finalizarSesion(): void {
    if (
      !this.sesionSeleccionada ||
      !this.sesionActiva(this.sesionSeleccionada) ||
      this.procesandoConfirmacion
    ) {
      return;
    }

    this.limpiarMensajes();
    this.tipoConfirmacion = 'FINALIZAR_SESION';
  }

  eliminarSesion(sesion: SesionEntrenamiento): void {
    if (this.procesandoConfirmacion) {
      return;
    }

    this.limpiarMensajes();
    this.sesionPorEliminar = sesion;
    this.tipoConfirmacion = 'ELIMINAR_SESION';
  }

  eliminarEjercicio(ejercicio: EjercicioEntrenamiento): void {
    if (
      !this.sesionSeleccionada ||
      !this.sesionActiva(this.sesionSeleccionada) ||
      this.procesandoConfirmacion
    ) {
      return;
    }

    this.limpiarMensajes();
    this.ejercicioPorQuitar = ejercicio;
    this.tipoConfirmacion = 'QUITAR_EJERCICIO';
  }

  eliminarSerie(
    ejercicioId: number,
    serie: SerieEntrenamiento
  ): void {
    if (
      !this.sesionSeleccionada ||
      !this.sesionActiva(this.sesionSeleccionada) ||
      this.procesandoConfirmacion
    ) {
      return;
    }

    this.limpiarMensajes();
    this.ejercicioIdDeSerie = ejercicioId;
    this.seriePorEliminar = serie;
    this.tipoConfirmacion = 'ELIMINAR_SERIE';
  }

  cerrarConfirmacion(): void {
    if (this.procesandoConfirmacion) {
      return;
    }

    this.limpiarConfirmacion();
  }

  confirmarAccion(): void {
    if (!this.tipoConfirmacion || this.procesandoConfirmacion) {
      return;
    }

    switch (this.tipoConfirmacion) {
      case 'FINALIZAR_SESION':
        this.confirmarFinalizarSesion();
        break;

      case 'ELIMINAR_SESION':
        this.confirmarEliminarSesion();
        break;

      case 'QUITAR_EJERCICIO':
        this.confirmarQuitarEjercicio();
        break;

      case 'ELIMINAR_SERIE':
        this.confirmarEliminarSerie();
        break;
    }
  }

  private confirmarFinalizarSesion(): void {
    if (!this.sesionSeleccionada) {
      return;
    }

    const id = this.sesionSeleccionada.id;

    this.procesandoConfirmacion = true;
    this.limpiarMensajes();

    this.entrenamientosService.finalizarSesion(id).subscribe({
      next: (sesion) => {
        this.sesiones = this.sesiones.map(
          (item) => item.id === id ? sesion : item
        );

        if (this.sesionSeleccionada?.id === id) {
          this.sesionSeleccionada = sesion;
          this.mostrarNuevoEjercicio = false;
          this.ejercicioSerieActivo = null;
        }

        this.procesandoConfirmacion = false;
        this.limpiarConfirmacion();
        this.mensajeExito = 'Sesión finalizada correctamente.';
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.procesandoConfirmacion = false;

        this.mostrarError(
          error,
          'No fue posible finalizar la sesión.'
        );
      }
    });
  }

  private confirmarEliminarSesion(): void {
    if (!this.sesionPorEliminar) {
      return;
    }

    const id = this.sesionPorEliminar.id;

    this.procesandoConfirmacion = true;
    this.limpiarMensajes();

    this.entrenamientosService.eliminarSesion(id).subscribe({
      next: () => {
        this.sesiones = this.sesiones.filter(
          (sesion) => sesion.id !== id
        );

        if (this.sesionSeleccionada?.id === id) {
          this.limpiarSeleccion();
        }

        this.procesandoConfirmacion = false;
        this.limpiarConfirmacion();
        this.mensajeExito = 'Sesión eliminada correctamente.';
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.procesandoConfirmacion = false;

        this.mostrarError(
          error,
          'No fue posible eliminar la sesión.'
        );
      }
    });
  }

  private confirmarQuitarEjercicio(): void {
    if (!this.sesionSeleccionada || !this.ejercicioPorQuitar) {
      return;
    }

    const sesionId = this.sesionSeleccionada.id;
    const ejercicioId = this.ejercicioPorQuitar.id;

    this.procesandoConfirmacion = true;
    this.limpiarMensajes();

    this.entrenamientosService
      .eliminarEjercicio(sesionId, ejercicioId)
      .subscribe({
        next: () => {
          if (this.sesionSeleccionada?.id === sesionId) {
            this.ejerciciosSesion = this.ejerciciosSesion.filter(
              (ejercicio) => ejercicio.id !== ejercicioId
            );

            delete this.seriesPorEjercicio[ejercicioId];

            if (this.ejercicioSerieActivo === ejercicioId) {
              this.ejercicioSerieActivo = null;
            }
          }

          this.procesandoConfirmacion = false;
          this.limpiarConfirmacion();
          this.mensajeExito = 'Ejercicio eliminado del entrenamiento.';
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.procesandoConfirmacion = false;

          this.mostrarError(
            error,
            'No fue posible eliminar el ejercicio.'
          );
        }
      });
  }

  private confirmarEliminarSerie(): void {
    if (
      !this.seriePorEliminar ||
      this.ejercicioIdDeSerie === null
    ) {
      return;
    }

    const serieId = this.seriePorEliminar.id;
    const ejercicioId = this.ejercicioIdDeSerie;

    this.procesandoConfirmacion = true;
    this.limpiarMensajes();

    this.entrenamientosService.eliminarSerie(serieId).subscribe({
      next: () => {
        this.seriesPorEjercicio[ejercicioId] = (
          this.seriesPorEjercicio[ejercicioId] || []
        ).filter(
          (serie) => serie.id !== serieId
        );

        this.procesandoConfirmacion = false;
        this.limpiarConfirmacion();
        this.mensajeExito = 'Serie eliminada correctamente.';
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.procesandoConfirmacion = false;

        this.mostrarError(
          error,
          'No fue posible eliminar la serie.'
        );
      }
    });
  }

  abrirNuevoEjercicio(): void {
    if (
      !this.sesionSeleccionada ||
      !this.sesionActiva(this.sesionSeleccionada)
    ) {
      return;
    }

    this.ejercicioId = 0;
    this.ordenEjercicio = this.ejerciciosSesion.length + 1;
    this.notasEjercicio = '';
    this.mostrarNuevoEjercicio = true;
  }

  agregarEjercicio(): void {
    if (
      !this.sesionSeleccionada ||
      !this.sesionActiva(this.sesionSeleccionada) ||
      this.guardando
    ) {
      return;
    }

    this.limpiarMensajes();

    if (!this.ejercicioId) {
      this.mensajeError = 'Selecciona un ejercicio.';
      return;
    }

    if (!Number.isInteger(this.ordenEjercicio) || this.ordenEjercicio < 1) {
      this.mensajeError = 'El orden debe ser un número mayor que cero.';
      return;
    }

    const sesion = this.sesionSeleccionada;

    this.guardando = true;

    this.entrenamientosService.agregarEjercicio(
      sesion.id,
      {
        ejercicio_id: this.ejercicioId,
        orden_ejercicio: this.ordenEjercicio,
        notas: this.notasEjercicio.trim() || null
      }
    ).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarNuevoEjercicio = false;
        this.mensajeExito = 'Ejercicio agregado al entrenamiento.';

        if (this.sesionSeleccionada?.id === sesion.id) {
          this.seleccionarSesion(sesion);
        }
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

  abrirNuevaSerie(ejercicio: EjercicioEntrenamiento): void {
    if (
      !this.sesionSeleccionada ||
      !this.sesionActiva(this.sesionSeleccionada)
    ) {
      return;
    }

    this.ejercicioSerieActivo = ejercicio.id;

    const seriesActuales =
      this.seriesPorEjercicio[ejercicio.id] ?? [];

    this.numeroSerie = Math.max(
      0,
      ...seriesActuales.map((serie) => serie.numero_serie)
    ) + 1;

    this.repeticiones = 10;
    this.peso = null;
  }

  crearSerie(ejercicio: EjercicioEntrenamiento): void {
    if (
      !this.sesionSeleccionada ||
      !this.sesionActiva(this.sesionSeleccionada) ||
      this.guardando
    ) {
      return;
    }

    this.limpiarMensajes();

    if (
      !Number.isInteger(this.numeroSerie) ||
      this.numeroSerie < 1 ||
      !Number.isInteger(this.repeticiones) ||
      this.repeticiones < 1
    ) {
      this.mensajeError =
        'Número de serie y repeticiones deben ser mayores que cero.';
      return;
    }

    if (
      this.peso !== null &&
      (!Number.isFinite(this.peso) || this.peso < 0)
    ) {
      this.mensajeError = 'El peso no puede ser negativo.';
      return;
    }

    this.guardando = true;

    this.entrenamientosService.crearSerie(
      ejercicio.id,
      {
        numero_serie: this.numeroSerie,
        repeticiones: this.repeticiones,
        peso: this.peso
      }
    ).subscribe({
      next: () => {
        this.guardando = false;
        this.ejercicioSerieActivo = null;
        this.mensajeExito = 'Serie registrada correctamente.';
        this.cargarSeries(ejercicio.id);
      },
      error: (error) => {
        this.guardando = false;

        this.mostrarError(
          error,
          'No fue posible registrar la serie.'
        );
      }
    });
  }

  cargarSeries(ejercicioEntrenamientoId: number): void {
    this.entrenamientosService
      .listarSeries(ejercicioEntrenamientoId)
      .subscribe({
        next: (series) => {
          const existe = this.ejerciciosSesion.some(
            (ejercicio) => ejercicio.id === ejercicioEntrenamientoId
          );

          if (!existe) {
            return;
          }

          this.seriesPorEjercicio[ejercicioEntrenamientoId] = series;
          this.cdr.detectChanges();
        },
        error: () => {
          this.seriesPorEjercicio[ejercicioEntrenamientoId] = [];
          this.cdr.detectChanges();
        }
      });
  }

  obtenerNombreEjercicio(id: number): string {
    return (
      this.ejercicios.find(
        (ejercicio) => ejercicio.id === id
      )?.nombre ?? 'Ejercicio'
    );
  }

  obtenerNombreRutina(id: number | null): string {
    if (!id) {
      return 'Entrenamiento libre';
    }

    return (
      this.rutinas.find(
        (rutina) => rutina.id === id
      )?.nombre ?? `Rutina #${id}`
    );
  }

  formatearFecha(fecha: string): string {
    const fechaConvertida = new Date(fecha);

    if (Number.isNaN(fechaConvertida.getTime())) {
      return fecha;
    }

    return fechaConvertida.toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  sesionActiva(sesion: SesionEntrenamiento): boolean {
    return sesion.fecha_fin === null;
  }

  volverMisUsuarios(): void {
    this.router.navigate(['/mis-usuarios']);
  }

  private limpiarSeleccion(): void {
    this.sesionSeleccionada = null;
    this.ejerciciosSesion = [];
    this.seriesPorEjercicio = {};
    this.mostrarNuevoEjercicio = false;
    this.ejercicioSerieActivo = null;
  }

  private limpiarConfirmacion(): void {
    this.tipoConfirmacion = null;
    this.sesionPorEliminar = null;
    this.ejercicioPorQuitar = null;
    this.seriePorEliminar = null;
    this.ejercicioIdDeSerie = null;
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
