import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import { Notificacion, NotificacionRequest } from '../models/notificacion.model';

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/notificaciones`;

  listarPorUsuario(idUsuario: number): Observable<Notificacion[]> {
    const params = new HttpParams().set('idUsuario', idUsuario);
    return this.http
      .get<ApiResponseDTO<Notificacion[]>>(this.base, { params })
      .pipe(map((res) => res.data));
  }

  crear(data: NotificacionRequest): Observable<Notificacion> {
    return this.http.post<ApiResponseDTO<Notificacion>>(this.base, data).pipe(map((res) => res.data));
  }

  marcarLeida(id: number): Observable<Notificacion> {
    return this.http
      .put<ApiResponseDTO<Notificacion>>(`${this.base}/${id}/leido`, {})
      .pipe(map((res) => res.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<ApiResponseDTO<null>>(`${this.base}/${id}`).pipe(map(() => undefined));
  }
}