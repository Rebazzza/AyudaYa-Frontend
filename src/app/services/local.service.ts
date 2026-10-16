import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import { Local, LocalRequest, CapacidadLocal } from '../models/local.model';

@Injectable({ providedIn: 'root' })
export class LocalService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/locales`;

  listar(): Observable<Local[]> {
    return this.http
      .get<ApiResponseDTO<Local[]>>(this.base)
      .pipe(map((res) => res.data));
  }

  /** GET /locales/todos — activos e inactivos (uso de administración). */
  listarTodos(): Observable<Local[]> {
    return this.http
      .get<ApiResponseDTO<Local[]>>(`${this.base}/todos`)
      .pipe(map((res) => res.data));
  }

  detalle(id: number): Observable<Local> {
    return this.http
      .get<ApiResponseDTO<Local>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }

  capacidad(id: number): Observable<CapacidadLocal> {
    return this.http
      .get<ApiResponseDTO<CapacidadLocal>>(`${this.base}/${id}/capacidad`)
      .pipe(map((res) => res.data));
  }

  registrar(data: LocalRequest): Observable<Local> {
    return this.http
      .post<ApiResponseDTO<Local>>(this.base, data)
      .pipe(map((res) => res.data));
  }

  /** PUT /locales/{id} — actualiza los datos de un local (solo administrador). */
  actualizar(id: number, data: LocalRequest): Observable<Local> {
    return this.http
      .put<ApiResponseDTO<Local>>(`${this.base}/${id}`, data)
      .pipe(map((res) => res.data));
  }

  /** PUT /locales/{id}/estado — activa o desactiva un local (solo administrador). */
  cambiarEstado(id: number, estadoActivo: boolean): Observable<Local> {
    return this.http
      .put<ApiResponseDTO<Local>>(`${this.base}/${id}/estado`, { estadoActivo })
      .pipe(map((res) => res.data));
  }
}
