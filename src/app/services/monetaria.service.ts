import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import {
  DonacionMonetaria,
  DonacionMonetariaRegistroRequest,
  TotalFondos,
} from '../models/monetaria.model';

@Injectable({ providedIn: 'root' })
export class MonetariaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/donaciones-monetarias`;

  registrarMonetaria(body: DonacionMonetariaRegistroRequest): Observable<DonacionMonetaria> {
    return this.http
      .post<ApiResponseDTO<DonacionMonetaria>>(this.base, body)
      .pipe(map((res) => res.data));
  }

  listar(): Observable<DonacionMonetaria[]> {
    return this.http
      .get<ApiResponseDTO<DonacionMonetaria[]>>(this.base)
      .pipe(map((res) => res.data));
  }

  verificarFondos(id: number, estado: 'VERIFICADO' | 'RECHAZADO'): Observable<DonacionMonetaria> {
    return this.http
      .put<ApiResponseDTO<DonacionMonetaria>>(`${this.base}/${id}/verificar`, { estado })
      .pipe(map((res) => res.data));
  }

  getTotalFondos(): Observable<TotalFondos> {
    return this.http
      .get<ApiResponseDTO<TotalFondos>>(`${this.base}/total`)
      .pipe(map((res) => res.data));
  }
}