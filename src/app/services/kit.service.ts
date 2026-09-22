import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import { ArmarKitRequest, Kit } from '../models/kit.model';

@Injectable({ providedIn: 'root' })
export class KitService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/kits`;

  armarKits(body: ArmarKitRequest): Observable<Kit[]> {
    return this.http
      .post<ApiResponseDTO<Kit[]>>(`${this.base}/armar`, body)
      .pipe(map((res) => res.data));
  }

  getKitsPorLocal(idLocal: number): Observable<Kit[]> {
    return this.http
      .get<ApiResponseDTO<Kit[]>>(`${this.base}/local/${idLocal}`)
      .pipe(map((res) => res.data));
  }

  getKitPorCodigo(codigoKit: string): Observable<Kit> {
    return this.http
      .get<ApiResponseDTO<Kit>>(`${this.base}/${codigoKit}`)
      .pipe(map((res) => res.data));
  }
}