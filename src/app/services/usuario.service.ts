import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import { Usuario } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http
      .get<ApiResponseDTO<Usuario[]>>(this.base)
      .pipe(map((res) => res.data));
  }

  /**
   * Borra la cuenta y sus datos asociados (uso de pruebas: botón del dashboard
   * del usuario Juan Perez para limpiar la BD antes de repetir el TC-FUNC-01).
   */
  eliminar(id: number): Observable<void> {
    return this.http
      .delete<ApiResponseDTO<null>>(`${this.base}/${id}`)
      .pipe(map(() => undefined));
  }
}