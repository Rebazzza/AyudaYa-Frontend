import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import {
  CrearLoteRequest,
  DonacionLote,
  EntregarLoteRequest,
  KitLote,
  LoteDistribucion,
} from '../models/lote.model';

@Injectable({ providedIn: 'root' })
export class LoteService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/lotes`;

  listar(): Observable<LoteDistribucion[]> {
    return this.http
      .get<ApiResponseDTO<LoteDistribucion[]>>(this.base)
      .pipe(map((res) => res.data));
  }

  obtener(idLote: number): Observable<LoteDistribucion> {
    return this.http
      .get<ApiResponseDTO<LoteDistribucion>>(`${this.base}/${idLote}`)
      .pipe(map((res) => res.data));
  }

  obtenerPorCodigo(codigoLote: string): Observable<LoteDistribucion> {
    return this.http
      .get<ApiResponseDTO<LoteDistribucion>>(`${this.base}/codigo/${codigoLote}`)
      .pipe(map((res) => res.data));
  }

  hojaRuta(idLote: number): Observable<LoteDistribucion> {
    return this.http
      .get<ApiResponseDTO<LoteDistribucion>>(`${this.base}/${idLote}/hoja-ruta`)
      .pipe(map((res) => res.data));
  }

  listarPorConductor(nombre: string): Observable<LoteDistribucion[]> {
    const params = new HttpParams().set('nombre', nombre);
    return this.http
      .get<ApiResponseDTO<LoteDistribucion[]>>(`${this.base}/conductor`, { params })
      .pipe(map((res) => res.data));
  }

  donacionesDisponibles(idLocal?: number): Observable<DonacionLote[]> {
    let params = new HttpParams();
    if (idLocal != null) params = params.set('idLocal', idLocal);
    return this.http
      .get<ApiResponseDTO<DonacionLote[]>>(`${this.base}/donaciones-disponibles`, { params })
      .pipe(map((res) => res.data));
  }

  kitsDisponibles(idLocal?: number): Observable<KitLote[]> {
    let params = new HttpParams();
    if (idLocal != null) params = params.set('idLocal', idLocal);
    return this.http
      .get<ApiResponseDTO<KitLote[]>>(`${this.base}/kits-disponibles`, { params })
      .pipe(map((res) => res.data));
  }

  crear(data: CrearLoteRequest): Observable<LoteDistribucion> {
    return this.http
      .post<ApiResponseDTO<LoteDistribucion>>(this.base, data)
      .pipe(map((res) => res.data));
  }

  despachar(idLote: number): Observable<LoteDistribucion> {
    return this.http
      .post<ApiResponseDTO<LoteDistribucion>>(`${this.base}/${idLote}/despachar`, {})
      .pipe(map((res) => res.data));
  }

  registrarEntrega(idLote: number, data: EntregarLoteRequest): Observable<LoteDistribucion> {
    return this.http
      .post<ApiResponseDTO<LoteDistribucion>>(`${this.base}/${idLote}/entregar`, data)
      .pipe(map((res) => res.data));
  }
}
