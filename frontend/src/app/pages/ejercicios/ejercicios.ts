
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  Ejercicio,
  EjercicioDatos,
  EjerciciosService,
  GrupoMuscular
} from '../../core/services/ejercicios';
import { Usuario, Usuarios } from '../../core/services/usuarios';

@Component({
  selector: 'app-ejercicios',
  imports: [FormsModule],
  templateUrl: './ejercicios.html',
  styleUrl: './ejercicios.css'
})
export class Ejercicios implements OnInit {
  private ejerciciosService = inject(EjerciciosService);
  private usuariosService = inject(Usuarios);
  private changeDetectorRef = inject(ChangeDetectorRef);

  usuario: Usuario | null = null;

  ejercicios: Ejercicio[] = [];
  gruposMusculares: GrupoMuscular[] = [];

  cargando = true;
  guardando = false;
  eliminando = false;

  mensajeError = '';
  mensajeExito = '';

  mostrarFormulario = false;
  editando = false;
  ejercicioEditandoId: number | null = null;

  ejercicioPorEliminar: Ejercicio | null = null;

  busqueda = '';
  grupoFiltro = 0;

  nombre = '';
  grupoMuscularId = 0;
  descripcion = '';
  instrucciones = '';

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.mensajeError = '';

    this.usuariosService.obtenerMiPerfil().subscribe({
      next: (usuario) => {
        this.usuario = usuario;

        this.ejerciciosService.listarGruposMusculares().subscribe({
          next: (grupos) => {
            this.gruposMusculares = grupos;
            this.cargarEjercicios();
          },
          error: () => {
            this.cargando = false;
            this.mensajeError =
              'No fue posible cargar los grupos musculares.';
            this.changeDetectorRef.detectChanges();
          }
        });
      },
      error: () => {
        this.cargando = false;
        this.mensajeError =
          'No fue posible obtener la información del usuario.';
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  cargarEjercicios(): void {
    this.ejerciciosService.listarEjercicios().subscribe({
      next: (ejercicios) => {
        this.ejercicios = ejercicios;
        this.cargando = false;
        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.cargando = false;
        this.mensajeError =
          'No fue posible cargar los ejercicios.';
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  puedeCrearEditar(): boolean {
    return (
      this.usuario?.rol === 'ADMIN' ||
      this.usuario?.rol === 'ENTRENADOR'
    );
  }

  puedeEliminar(): boolean {
    return this.usuario?.rol === 'ADMIN';
  }

  obtenerNombreGrupo(grupoId: number): string {
    return (
      this.gruposMusculares.find(
        (grupo) => grupo.id === grupoId
      )?.nombre ?? 'Sin grupo'
    );
  }

  get ejerciciosFiltrados(): Ejercicio[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.ejercicios.filter((ejercicio) => {
      const coincideTexto =
        !texto ||
        ejercicio.nombre.toLowerCase().includes(texto) ||
        (ejercicio.descripcion ?? '')
          .toLowerCase()
          .includes(texto) ||
        this.obtenerNombreGrupo(ejercicio.grupo_muscular_id)
          .toLowerCase()
          .includes(texto);

      const coincideGrupo =
        this.grupoFiltro === 0 ||
        ejercicio.grupo_muscular_id === this.grupoFiltro;

      return coincideTexto && coincideGrupo;
    });
  }

  abrirFormulario(): void {
    this.limpiarFormulario();
    this.mostrarFormulario = true;
  }

  editarEjercicio(ejercicio: Ejercicio): void {
    this.editando = true;
    this.mostrarFormulario = true;
    this.ejercicioEditandoId = ejercicio.id;

    this.nombre = ejercicio.nombre;
    this.grupoMuscularId = ejercicio.grupo_muscular_id;
    this.descripcion = ejercicio.descripcion ?? '';
    this.instrucciones = ejercicio.instrucciones ?? '';

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  cancelarFormulario(): void {
    this.mostrarFormulario = false;
    this.limpiarFormulario();
  }

  guardarEjercicio(): void {
    this.mensajeError = '';
    this.mensajeExito = '';

    if (!this.nombre.trim()) {
      this.mensajeError =
        'El nombre del ejercicio es obligatorio.';
      return;
    }

    if (!this.grupoMuscularId) {
      this.mensajeError =
        'Selecciona un grupo muscular.';
      return;
    }

    const datos: EjercicioDatos = {
      grupo_muscular_id: this.grupoMuscularId,
      nombre: this.nombre.trim(),
      descripcion: this.descripcion.trim() || null,
      instrucciones: this.instrucciones.trim() || null
    };

    this.guardando = true;

    if (
      this.editando &&
      this.ejercicioEditandoId !== null
    ) {
      this.ejerciciosService
        .actualizarEjercicio(this.ejercicioEditandoId, datos)
        .subscribe({
          next: () => {
            this.guardando = false;
            this.mensajeExito =
              'Ejercicio actualizado correctamente.';
            this.mostrarFormulario = false;
            this.limpiarFormulario();
            this.cargarEjercicios();
          },
          error: (error) => {
            this.guardando = false;
            this.mensajeError =
              error.error?.detail ??
              'No fue posible actualizar el ejercicio.';
            this.changeDetectorRef.detectChanges();
          }
        });

      return;
    }

    this.ejerciciosService
      .crearEjercicio(datos)
      .subscribe({
        next: () => {
          this.guardando = false;
          this.mensajeExito =
            'Ejercicio creado correctamente.';
          this.mostrarFormulario = false;
          this.limpiarFormulario();
          this.cargarEjercicios();
        },
        error: (error) => {
          this.guardando = false;
          this.mensajeError =
            error.error?.detail ??
            'No fue posible crear el ejercicio.';
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  eliminarEjercicio(ejercicio: Ejercicio): void {
    if (!this.puedeEliminar() || this.eliminando) {
      return;
    }

    this.mensajeError = '';
    this.mensajeExito = '';
    this.ejercicioPorEliminar = ejercicio;
  }

  cancelarEliminacion(): void {
    if (this.eliminando) {
      return;
    }

    this.ejercicioPorEliminar = null;
  }

  confirmarEliminacion(): void {
    if (
      !this.ejercicioPorEliminar ||
      !this.puedeEliminar() ||
      this.eliminando
    ) {
      return;
    }

    const ejercicioId = this.ejercicioPorEliminar.id;

    this.eliminando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.ejerciciosService
      .eliminarEjercicio(ejercicioId)
      .subscribe({
        next: () => {
          this.eliminando = false;
          this.ejercicioPorEliminar = null;
          this.mensajeExito =
            'Ejercicio eliminado correctamente.';
          this.cargarEjercicios();
        },
        error: (error) => {
          this.eliminando = false;
          this.ejercicioPorEliminar = null;
          this.mensajeError =
            error.error?.detail ??
            'No fue posible eliminar el ejercicio.';
          this.changeDetectorRef.detectChanges();
        }
      });
  }

  private limpiarFormulario(): void {
    this.editando = false;
    this.ejercicioEditandoId = null;

    this.nombre = '';
    this.grupoMuscularId = 0;
    this.descripcion = '';
    this.instrucciones = '';
  }
}
