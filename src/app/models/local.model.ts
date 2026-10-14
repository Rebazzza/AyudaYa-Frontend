export interface Local {
  idLocal: number;
  nombreLocal: string;
  direccionLocal: string;
  latitud: number;
  longitud: number;
  capacidadLocalM3: number | null;
  telefonoLocal: string;
  estadoActivo: boolean;
}

export interface LocalRequest {
  nombreLocal: string;
  direccionLocal: string;
  latitud: number;
  longitud: number;
  capacidadLocalM3: number | null;
  telefonoLocal: string;
}

export interface CapacidadLocal {
  idLocal: number;
  nombreLocal: string;
  capacidadLocalM3: number | null;
  donacionesEnAlmacen: number;
  lleno: boolean;
}