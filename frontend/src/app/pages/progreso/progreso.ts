import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';

import {
  Chart,
  ChartConfiguration,
  registerables
} from 'chart.js';

import {
  ProgresoMedidas,
  ProgresoPeso,
  ProgresoService,
  ResumenProgreso
} from '../../core/services/progreso';

import {
  Usuario,
  Usuarios
} from '../../core/services/usuarios';

import {
  Entrenadores
} from '../../core/services/entrenadores';

Chart.register(...registerables);

@Component({
  selector: 'app-progreso',
  imports: [],
  templateUrl: './progreso.html',
  styleUrl: './progreso.css'
})
export class Progreso
  implements OnInit, AfterViewInit, OnDestroy {

  private progresoService = inject(ProgresoService);
  private usuariosService = inject(Usuarios);
  private entrenadoresService = inject(Entrenadores);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('graficaPeso')
  graficaPesoRef?: ElementRef<HTMLCanvasElement>;

  @ViewChild('graficaMedidas')
  graficaMedidasRef?: ElementRef<HTMLCanvasElement>;

  usuario: Usuario | null = null;
  usuarioSeguimiento: Usuario | null = null;
  usuarioId = 0;

  resumen: ResumenProgreso | null = null;
  pesos: ProgresoPeso[] = [];
  medidas: ProgresoMedidas[] = [];

  cargando = true;
  mensajeError = '';

  private vistaLista = false;
  private graficaPeso?: Chart;
  private graficaMedidas?: Chart;

  ngOnInit(): void {
    this.cargarTodo();
  }

  ngAfterViewInit(): void {
    this.vistaLista = true;
    this.crearGraficas();
  }

  ngOnDestroy(): void {
    this.destruirGraficas();
  }

  cargarTodo(): void {
    this.cargando = true;
    this.mensajeError = '';

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
          this.cargarProgreso();
        }
      },
      error: (error) => {
        this.cargando = false;

        this.registrarError(
          error,
          'No fue posible obtener tu perfil.'
        );

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

            this.cargarProgreso();
          },
          error: (error) => {
            this.cargando = false;

            this.registrarError(
              error,
              'No fue posible cargar la información del usuario asignado.'
            );

            this.cdr.detectChanges();
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

          this.cargarProgreso();
        },
        error: (error) => {
          this.cargando = false;

          this.registrarError(
            error,
            'No fue posible obtener el usuario seleccionado.'
          );

          this.cdr.detectChanges();
        }
      });

      return;
    }

    this.usuarioSeguimiento = null;
    this.usuarioId = this.usuario.id;

    this.router.navigate(
      ['/progreso'],
      { replaceUrl: true }
    );

    this.cargarProgreso();
  }

  get esSeguimiento(): boolean {
    return !!this.usuario &&
      this.usuarioId !== 0 &&
      this.usuarioId !== this.usuario.id;
  }

  get descripcionPagina(): string {
    if (
      this.esSeguimiento &&
      this.usuarioSeguimiento
    ) {
      return `Consulta la evolución de ${this.usuarioSeguimiento.nombre_completo}, sus entrenamientos, objetivos y medidas corporales.`;
    }

    return 'Consulta la evolución de tus entrenamientos, objetivos y medidas corporales.';
  }

  volverMisUsuarios(): void {
    this.router.navigate(['/mis-usuarios']);
  }

  cargarProgreso(): void {
    if (!this.usuarioId) {
      return;
    }

    this.destruirGraficas();

    this.resumen = null;
    this.pesos = [];
    this.medidas = [];

    const usuarioId = this.usuarioId;

    let solicitudesTerminadas = 0;

    const terminarSolicitud = (): void => {
      solicitudesTerminadas++;

      if (solicitudesTerminadas === 3) {
        this.cargando = false;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.crearGraficas();
        });
      }
    };

    this.progresoService
      .obtenerResumen(usuarioId)
      .subscribe({
        next: (resumen) => {
          this.resumen = resumen;
          terminarSolicitud();
        },
        error: (error) => {
          this.registrarError(
            error,
            'No fue posible cargar el resumen.'
          );

          terminarSolicitud();
        }
      });

    this.progresoService
      .obtenerPeso(usuarioId)
      .subscribe({
        next: (pesos) => {
          this.pesos = pesos;
          terminarSolicitud();
        },
        error: (error) => {
          this.registrarError(
            error,
            'No fue posible cargar la evolución del peso.'
          );

          terminarSolicitud();
        }
      });

    this.progresoService
      .obtenerMedidas(usuarioId)
      .subscribe({
        next: (medidas) => {
          this.medidas = medidas;
          terminarSolicitud();
        },
        error: (error) => {
          this.registrarError(
            error,
            'No fue posible cargar las medidas.'
          );

          terminarSolicitud();
        }
      });
  }

  crearGraficas(): void {
    if (
      !this.vistaLista ||
      this.cargando
    ) {
      return;
    }

    this.destruirGraficas();

    if (
      this.graficaPesoRef &&
      this.pesos.length > 0
    ) {
      this.crearGraficaPeso();
    }

    if (
      this.graficaMedidasRef &&
      this.medidas.length > 0
    ) {
      this.crearGraficaMedidas();
    }
  }

  private crearGraficaPeso(): void {
    if (!this.graficaPesoRef) {
      return;
    }

    const configuracion: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.pesos.map(
          (registro) =>
            this.formatearFecha(registro.fecha)
        ),
        datasets: [
          {
            label: 'Peso (kg)',
            data: this.pesos.map(
              (registro) =>
                Number(registro.peso)
            ),
            borderColor: '#4f46e5',
            backgroundColor:
              'rgba(79, 70, 229, 0.12)',
            pointBackgroundColor: '#4f46e5',
            pointRadius: 5,
            pointHoverRadius: 7,
            borderWidth: 3,
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Peso (kg)'
            }
          }
        }
      }
    };

    this.graficaPeso = new Chart(
      this.graficaPesoRef.nativeElement,
      configuracion
    );
  }

  private crearGraficaMedidas(): void {
    if (!this.graficaMedidasRef) {
      return;
    }

    const configuracion: ChartConfiguration = {
      type: 'line',
      data: {
        labels: this.medidas.map(
          (registro) =>
            this.formatearFecha(registro.fecha)
        ),
        datasets: [
          {
            label: 'Pecho',
            data: this.medidas.map(
              (registro) => registro.pecho
            ),
            borderWidth: 2,
            tension: 0.3
          },
          {
            label: 'Cintura',
            data: this.medidas.map(
              (registro) => registro.cintura
            ),
            borderWidth: 2,
            tension: 0.3
          },
          {
            label: 'Cadera',
            data: this.medidas.map(
              (registro) => registro.cadera
            ),
            borderWidth: 2,
            tension: 0.3
          },
          {
            label: 'Brazo izquierdo',
            data: this.medidas.map(
              (registro) =>
                registro.brazo_izquierdo
            ),
            borderWidth: 2,
            tension: 0.3
          },
          {
            label: 'Brazo derecho',
            data: this.medidas.map(
              (registro) =>
                registro.brazo_derecho
            ),
            borderWidth: 2,
            tension: 0.3
          },
          {
            label: 'Muslo izquierdo',
            data: this.medidas.map(
              (registro) =>
                registro.muslo_izquierdo
            ),
            borderWidth: 2,
            tension: 0.3
          },
          {
            label: 'Muslo derecho',
            data: this.medidas.map(
              (registro) =>
                registro.muslo_derecho
            ),
            borderWidth: 2,
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: 'Centímetros'
            }
          }
        }
      }
    };

    this.graficaMedidas = new Chart(
      this.graficaMedidasRef.nativeElement,
      configuracion
    );
  }

  formatearFecha(fecha: string): string {
    const partes = fecha.split('-');

    if (partes.length !== 3) {
      return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  formatearNumero(
    valor: number | null,
    decimales = 2
  ): string {
    if (valor === null) {
      return '—';
    }

    return Number(valor).toFixed(decimales);
  }

  textoCambioPeso(): string {
    if (
      !this.resumen ||
      this.resumen.cambio_peso === null
    ) {
      return 'Sin datos';
    }

    const cambio = Number(
      this.resumen.cambio_peso
    );

    if (cambio > 0) {
      return `+${cambio.toFixed(2)} kg`;
    }

    return `${cambio.toFixed(2)} kg`;
  }

  claseCambioPeso(): string {
    if (
      !this.resumen ||
      this.resumen.cambio_peso === null
    ) {
      return '';
    }

    const cambio = Number(
      this.resumen.cambio_peso
    );

    if (cambio > 0) {
      return 'positivo';
    }

    if (cambio < 0) {
      return 'negativo';
    }

    return 'neutral';
  }

  private destruirGraficas(): void {
    this.graficaPeso?.destroy();
    this.graficaMedidas?.destroy();

    this.graficaPeso = undefined;
    this.graficaMedidas = undefined;
  }

  private registrarError(
    error: any,
    mensaje: string
  ): void {
    if (!this.mensajeError) {
      this.mensajeError =
        error.error?.detail ?? mensaje;
    }
  }
}