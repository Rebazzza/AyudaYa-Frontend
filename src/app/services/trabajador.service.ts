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

  /**
   * PATCH /trabajadores/{id}/desactivar — baja lógica (RF10).
   * No borra el registro físico: solo marca `estadoActivo = false`.
   * El backend no expone endpoint de reactivación por ahora.
   */
  desactivar(id: number): Observable<Trabajador> {
    return this.http
      .patch<ApiResponseDTO<Trabajador>>(`${this.base}/${id}/desactivar`, {})
      .pipe(map((res) => res.data));
  }

  /**
   * DELETE /trabajadores/{id} — borrado físico del vínculo de trabajador.
   * El backend desvincula historial de estados y donaciones antes de borrar
   * (antes devolvía un 500 sin cabeceras CORS que el navegador reportaba
   * como error de CORS). La cuenta del usuario NO se elimina.
   */
  eliminar(id: number): Observable<void> {
    return this.http.delete<ApiResponseDTO<null>>(`${this.base}/${id}`).pipe(map(() => undefined));
  }
}