export type Result = 'PERMITIDO' | 'BLOQUEADO' | 'OBSERVADO' | 'DESCONOCIDO';
export interface TrafficAction { id: number; nombre: string; descripcion: string; resultado: Result; vigente: boolean; }
export interface ActionMapping { id: number; valor: string; accion_id: number; fuente: string; accion: string; descripcion: string; resultado: Result; vigente: boolean; }
export const results: Record<Result, string> = { PERMITIDO: 'Permitido', BLOQUEADO: 'Bloqueado', OBSERVADO: 'Observado', DESCONOCIDO: 'Desconocido' };
