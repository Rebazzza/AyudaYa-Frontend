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
  readonly correoAliado = 'caritasfelices@gmail.com';
  readonly whatsapp = '+51 976 XXX XXX';
}
