import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import {
  CambioEstadoRequest,
  Donacion,
  DonacionRegistroRequest,
  DonacionRequest,
  TrackingResponse,
} from '../models/donacion.model';
import { HistorialEstado } from '../models/historial.model';

@Injectable({ providedIn: 'root' })
export class DonacionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/donaciones`;

  listar(idUsuario?: number, estado?: string): Observable<Donacion[]> {
    let params = new HttpParams();
    if (idUsuario) params = params.set('idUsuario', idUsuario);
    if (estado) params = params.set('estado', estado);
    return this.http
      .get<ApiResponseDTO<Donacion[]>>(this.base, { params })
      .pipe(map((res) => res.data));
  }

  listarPorUsuario(idUsuario: number): Observable<Donacion[]> {
    return this.http
      .get<ApiResponseDTO<Donacion[]>>(`${this.base}/usuario/${idUsuario}`)
      .pipe(map((res) => res.data));
  }

  detalle(id: number): Observable<Donacion> {
    return this.http
      .get<ApiResponseDTO<Donacion>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }

  tracking(codigoSeguimiento: string): Observable<TrackingResponse> {
    return this.http
      .get<ApiResponseDTO<TrackingResponse>>(`${this.base}/tracking/${codigoSeguimiento}`)
      .pipe(map((res) => res.data));
  }

  crear(data: DonacionRegistroRequest): Observable<Donacion> {
    return this.http
      .post<ApiResponseDTO<Donacion>>(this.base, data)
      .pipe(map((res) => res.data));
  }

  actualizar(id: number, data: DonacionRequest): Observable<Donacion> {
    return this.http
      .put<ApiResponseDTO<Donacion>>(`${this.base}/${id}`, data)
      .pipe(map((res) => res.data));
  }

  cambiarEstado(id: number, data: CambioEstadoRequest): Observable<Donacion> {
    return this.http
      .put<ApiResponseDTO<Donacion>>(`${this.base}/${id}/estado`, data)
      .pipe(map((res) => res.data));
  }

  anular(id: number, idUsuario: number): Observable<Donacion> {
    const params = new HttpParams().set('idUsuario', idUsuario);
    return this.http
      .put<ApiResponseDTO<Donacion>>(`${this.base}/${id}/anular`, {}, { params })
      .pipe(map((res) => res.data));
  }

  historial(id: number): Observable<HistorialEstado[]> {
    return this.http
      .get<ApiResponseDTO<HistorialEstado[]>>(`${this.base}/${id}/historial`)
      .pipe(map((res) => res.data));
  }
}