import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import { Usuario, RegisterRequest, LoginRequest } from '../models/usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/auth`;

  register(data: RegisterRequest): Observable<Usuario> {
    return this.http
      .post<ApiResponseDTO<Usuario>>(`${this.base}/register`, data)
      .pipe(map((res) => res.data));
  }

  login(data: LoginRequest): Observable<Usuario> {
    return this.http
      .post<ApiResponseDTO<Usuario>>(`${this.base}/login`, data)
      .pipe(map((res) => res.data));
  }
}
