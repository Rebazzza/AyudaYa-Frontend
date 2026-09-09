import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import { Local, LocalRequest } from '../models/local.model';

@Injectable({ providedIn: 'root' })
export class LocalService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/locales`;

  listar(): Observable<Local[]> {
    return this.http
      .get<ApiResponseDTO<Local[]>>(this.base)
      .pipe(map((res) => res.data));
  }

  detalle(id: number): Observable<Local> {
    return this.http
      .get<ApiResponseDTO<Local>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }

  registrar(data: LocalRequest): Observable<Local> {
    return this.http
      .post<ApiResponseDTO<Local>>(this.base, data)
      .pipe(map((res) => res.data));
  }
}
