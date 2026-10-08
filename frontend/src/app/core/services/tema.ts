
import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';

export type ModoTema = 'claro' | 'oscuro';

@Injectable({
  providedIn: 'root'
})
export class Tema {
  private document = inject(DOCUMENT);
  private readonly clave = 'titan-tema';

  modo = signal<ModoTema>('claro');

  constructor() {
    const guardado = this.obtenerGuardado();

    const modoInicial: ModoTema =
      guardado === 'claro' || guardado === 'oscuro'
        ? guardado
        : 'claro';

    this.establecerModo(modoInicial);
  }

  alternarModo(): void {
    const siguiente: ModoTema =
      this.modo() === 'claro' ? 'oscuro' : 'claro';

    this.establecerModo(siguiente);
  }

  establecerModo(modo: ModoTema): void {
    this.modo.set(modo);

    this.document.documentElement.setAttribute(
      'data-tema',
      modo
    );

    try {
      localStorage.setItem(this.clave, modo);
    } catch {
      // La aplicación sigue funcionando si el navegador
      // no permite guardar preferencias.
    }
  }

  private obtenerGuardado(): string | null {
    try {
      return localStorage.getItem(this.clave);
    } catch {
      return null;
    }
  }
}
