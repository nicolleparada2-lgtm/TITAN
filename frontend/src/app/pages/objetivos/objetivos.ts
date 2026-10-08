
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { Objetivo, ObjetivosService } from '../../core/services/objetivos';
import { Usuario, Usuarios } from '../../core/services/usuarios';
import { Entrenadores } from '../../core/services/entrenadores';

@Component({
  selector: 'app-objetivos',
  imports: [FormsModule],
  templateUrl: './objetivos.html',
  styleUrl: './objetivos.css'
})
export class Objetivos implements OnInit {
  private objetivosService = inject(ObjetivosService);
  private usuariosService = inject(Usuarios);
  private entrenadoresService = inject(Entrenadores);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  usuario: Usuario | null = null;
  usuarioSeguimiento: Usuario | null = null;
  usuarioId = 0;

  objetivos: Objetivo[] = [];

  cargando = true;
  guardando = false;
  eliminando = false;
  mostrarFormulario = false;
  editando = false;

  objetivoEditandoId: number | null = null;
  objetivoPorEliminar: Objetivo | null = null;

  titulo = '';
  descripcion = '';
  tipoObjetivo = 'PESO';
  valorObjetivo: number | null = null;
  unidad = 'kg';
  fechaInicio = '';
  fechaObjetivo = '';
  estado = 'EN_PROGRESO';

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

        if (usuarioParametro && usuarioParametro !== usuario.id) {
          this.cargarUsuarioSeguimiento(usuarioParametro);
        } else {
          this.usuarioSeguimiento = null;
          this.usuarioId = usuario.id;
          this.cargarObjetivos();
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
            this.cargarObjetivos();
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
          this.cargarObjetivos();
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
      ['/objetivos'],
      { replaceUrl: true }
    );

    this.cargarObjetivos();
  }

  cargarObjetivos(): void {
    this.objetivosService.listarObjetivos().subscribe({
      next: (objetivos) => {
        this.objetivos = objetivos.filter(
          (objetivo) => objetivo.usuario_id === this.usuarioId
        );

        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.cargando = false;

        this.mostrarError(
          error,
          'No fue posible cargar los objetivos.'
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
      return `Consulta y administra los objetivos de ${this.usuarioSeguimiento.nombre_completo}.`;
    }

    return 'Define metas y realiza seguimiento a tus resultados.';
  }

  abrirFormulario(): void {
    this.limpiarFormulario();
    this.fechaInicio = this.fechaActual();
    this.mostrarFormulario = true;
  }

  editarObjetivo(objetivo: Objetivo): void {
    this.editando = true;
    this.objetivoEditandoId = objetivo.id;

    this.titulo = objetivo.titulo;
    this.descripcion = objetivo.descripcion ?? '';
    this.tipoObjetivo = objetivo.tipo_objetivo;
    this.valorObjetivo = objetivo.valor_objetivo;
    this.unidad = objetivo.unidad;
    this.fechaInicio = objetivo.fecha_inicio;
    this.fechaObjetivo = objetivo.fecha_objetivo ?? '';
    this.estado = objetivo.estado;

    this.mostrarFormulario = true;

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  guardarObjetivo(): void {
    if (!this.usuarioId || this.guardando) {
      return;
    }

    this.limpiarMensajes();

    if (!this.titulo.trim()) {
      this.mensajeError = 'El título es obligatorio.';
      return;
    }

    if (this.valorObjetivo === null) {
      this.mensajeError = 'Ingresa el valor del objetivo.';
      return;
    }

    if (!this.fechaInicio) {
      this.mensajeError = 'Selecciona una fecha de inicio.';
      return;
    }

    this.guardando = true;

    if (this.editando && this.objetivoEditandoId !== null) {
      this.objetivosService
        .actualizarObjetivo(this.objetivoEditandoId, {
          titulo: this.titulo.trim(),
          descripcion: this.descripcion.trim() || null,
          tipo_objetivo: this.tipoObjetivo,
          valor_objetivo: this.valorObjetivo,
          unidad: this.unidad.trim(),
          fecha_inicio: this.fechaInicio,
          fecha_objetivo: this.fechaObjetivo || null,
          estado: this.estado
        })
        .subscribe({
          next: () => {
            this.guardando = false;
            this.mostrarFormulario = false;
            this.mensajeExito = 'Objetivo actualizado correctamente.';

            this.limpiarFormulario();
            this.cargarObjetivos();
          },
          error: (error) => {
            this.guardando = false;

            this.mostrarError(
              error,
              'No fue posible actualizar el objetivo.'
            );
          }
        });

      return;
    }

    this.objetivosService
      .crearObjetivo({
        usuario_id: this.usuarioId,
        titulo: this.titulo.trim(),
        descripcion: this.descripcion.trim() || null,
        tipo_objetivo: this.tipoObjetivo,
        valor_objetivo: this.valorObjetivo,
        unidad: this.unidad.trim(),
        fecha_inicio: this.fechaInicio,
        fecha_objetivo: this.fechaObjetivo || null
      })
      .subscribe({
        next: () => {
          this.guardando = false;
          this.mostrarFormulario = false;
          this.mensajeExito = 'Objetivo creado correctamente.';

          this.limpiarFormulario();
          this.cargarObjetivos();
        },
        error: (error) => {
          this.guardando = false;

          this.mostrarError(
            error,
            'No fue posible crear el objetivo.'
          );
        }
      });
  }

  eliminarObjetivo(objetivo: Objetivo): void {
    if (this.eliminando) {
      return;
    }

    this.limpiarMensajes();
    this.objetivoPorEliminar = objetivo;
  }

  cerrarConfirmacion(): void {
    if (this.eliminando) {
      return;
    }

    this.objetivoPorEliminar = null;
  }

  confirmarEliminacion(): void {
    if (!this.objetivoPorEliminar || this.eliminando) {
      return;
    }

    const id = this.objetivoPorEliminar.id;

    this.eliminando = true;
    this.limpiarMensajes();

    this.objetivosService.eliminarObjetivo(id).subscribe({
      next: () => {
        this.eliminando = false;
        this.objetivoPorEliminar = null;

        this.objetivos = this.objetivos.filter(
          (objetivo) => objetivo.id !== id
        );

        this.mensajeExito = 'Objetivo eliminado correctamente.';
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.eliminando = false;

        this.mostrarError(
          error,
          'No fue posible eliminar el objetivo.'
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

  cambiarTipo(): void {
    if (this.tipoObjetivo === 'PESO') {
      this.unidad = 'kg';
    } else if (this.tipoObjetivo === 'MEDIDA') {
      this.unidad = 'cm';
    } else if (this.tipoObjetivo === 'SESIONES') {
      this.unidad = 'sesiones';
    } else {
      this.unidad = '';
    }
  }

  claseEstado(estado: string): string {
    if (estado === 'COMPLETADO') {
      return 'completado';
    }

    if (estado === 'CANCELADO') {
      return 'cancelado';
    }

    return 'progreso';
  }

  textoEstado(estado: string): string {
    if (estado === 'EN_PROGRESO') {
      return 'En progreso';
    }

    if (estado === 'COMPLETADO') {
      return 'Completado';
    }

    if (estado === 'CANCELADO') {
      return 'Cancelado';
    }

    return estado;
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
    this.objetivoEditandoId = null;

    this.titulo = '';
    this.descripcion = '';
    this.tipoObjetivo = 'PESO';
    this.valorObjetivo = null;
    this.unidad = 'kg';
    this.fechaInicio = '';
    this.fechaObjetivo = '';
    this.estado = 'EN_PROGRESO';
  }

  private limpiarMensajes(): void {
    this.mensajeExito = '';
    this.mensajeError = '';
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
