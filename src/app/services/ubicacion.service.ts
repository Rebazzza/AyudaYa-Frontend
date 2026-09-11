import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import { ActualizarUbicacionRequest, UbicacionActual } from '../models/ubicacion.model';

@Injectable({ providedIn: 'root' })
export class UbicacionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/ubicaciones`;

  escaneo(data: ActualizarUbicacionRequest): Observable<UbicacionActual> {
    return this.http
      .post<ApiResponseDTO<UbicacionActual>>(`${this.base}/escaneo`, data)
      .pipe(map((res) => res.data));
  }

  tracking(codigoSeguimiento: string): Observable<UbicacionActual> {
    return this.http
      .get<ApiResponseDTO<UbicacionActual>>(`${this.base}/tracking/${codigoSeguimiento}`)
      .pipe(map((res) => res.data));
  }
}