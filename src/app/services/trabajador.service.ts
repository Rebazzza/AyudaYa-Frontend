import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import { Trabajador, TrabajadorRequest } from '../models/trabajador.model';

@Injectable({ providedIn: 'root' })
export class TrabajadorService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/trabajadores`;

  listar(): Observable<Trabajador[]> {
    return this.http.get<ApiResponseDTO<Trabajador[]>>(this.base).pipe(map((res) => res.data));
  }

  obtenerTrabajadorPorUsuario(idUsuario: number): Observable<Trabajador | undefined> {
    return this.listar().pipe(
      map((trabajadores) => trabajadores.find((t) => t.idUsuario === idUsuario)),
    );
  }

  detalle(id: number): Observable<Trabajador> {
    return this.http.get<ApiResponseDTO<Trabajador>>(`${this.base}/${id}`).pipe(map((res) => res.data));
  }

  crear(data: TrabajadorRequest): Observable<Trabajador> {
    return this.http.post<ApiResponseDTO<Trabajador>>(this.base, data).pipe(map((res) => res.data));
  }

  actualizar(id: number, data: TrabajadorRequest): Observable<Trabajador> {
    return this.http.put<ApiResponseDTO<Trabajador>>(`${this.base}/${id}`, data).pipe(map((res) => res.data));
  }
}