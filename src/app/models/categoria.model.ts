export interface Categoria {
  idCategoria: number;
  nombreCategoria: string;
  unidadMedCate: string;
  refrigerar: boolean;
  activo: boolean;
}

export interface CategoriaRequest {
  nombreCategoria: string;
  unidadMedCate: string;
  refrigerar?: boolean;
}