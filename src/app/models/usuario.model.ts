export type RolRegistrable = 'DONANTE' | 'PERSONAL_APOYO';

export interface Usuario {
  idUsuario: number;
  dniUsuario: string;
  nombreUsuario: string;
  apellidosUsuario: string;
  correoUsuario: string;
  telefonoUsuario: string;
  nombreRol: string;
  fechaRegistro: string;
}

export interface RegisterRequest {
  dniUsuario: string;
  nombreUsuario: string;
  apellidosUsuario: string;
  correoUsuario: string;
  'contraseña': string;
  /** Opcional (TC-FUNC-01): el plan de pruebas no lo lista como obligatorio. */
  telefonoUsuario?: string;
  tipoRegistro?: RolRegistrable;
}

export interface LoginRequest {
  correoUsuario: string;
  'contraseña': string;
}