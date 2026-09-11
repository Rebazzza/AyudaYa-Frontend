export interface Categoria {
  idCategoria: number;
  nombreCategoria: string;
  unidadMedCate: string;
  refrigerar: boolean;
}

export interface CategoriaRequest {
  nombreCategoria: string;
  unidadMedCate: string;
  refrigerar?: boolean;
}