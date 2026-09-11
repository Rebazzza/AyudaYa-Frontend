import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import { HistorialEstado, HistorialRequest } from '../models/historial.model';

@Injectable({ providedIn: 'root' })
export class HistorialService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/historial`;

  listar(): Observable<HistorialEstado[]> {
    return this.http.get<ApiResponseDTO<HistorialEstado[]>>(this.base).pipe(map((res) => res.data));
  }

  detalle(id: number): Observable<HistorialEstado> {
    return this.http.get<ApiResponseDTO<HistorialEstado>>(`${this.base}/${id}`).pipe(map((res) => res.data));
  }

  crear(data: HistorialRequest): Observable<HistorialEstado> {
    return this.http.post<ApiResponseDTO<HistorialEstado>>(this.base, data).pipe(map((res) => res.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<ApiResponseDTO<null>>(`${this.base}/${id}`).pipe(map(() => undefined));
  }
}