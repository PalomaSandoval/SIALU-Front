export type LocationKind = 'areas' | 'campus';
export interface LocationEntry {
  id: number; nombre: string; descripcion: string; vigente: boolean;
  equipos: number; equipos_activos: number; usuarios_activos: number;
}
export type LocationOverview = Record<LocationKind, LocationEntry[]> & {
  resumen: { equipos: number; sin_grupo: number; sin_campus: number };
};
export interface Asset {
  id: number; nombre: string; hostname: string; vigente: boolean;
  grupo: string | null; campus: string | null;
}
export interface AssetFilters { area?: string; campus?: string; pendiente?: 'grupo' | 'campus' }
export interface Inspection { title: string; filters: AssetFilters }
export const locationDefinitions: Record<LocationKind, { title: string; singular: string; description: string; feminine?: boolean }> = {
  areas: { title: 'Áreas', singular: 'área', description: 'Valores de Department en Orion asociados a los equipos.', feminine: true },
  campus: { title: 'Ubicaciones y agrupaciones', singular: 'ubicación', description: 'Ciudades de Orion (City) asociadas a los equipos.', feminine: true },
};
