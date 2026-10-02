import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import {
  AlertaCaducidad,
  CorroboracionRequest,
  FiltrosProductos,
  Pagina,
  ProductoInventario,
  ResumenInventario,
} from '../models/almacen.model';

@Injectable({ providedIn: 'root' })
export class AlmacenService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/almacen`;

  corroborarRecepcion(data: CorroboracionRequest): Observable<void> {
    return this.http
      .post<ApiResponseDTO<null>>(`${this.base}/corroborar`, data)
      .pipe(map(() => undefined));
  }

  obtenerInventario(idLocal: number): Observable<ResumenInventario[]> {
    return this.http
      .get<ApiResponseDTO<ResumenInventario[]>>(`${this.base}/inventario/${idLocal}`)
      .pipe(map((res) => res.data));
  }

  buscarProductos(idLocal: number, filtros: FiltrosProductos): Observable<Pagina<ProductoInventario>> {
    let params = new HttpParams().set('pagina', filtros.pagina).set('tamanio', filtros.tamanio);
    if (filtros.busqueda) params = params.set('busqueda', filtros.busqueda);
    if (filtros.idCategoria != null) params = params.set('idCategoria', filtros.idCategoria);
    if (filtros.estadoConservacion) params = params.set('estadoConservacion', filtros.estadoConservacion);
    return this.http
      .get<ApiResponseDTO<Pagina<ProductoInventario>>>(`${this.base}/inventario/${idLocal}/productos`, { params })
      .pipe(map((res) => res.data));
  }

  obtenerAlertasCaducidad(idLocal: number): Observable<AlertaCaducidad[]> {
    return this.http
      .get<ApiResponseDTO<AlertaCaducidad[]>>(`${this.base}/alertas/caducidad/${idLocal}`)
      .pipe(map((res) => res.data));
  }
}