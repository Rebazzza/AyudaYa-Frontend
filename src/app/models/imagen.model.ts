export interface ImagenEvidencia {
  idImagen?: number;
  nombreOriginal: string;
  rutaUrl: string;
  tipoImagen: 'DNI_FRONTAL' | 'DNI_POSTERIOR' | 'EVIDENCIA_RECEPCION' | 'EVIDENCIA_ENTREGA';
  fechaCarga?: string;
}

export interface CargaEvidenciaResponse {
  exito: boolean;
  mensaje: string;
  imagenes: ImagenEvidencia[];
}