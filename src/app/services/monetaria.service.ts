import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponseDTO } from '../models/api-response.model';
import {
  DonacionMonetaria,
  DonacionMonetariaRegistroRequest,
  FiltroDonacionesMonetarias,
  PaginaDonacionesMonetarias,
  PanelFondos,
  VerificarFondosRequest,
} from '../models/monetaria.model';

@Injectable({ providedIn: 'root' })
export class MonetariaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/donaciones-monetarias`;

  // ── RF42 · Registro de donación monetaria ────────────────────────────────

  /** POST /donaciones-monetarias — registro en JSON (sin foto o con comprobanteUrl). */
  registrarMonetaria(body: DonacionMonetariaRegistroRequest): Observable<DonacionMonetaria> {
    return this.http
      .post<ApiResponseDTO<DonacionMonetaria>>(this.base, body)
      .pipe(map((res) => res.data));
  }

  /** POST /donaciones-monetarias/con-comprobante — registro en multipart con la foto del voucher. */
  registrarConComprobante(
    body: DonacionMonetariaRegistroRequest,
    comprobante: File,
  ): Observable<DonacionMonetaria> {
    const fd = new FormData();
    fd.append('idUsuario', String(body.idUsuario));
    fd.append('monto', String(body.monto));
    fd.append('moneda', body.moneda ?? 'PEN');
    fd.append('metodoPago', body.metodoPago);
    fd.append('numeroOperacion', body.numeroOperacion);
    if (body.comprobanteUrl) fd.append('comprobanteUrl', body.comprobanteUrl);
    fd.append('comprobante', comprobante);
    // En multiparte NO se fija Content-Type: HttpClient añade el boundary.
    return this.http
      .post<ApiResponseDTO<DonacionMonetaria>>(`${this.base}/con-comprobante`, fd)
      .pipe(map((res) => res.data));
  }

  /** POST /donaciones-monetarias/{id}/comprobante — adjunta o reemplaza la foto del voucher. */
  subirComprobante(id: number, comprobante: File): Observable<DonacionMonetaria> {
    const fd = new FormData();
    fd.append('comprobante', comprobante);
    return this.http
      .post<ApiResponseDTO<DonacionMonetaria>>(`${this.base}/${id}/comprobante`, fd)
      .pipe(map((res) => res.data));
  }

  /** GET /donaciones-monetarias/usuario/{idUsuario} — aportes de un donante (sin paginar). */
  listarPorUsuario(idUsuario: number): Observable<DonacionMonetaria[]> {
    return this.http
      .get<ApiResponseDTO<DonacionMonetaria[]>>(`${this.base}/usuario/${idUsuario}`)
      .pipe(map((res) => res.data));
  }

  // ── RF43 · Verificación de aportes ───────────────────────────────────────

  /** GET /donaciones-monetarias — listado con filtros y paginación (página desde 0). */
  listar(filtros: FiltroDonacionesMonetarias = {}): Observable<PaginaDonacionesMonetarias> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        params = params.set(clave, String(valor));
      }
    }
    return this.http
      .get<ApiResponseDTO<PaginaDonacionesMonetarias>>(this.base, { params })
      .pipe(map((res) => res.data));
  }

  /** GET /donaciones-monetarias/{id} — detalle de un aporte. */
  detalle(id: number): Observable<DonacionMonetaria> {
    return this.http
      .get<ApiResponseDTO<DonacionMonetaria>>(`${this.base}/${id}`)
      .pipe(map((res) => res.data));
  }

  /** PUT /donaciones-monetarias/{id}/verificar — cambia el estado de verificación. */
  verificar(id: number, body: VerificarFondosRequest): Observable<DonacionMonetaria> {
    return this.http
      .put<ApiResponseDTO<DonacionMonetaria>>(`${this.base}/${id}/verificar`, body)
      .pipe(map((res) => res.data));
  }

  /** DELETE /donaciones-monetarias/{id} — devuelve 400 si el aporte está VERIFICADO. */
  eliminar(id: number): Observable<void> {
    return this.http
      .delete<ApiResponseDTO<null>>(`${this.base}/${id}`)
      .pipe(map(() => undefined));
  }

  // ── RF44 · Panel de recaudación ──────────────────────────────────────────

  /** GET /donaciones-monetarias/panel — consolidado de fondos recaudados. */
  getPanel(): Observable<PanelFondos> {
    return this.http
      .get<ApiResponseDTO<PanelFondos>>(`${this.base}/panel`)
      .pipe(map((res) => res.data));
  }

  /** GET /donaciones-monetarias/total — alias por compatibilidad (misma respuesta que /panel). */
  getTotalFondos(): Observable<PanelFondos> {
    return this.http
      .get<ApiResponseDTO<PanelFondos>>(`${this.base}/total`)
      .pipe(map((res) => res.data));
  }

  /**
   * Convierte `comprobanteUrl` en una URL absoluta: el backend devuelve rutas
   * públicas tipo `/uploads/comprobantes/xxx.png` que deben resolverse contra
   * el host del almacenamiento para poder usarlas en un `<img [src]>`.
   */
  urlComprobante(url?: string | null): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return `${environment.storageUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  }
}
