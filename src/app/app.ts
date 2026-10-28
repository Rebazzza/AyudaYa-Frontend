import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { FooterComponent } from './shared/components/footer/footer.component';

@Component({
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  selector: 'app-root',
  styleUrl: './app.css',
  template: `
    <div class="min-h-screen flex flex-col">
      <app-navbar />
      <div class="flex-1">
        <router-outlet />
      </div>
      <app-footer />
    </div>
  `,
})
export class App {}
