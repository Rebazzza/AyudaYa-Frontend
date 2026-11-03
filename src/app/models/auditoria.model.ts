export interface Auditoria {
  idAuditoria: number;
  idUsuario: number;
  nombreUsuario: string | null;
  accion: string;
  entidad: string;
  idEntidad: string | null;
  detalle: string | null;
  valoresAnteriores: string | null;
  valoresNuevos: string | null;
  alerta: string | null;
  fechaHora: string;
  ipCliente: string;
  metodoHttp: string | null;
  rutaPeticion: string | null;
}

export interface FiltrosAuditoria {
  idUsuario: number | null;
  accion: string;
  entidad: string;
  ipCliente: string;
  fechaDesde: string;
  fechaHasta: string;
}

export interface PaginaAuditoria {
  contenido: Auditoria[];
  pagina: number;
  tamanio: number;
  totalElementos: number;
  totalPaginas: number;
}
