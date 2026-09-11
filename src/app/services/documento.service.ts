import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, from, map, switchMap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import { NotificarTestRequest } from '../models/documento.model';

export function descargarBlob(blob: Blob, nombre: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  window.URL.revokeObjectURL(url);
}

@Injectable({ providedIn: 'root' })
export class DocumentoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/documentos`;

  downloadComprobante(codigo: string): Observable<Blob> {
    return this.http
      .get(`${this.base}/comprobante/${codigo}`, { responseType: 'blob' })
      .pipe(catchError(this.handleBlobError('No se pudo generar el comprobante.')));
  }

  generarEtiquetas(codigos: string[]): Observable<Blob> {
    return this.http
      .post(`${this.base}/etiquetas-qr`, codigos, { responseType: 'blob' })
      .pipe(catchError(this.handleBlobError('No se pudieron generar las etiquetas.')));
  }

  notificarTest(data: NotificarTestRequest): Observable<void> {
    return this.http
      .post<ApiResponseDTO<null>>(`${this.base}/notificar-test`, data)
      .pipe(map(() => undefined));
  }

  private handleBlobError(fallback: string) {
    return (err: HttpErrorResponse): Observable<never> => {
      if (err?.error instanceof Blob) {
        return from(err.error.text()).pipe(
          switchMap((text) => {
            let msg = fallback;
            try {
              msg = JSON.parse(text)?.message ?? text;
            } catch {
              msg = text || fallback;
            }
            return throwError(() => new Error(msg));
          }),
        );
      }
      return throwError(() => new Error(err?.error?.message ?? fallback));
    };
  }
}