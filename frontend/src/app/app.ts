
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Tema } from './core/services/tema';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private temaService = inject(Tema);
}
