export type LocationKind = 'areas' | 'campus' | 'unidades-institucionales';
export interface LocationEntry {
  id: number; nombre: string; descripcion: string; vigente: boolean;
  equipos: number; equipos_activos: number; usuarios_activos: number; redes_activas: number;
}
export type LocationOverview = Record<LocationKind, LocationEntry[]> & {
  resumen: { equipos: number; sin_grupo: number; sin_campus: number; sin_unidad: number };
};
export interface Asset {
  id: number; nombre: string; hostname: string; vigente: boolean;
  grupo: string | null; campus: string | null;
}
export interface AssetFilters { area?: string; campus?: string; unidad?: string; pendiente?: 'grupo' | 'campus' | 'unidad' }
export interface Inspection { title: string; filters: AssetFilters }
export const locationDefinitions: Record<LocationKind, { title: string; singular: string; add: string; description: string; feminine?: boolean }> = {
  areas: { title: 'Áreas', singular: 'área', add: 'Agregar área', description: 'Áreas operativas responsables de usuarios y equipos. Su función es distinta de la adscripción institucional. El significado de Department en Orion requiere validación institucional.', feminine: true },
  'unidades-institucionales': { title: 'Unidades institucionales', singular: 'unidad', add: 'Agregar unidad', description: 'Catálogo opcional de facultades y dependencias para asociar activos y redes. Capture nombres aprobados por la institución; no se obtienen automáticamente de Orion.', feminine: true },
  campus: { title: 'Ubicaciones y agrupaciones', singular: 'ubicación', add: 'Agregar ubicación', description: 'Ubicaciones institucionales asociadas a equipos. El significado de City en Orion debe validarse antes de tratar sus valores como campus.', feminine: true },
};
