import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import { ImagenEvidencia } from '../models/imagen.model';

@Injectable({ providedIn: 'root' })
export class ImagenService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/imagenes`;
  storageUrl = environment.storageUrl;

  upload(file: File, tipoImagen: string, idDonacion?: number, idUsuario?: number): Observable<ImagenEvidencia> {
    const form = new FormData();
    form.append('file', file);
    form.append('tipoImagen', tipoImagen);
    if (idDonacion != null) form.append('idDonacion', String(idDonacion));
    if (idUsuario != null) form.append('idUsuario', String(idUsuario));
    return this.http
      .post<ApiResponseDTO<ImagenEvidencia>>(`${this.base}/upload`, form)
      .pipe(map((res) => res.data));
  }

  subirEvidencias(idDonacion: number, files: File[]): Observable<ImagenEvidencia[]> {
    const form = new FormData();
    form.append('idDonacion', String(idDonacion));
    form.append('tipoImagen', 'EVIDENCIA_RECEPCION');
    for (const f of files) form.append('files', f);
    return this.http
      .post<ApiResponseDTO<ImagenEvidencia[]>>(`${this.base}/donacion/${idDonacion}/evidencias`, form)
      .pipe(map((res) => res.data));
  }

  listarPorDonacion(idDonacion: number): Observable<ImagenEvidencia[]> {
    return this.http
      .get<ApiResponseDTO<ImagenEvidencia[]>>(`${this.base}/donacion/${idDonacion}`)
      .pipe(map((res) => res.data));
  }

  eliminar(idImagen: number): Observable<void> {
    return this.http
      .delete<ApiResponseDTO<null>>(`${this.base}/${idImagen}`)
      .pipe(map(() => undefined));
  }
}