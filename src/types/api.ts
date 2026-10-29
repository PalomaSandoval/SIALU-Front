export interface User {
  IdUsuario: number;
  IdTipoUsuario: number;
  TipoUsuario: string;
  uid: string;
  cn: string;
  sn: string;
  givenName: string;
  employeeNumber: string;
  mail: string;
}
export interface SessionResponse {
  data: User;
  permissions: string[];
}
export interface HealthResponse {
  application: string;
  status: string;
}
export interface LoginResponse {
  data: User;
  session?: { id: number };
}
