
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Usuario, Usuarios } from '../../core/services/usuarios';
import { Mensualidad, MensualidadCrear, Mensualidades, Plan } from '../../core/services/mensualidades';

@Component({
  selector: 'app-mensualidades',
  imports: [CommonModule, FormsModule],
  templateUrl: './mensualidades.html',
  styleUrl: './mensualidades.css'
})
export class MensualidadesPage implements OnInit {
  private mensualidadesService = inject(Mensualidades);
  private usuariosService = inject(Usuarios);
  private cdr = inject(ChangeDetectorRef);

  mensualidades: Mensualidad[] = [];
  mensualidadesFiltradas: Mensualidad[] = [];
  usuarios: Usuario[] = [];
  planes: Plan[] = [];

  cargando = true;
  guardando = false;
  eliminando = false;
  mostrarFormulario = false;

  mensajeError = '';
  mensajeExito = '';

  busqueda = '';
  filtroEstado = 'TODOS';

  usuarioId: number | null = null;
  planId: number | null = null;
  fechaInicio = this.obtenerFechaHoy();

  mensualidadEditando: Mensualidad | null = null;
  mensualidadPorEliminar: Mensualidad | null = null;

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.mensajeError = '';

    let solicitudesTerminadas = 0;

    const finalizarSolicitud = (): void => {
      solicitudesTerminadas++;

      if (solicitudesTerminadas === 3) {
        this.aplicarFiltros();
        this.cargando = false;
        this.cdr.detectChanges();
      }
    };

    this.usuariosService.listarUsuarios().subscribe({
      next: (usuarios) => {
        this.usuarios = usuarios.filter(
          usuario => usuario.rol === 'USUARIO'
        );

        finalizarSolicitud();
      },
      error: (error) => {
        this.mensajeError = this.obtenerMensajeError(
          error,
          'No fue posible cargar los usuarios.'
        );

        finalizarSolicitud();
      }
    });

    this.mensualidadesService.listarPlanes().subscribe({
      next: (planes) => {
        this.planes = planes;
        finalizarSolicitud();
      },
      error: (error) => {
        this.mensajeError = this.obtenerMensajeError(
          error,
          'No fue posible cargar los planes.'
        );

        finalizarSolicitud();
      }
    });

    this.mensualidadesService.listarMensualidades().subscribe({
      next: (mensualidades) => {
        this.mensualidades = mensualidades;
        finalizarSolicitud();
      },
      error: (error) => {
        this.mensajeError = this.obtenerMensajeError(
          error,
          'No fue posible cargar las mensualidades.'
        );

        finalizarSolicitud();
      }
    });
  }

  abrirFormulario(): void {
    this.mensualidadEditando = null;
    this.usuarioId = null;
    this.planId = null;
    this.fechaInicio = this.obtenerFechaHoy();

    this.mensajeError = '';
    this.mensajeExito = '';
    this.mostrarFormulario = true;
  }

  editarMensualidad(mensualidad: Mensualidad): void {
    this.mensualidadEditando = mensualidad;
    this.usuarioId = mensualidad.usuario_id;
    this.planId = mensualidad.plan_id;
    this.fechaInicio = mensualidad.fecha_inicio;

    this.mensajeError = '';
    this.mensajeExito = '';
    this.mostrarFormulario = true;
  }

  cerrarFormulario(): void {
    if (this.guardando) {
      return;
    }

    this.mostrarFormulario = false;
    this.mensualidadEditando = null;
    this.usuarioId = null;
    this.planId = null;
    this.fechaInicio = this.obtenerFechaHoy();
  }

  guardarMensualidad(): void {
    if (this.guardando) {
      return;
    }

    this.mensajeError = '';
    this.mensajeExito = '';

    if (
      this.usuarioId === null ||
      this.planId === null ||
      !this.fechaInicio
    ) {
      this.mensajeError = 'Debes completar todos los campos.';
      return;
    }

    this.guardando = true;

    if (this.mensualidadEditando) {
      this.mensualidadesService.actualizarMensualidad(
        this.mensualidadEditando.id,
        {
          plan_id: this.planId,
          fecha_inicio: this.fechaInicio
        }
      ).subscribe({
        next: () => {
          this.guardando = false;
          this.mostrarFormulario = false;
          this.mensualidadEditando = null;

          this.mensajeExito =
            'Mensualidad actualizada correctamente.';

          this.cargarDatos();
        },
        error: (error) => {
          this.guardando = false;

          this.mensajeError = this.obtenerMensajeError(
            error,
            'No fue posible actualizar la mensualidad.'
          );

          this.cdr.detectChanges();
        }
      });

      return;
    }

    const datos: MensualidadCrear = {
      usuario_id: this.usuarioId,
      plan_id: this.planId,
      fecha_inicio: this.fechaInicio
    };

    this.mensualidadesService.crearMensualidad(datos).subscribe({
      next: () => {
        this.guardando = false;
        this.mostrarFormulario = false;

        this.mensajeExito =
          'Mensualidad registrada correctamente.';

        this.cargarDatos();
      },
      error: (error) => {
        this.guardando = false;

        this.mensajeError = this.obtenerMensajeError(
          error,
          'No fue posible registrar la mensualidad.'
        );

        this.cdr.detectChanges();
      }
    });
  }

  eliminarMensualidad(mensualidad: Mensualidad): void {
    if (this.eliminando) {
      return;
    }

    this.mensajeError = '';
    this.mensajeExito = '';

    this.mensualidadPorEliminar = mensualidad;
  }

  cerrarConfirmacion(): void {
    if (this.eliminando) {
      return;
    }

    this.mensualidadPorEliminar = null;
  }

  confirmarEliminacion(): void {
    if (!this.mensualidadPorEliminar || this.eliminando) {
      return;
    }

    const id = this.mensualidadPorEliminar.id;

    this.eliminando = true;
    this.mensajeError = '';
    this.mensajeExito = '';

    this.mensualidadesService.eliminarMensualidad(id).subscribe({
      next: () => {
        this.eliminando = false;
        this.mensualidadPorEliminar = null;

        // Actualizamos la tabla sin recargar todos los datos.
        this.mensualidades = this.mensualidades.filter(
          mensualidad => mensualidad.id !== id
        );

        this.aplicarFiltros();

        // Conservamos el mensaje para mostrarlo en la página.
        this.mensajeExito =
          'Mensualidad eliminada correctamente.';

        this.cdr.detectChanges();
      },
      error: (error) => {
        this.eliminando = false;

        this.mensajeError = this.obtenerMensajeError(
          error,
          'No fue posible eliminar la mensualidad.'
        );

        this.cdr.detectChanges();
      }
    });
  }

  get nombreUsuarioPorEliminar(): string {
    if (!this.mensualidadPorEliminar) {
      return '';
    }

    return this.obtenerUsuario(
      this.mensualidadPorEliminar.usuario_id
    )?.nombre_completo ?? 'Usuario';
  }

  get nombrePlanPorEliminar(): string {
    if (!this.mensualidadPorEliminar) {
      return '';
    }

    return this.obtenerPlan(
      this.mensualidadPorEliminar.plan_id
    )?.nombre ?? 'Plan';
  }

  aplicarFiltros(): void {
    const texto = this.busqueda.trim().toLowerCase();

    this.mensualidadesFiltradas = this.mensualidades.filter(
      mensualidad => {
        const usuario = this.obtenerUsuario(mensualidad.usuario_id);
        const plan = this.obtenerPlan(mensualidad.plan_id);

        const coincideBusqueda =
          texto.length === 0 ||
          !!usuario?.nombre_completo.toLowerCase().includes(texto) ||
          !!usuario?.nombre_usuario.toLowerCase().includes(texto) ||
          !!plan?.nombre.toLowerCase().includes(texto);

        const coincideEstado =
          this.filtroEstado === 'TODOS' ||
          mensualidad.estado === this.filtroEstado;

        return coincideBusqueda && coincideEstado;
      }
    );
  }

  obtenerUsuario(usuarioId: number): Usuario | undefined {
    return this.usuarios.find(
      usuario => usuario.id === usuarioId
    );
  }

  obtenerPlan(planId: number): Plan | undefined {
    return this.planes.find(
      plan => plan.id === planId
    );
  }

  get planSeleccionado(): Plan | undefined {
    if (this.planId === null) {
      return undefined;
    }

    return this.obtenerPlan(this.planId);
  }

  get fechaFinCalculada(): string {
    const plan = this.planSeleccionado;

    if (!plan || !this.fechaInicio) {
      return '—';
    }

    const fecha = this.crearFechaLocal(this.fechaInicio);

    fecha.setDate(
      fecha.getDate() + plan.duracion_dias - 1
    );

    return this.formatearFechaISO(fecha);
  }

  get totalVigentes(): number {
    return this.mensualidades.filter(
      mensualidad => mensualidad.estado === 'VIGENTE'
    ).length;
  }

  get totalVencidas(): number {
    return this.mensualidades.filter(
      mensualidad => mensualidad.estado === 'VENCIDA'
    ).length;
  }

  get totalPorVencer(): number {
    const hoy = this.crearFechaLocal(this.obtenerFechaHoy());

    return this.mensualidades.filter(mensualidad => {
      if (mensualidad.estado !== 'VIGENTE') {
        return false;
      }

      const fechaFin = this.crearFechaLocal(
        mensualidad.fecha_fin
      );

      const diferencia =
        fechaFin.getTime() - hoy.getTime();

      const dias = Math.round(
        diferencia / (1000 * 60 * 60 * 24)
      );

      return dias >= 0 && dias <= 5;
    }).length;
  }

  formatearDinero(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Number(valor));
  }

  formatearFecha(fecha: string): string {
    if (!fecha) {
      return '—';
    }

    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(this.crearFechaLocal(fecha));
  }

  private obtenerFechaHoy(): string {
    return this.formatearFechaISO(new Date());
  }

  private formatearFechaISO(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }

  private crearFechaLocal(fecha: string): Date {
    const partes = fecha.split('-').map(Number);

    return new Date(
      partes[0],
      partes[1] - 1,
      partes[2]
    );
  }

  private obtenerMensajeError(
    error: any,
    mensaje: string
  ): string {
    const detalle = error.error?.detail;

    return typeof detalle === 'string'
      ? detalle
      : mensaje;
  }
}
