import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';

import {
  Mensualidad,
  Mensualidades,
  Plan
} from '../../core/services/mensualidades';


@Component({
  selector: 'app-mi-membresia',
  imports: [],
  templateUrl: './mi-membresia.html',
  styleUrl: './mi-membresia.css'
})
export class MiMembresia implements OnInit {
  private mensualidadesService = inject(Mensualidades);
  private cdr = inject(ChangeDetectorRef);

  mensualidades: Mensualidad[] = [];
  planes: Plan[] = [];

  cargando = true;
  mensajeError = '';


  ngOnInit(): void {
    this.cargarDatos();
  }


  cargarDatos(): void {
    this.cargando = true;
    this.mensajeError = '';

    let solicitudesTerminadas = 0;
    let huboError = false;

    const finalizar = (): void => {
      solicitudesTerminadas++;

      if (solicitudesTerminadas === 2) {
        this.cargando = false;

        if (huboError) {
          this.mensajeError =
            'No fue posible cargar toda la información de tu membresía.';
        }

        this.cdr.detectChanges();
      }
    };


    this.mensualidadesService
      .listarMisMensualidades()
      .subscribe({
        next: (mensualidades) => {
          this.mensualidades = mensualidades;
          finalizar();
        },
        error: () => {
          huboError = true;
          this.mensualidades = [];
          finalizar();
        }
      });


    this.mensualidadesService
      .listarPlanes()
      .subscribe({
        next: (planes) => {
          this.planes = planes;
          finalizar();
        },
        error: () => {
          huboError = true;
          this.planes = [];
          finalizar();
        }
      });
  }


  get membresiaActual(): Mensualidad | null {
    const vigente = this.mensualidades.find(
      mensualidad =>
        mensualidad.estado === 'VIGENTE'
    );

    return vigente ?? null;
  }


  get planActual(): Plan | null {
    if (!this.membresiaActual) {
      return null;
    }

    return (
      this.planes.find(
        plan =>
          plan.id ===
          this.membresiaActual?.plan_id
      ) ?? null
    );
  }


  get diasRestantes(): number {
    if (!this.membresiaActual) {
      return 0;
    }

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);

    const fechaFin = this.crearFechaLocal(
      this.membresiaActual.fecha_fin
    );

    const diferencia =
      fechaFin.getTime() -
      hoy.getTime();

    return Math.max(
      0,
      Math.ceil(
        diferencia /
        (1000 * 60 * 60 * 24)
      )
    );
  }


  obtenerPlan(
    planId: number
  ): Plan | undefined {
    return this.planes.find(
      plan => plan.id === planId
    );
  }


  formatearDinero(
    valor: number
  ): string {
    return new Intl.NumberFormat(
      'es-CO',
      {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0
      }
    ).format(Number(valor));
  }


  formatearFecha(
    fecha: string
  ): string {
    const fechaLocal =
      this.crearFechaLocal(fecha);

    return new Intl.DateTimeFormat(
      'es-CO',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }
    ).format(fechaLocal);
  }


  private crearFechaLocal(
    fecha: string
  ): Date {
    const partes = fecha
      .split('-')
      .map(Number);

    return new Date(
      partes[0],
      partes[1] - 1,
      partes[2]
    );
  }
}