import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiTimeoutNoticeService {
  readonly message = signal('');

  show(): void {
    this.message.set('La solicitud superó los 30 segundos. Verifica si la operación se completó antes de intentarlo nuevamente.');
  }

  dismiss(): void {
    this.message.set('');
  }
}
