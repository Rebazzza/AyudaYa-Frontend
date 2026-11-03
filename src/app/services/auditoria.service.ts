import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import { FiltrosAuditoria, PaginaAuditoria } from '../models/auditoria.model';

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/auditoria`;

  listar(
    filtros: FiltrosAuditoria,
    pagina: number,
    tamanio: number,
  ): Observable<PaginaAuditoria> {
    let params = new HttpParams()
      .set('pagina', pagina)
      .set('tamanio', tamanio);

    if (filtros.idUsuario != null) {
      params = params.set('idUsuario', filtros.idUsuario);
    }
    if (filtros.accion.trim()) {
      params = params.set('accion', filtros.accion.trim());
    }
    if (filtros.entidad.trim()) {
      params = params.set('entidad', filtros.entidad.trim());
    }
    if (filtros.ipCliente.trim()) {
      params = params.set('ipCliente', filtros.ipCliente.trim());
    }
    if (filtros.fechaDesde) {
      params = params.set('fechaDesde', filtros.fechaDesde);
    }
    if (filtros.fechaHasta) {
      params = params.set('fechaHasta', filtros.fechaHasta);
    }

    return this.http
      .get<ApiResponseDTO<PaginaAuditoria>>(this.base, { params })
      .pipe(map((res) => res.data));
  }
}
