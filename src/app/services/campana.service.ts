import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import {
  AlertaStockCampana,
  Campana,
  CampanaRequest,
} from '../models/campana.model';

@Injectable({ providedIn: 'root' })
export class CampanaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/campanas`;

  listar(soloActivas = false): Observable<Campana[]> {
    let params = new HttpParams();
    if (soloActivas) params = params.set('soloActivas', true);
    return this.http
      .get<ApiResponseDTO<Campana[]>>(this.base, { params })
      .pipe(map((res) => res.data));
  }

  listarDisponibles(): Observable<Campana[]> {
    return this.http
      .get<ApiResponseDTO<Campana[]>>(`${this.base}/activas`)
      .pipe(map((res) => res.data));
  }

  detalle(id: number): Observable<Campana> {
    return this.http
      .get<ApiResponseDTO<Campana>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }

  crear(data: CampanaRequest): Observable<Campana> {
    return this.http
      .post<ApiResponseDTO<Campana>>(this.base, data)
      .pipe(map((res) => res.data));
  }

  actualizar(id: number, data: CampanaRequest): Observable<Campana> {
    return this.http
      .put<ApiResponseDTO<Campana>>(`${this.base}/${id}`, data)
      .pipe(map((res) => res.data));
  }

  desactivar(id: number): Observable<Campana> {
    return this.http
      .put<ApiResponseDTO<Campana>>(`${this.base}/${id}/desactivar`, {})
      .pipe(map((res) => res.data));
  }

  activar(id: number): Observable<Campana> {
    return this.http
      .put<ApiResponseDTO<Campana>>(`${this.base}/${id}/activar`, {})
      .pipe(map((res) => res.data));
  }

  alertasStock(idCampana?: number): Observable<AlertaStockCampana[]> {
    let params = new HttpParams();
    if (idCampana) params = params.set('idCampana', idCampana);
    return this.http
      .get<ApiResponseDTO<AlertaStockCampana[]>>(`${this.base}/alertas-stock`, { params })
      .pipe(map((res) => res.data));
  }
}
