export interface Local {
  idLocal: number;
  nombreLocal: string;
  direccionLocal: string;
  latitud: number;
  longitud: number;
  capacidadLocalM3: number;
  telefonoLocal: string;
  estadoActivo: boolean;
}

export interface LocalRequest {
  nombreLocal: string;
  direccionLocal: string;
  latitud: number;
  longitud: number;
  capacidadLocalM3: number;
  telefonoLocal: string;
}