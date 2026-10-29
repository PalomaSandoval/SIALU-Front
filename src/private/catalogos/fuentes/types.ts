export interface Fuente {
  id: number; nombre: string; fabricante: string; origen: string; metodo: string;
  version: string; zona: string; responsable: string; raw: string; eventos: string; parametros: string; vigente: boolean;
}
export const blank: Omit<Fuente, 'id'> = { nombre: '', fabricante: '', origen: '', metodo: 'API', version: '', zona: 'UTC', responsable: '', raw: '', eventos: '', parametros: '', vigente: true };
