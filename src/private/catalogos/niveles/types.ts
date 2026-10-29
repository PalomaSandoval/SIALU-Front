export type LevelKind = 'criticidad' | 'severidad';
export interface Level { id: number; nombre: string; descripcion: string; nivel: number | string; vigente: boolean }
export const definitions = {
  criticidad: { title: 'Criticidad de activos', description: 'Importancia de los equipos y las redes para la operación de la institución.' },
  severidad: { title: 'Severidad de eventos', description: 'Gravedad de los eventos que recibe SIALU.' },
} as const;
