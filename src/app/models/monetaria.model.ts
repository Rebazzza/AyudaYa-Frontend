export interface DonacionMonetaria {
  idDonacionMonetaria: number;
  idUsuario: number;
  nombreDonante?: string | null;
  monto: number;
  moneda?: string | null;
  metodoPago: string;
  numeroOperacion: string;
  comprobanteUrl?: string | null;
  estadoVerificacion: string;
  fechaRegistro: string;
}

export interface DonacionMonetariaRegistroRequest {
  idUsuario: number;
  monto: number;
  moneda?: string;
  metodoPago: string;
  numeroOperacion: string;
  comprobanteUrl?: string;
}

export interface TotalFondos {
  totalRecaudadoPEN: number;
}