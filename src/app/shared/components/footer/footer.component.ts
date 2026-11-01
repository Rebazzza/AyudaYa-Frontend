import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
})
export class FooterComponent {
  readonly anio = new Date().getFullYear();
  readonly correoInstitucional = 'contacto@ayudaya.pe';
  readonly correoAliado = 'contacto@misioncaritasfelices.org';
  readonly whatsapp = '+51 999 741 727';
  readonly blog = 'https://www.misioncaritasfelices.org/';
}
