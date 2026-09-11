import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import { Categoria, CategoriaRequest } from '../models/categoria.model';

@Injectable({ providedIn: 'root' })
export class CategoriaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/categorias`;

  listar(): Observable<Categoria[]> {
    return this.http.get<ApiResponseDTO<Categoria[]>>(this.base).pipe(map((res) => res.data));
  }

  detalle(id: number): Observable<Categoria> {
    return this.http.get<ApiResponseDTO<Categoria>>(`${this.base}/${id}`).pipe(map((res) => res.data));
  }

  crear(data: CategoriaRequest): Observable<Categoria> {
    return this.http.post<ApiResponseDTO<Categoria>>(this.base, data).pipe(map((res) => res.data));
  }

  actualizar(id: number, data: CategoriaRequest): Observable<Categoria> {
    return this.http.put<ApiResponseDTO<Categoria>>(`${this.base}/${id}`, data).pipe(map((res) => res.data));
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<ApiResponseDTO<null>>(`${this.base}/${id}`).pipe(map(() => undefined));
  }
}