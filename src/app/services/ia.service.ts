import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';

/** Respuesta del backend para la validación biométrica de las dos caras del DNI (TC-FUNC-03). */
export interface ValidacionDni {
  estado: string;
  anversoValido: boolean;
  reversoValido: boolean;
  dniVerificado: boolean;
  confianza: number;
  mensajeResultado: string;
}

/** Dictamen devuelto por el microservicio Flask (campo `esValido`). */
export interface VerificacionDni {
  idUsuario: number;
  dniVerificado: boolean;
  mensajeResultado: string;
}

@Injectable({ providedIn: 'root' })
export class IaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/ia`;

  /**
   * TC-FUNC-03 · RF03/RF16/RF17: envía anverso y reverso al microservicio Flask
   * (a través del backend). Las imágenes se procesan en memoria y se purgan
   * inmediatamente: no quedan archivos temporales en el servidor (RF18).
   */
  verificarDniCompleto(anverso: File, reverso: File, idUsuario?: number): Observable<ValidacionDni> {
    const form = new FormData();
    form.append('anverso', anverso, anverso.name);
    form.append('reverso', reverso, reverso.name);
    if (idUsuario != null) form.append('idUsuario', String(idUsuario));
    return this.http
      .post<ApiResponseDTO<ValidacionDni>>(`${this.base}/verificar-dni-completo`, form)
      .pipe(map((res) => res.data));
  }

  /**
   * Persiste el estado verificado en MySQL (bandera `dniVerificado`) para la foto
   * indicada. Se usa después de crear la cuenta para dejar constancia del dictamen.
   */
  verificarDni(idUsuario: number, file: File): Observable<VerificacionDni> {
    const form = new FormData();
    form.append('idUsuario', String(idUsuario));
    form.append('file', file, file.name);
    return this.http
      .post<ApiResponseDTO<VerificacionDni>>(`${this.base}/verificar-dni`, form)
      .pipe(map((res) => res.data));
  }
}
