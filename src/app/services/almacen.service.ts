import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import {
  AlertaCaducidad,
  CorroboracionRequest,
  ResumenInventario,
} from '../models/almacen.model';

@Injectable({ providedIn: 'root' })
export class AlmacenService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/almacen`;

  corroborarRecepcion(data: CorroboracionRequest): Observable<void> {
    return this.http
      .post<ApiResponseDTO<null>>(`${this.base}/corroborar`, data)
      .pipe(map(() => undefined));
  }

  obtenerInventario(idLocal: number): Observable<ResumenInventario[]> {
    return this.http
      .get<ApiResponseDTO<ResumenInventario[]>>(`${this.base}/inventario/${idLocal}`)
      .pipe(map((res) => res.data));
  }

  obtenerAlertasCaducidad(idLocal: number): Observable<AlertaCaducidad[]> {
    return this.http
      .get<ApiResponseDTO<AlertaCaducidad[]>>(`${this.base}/alertas/caducidad/${idLocal}`)
      .pipe(map((res) => res.data));
  }
}