import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import { FiltrosPrediccion, PrediccionEscasez } from '../models/prediccion.model';

@Injectable({ providedIn: 'root' })
export class PrediccionService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/predicciones`;

  /**
   * RF26 - RF29: consulta las proyecciones de escasez por categoría. Los filtros
   * son opcionales; sin zona se consolida el inventario de todos los centros de acopio.
   */
  obtenerPredicciones(filtros: FiltrosPrediccion = {}): Observable<PrediccionEscasez[]> {
    let params = new HttpParams();
    if (filtros.idZonaDesastre != null) {
      params = params.set('idZonaDesastre', filtros.idZonaDesastre);
    }
    if (filtros.idCategoria != null) {
      params = params.set('idCategoria', filtros.idCategoria);
    }
    return this.http
      .get<ApiResponseDTO<PrediccionEscasez[]>>(`${this.base}/escasez`, { params })
      .pipe(map((res) => res.data ?? []));
  }
}