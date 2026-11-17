import { request } from '../../../services/api.ts';

export type AdminKind = 'usuarios' | 'tipos-usuarios' | 'permisos' | 'tipos-usuarios-permisos';
export type Row = Record<string, string | number | boolean | null> & { id: number; vigente: boolean };
export interface Field { key: string; label: string; type?: 'number' | 'email'; max?: number; optional?: boolean; options?: 'roles' | 'permisos' | 'areas' }
export const definitions: Record<AdminKind, { title: string; fields: Field[] }> = {
  usuarios: { title: 'Usuarios del sistema', fields: [
    { key: 'uid', label: 'Cuenta LDAP', max: 40 }, { key: 'tipo_usuario', label: 'Rol', options: 'roles' },
    { key: 'no_empleado', label: 'Número de empleado', type: 'number' }, { key: 'nombre', label: 'Nombre', max: 50 },
    { key: 'primer_apellido', label: 'Primer apellido', max: 50 }, { key: 'segundo_apellido', label: 'Segundo apellido', max: 50, optional: true },
    { key: 'email', label: 'Correo', type: 'email', max: 50 }, { key: 'extension', label: 'Extensión', type: 'number' },
    { key: 'area', label: 'Área organizativa', options: 'areas', optional: true },
  ] },
  'tipos-usuarios': { title: 'Roles de usuario', fields: [{ key: 'descripcion', label: 'Nombre', max: 50 }] },
  permisos: { title: 'Permisos de acceso', fields: [{ key: 'clave', label: 'Clave', max: 50 }, { key: 'descripcion', label: 'Descripción', max: 100 }] },
  'tipos-usuarios-permisos': { title: 'Permisos por rol', fields: [{ key: 'id_tipo_usuario', label: 'Rol', options: 'roles' }, { key: 'id_permiso', label: 'Permiso', options: 'permisos' }] },
};
function normalize(kind: AdminKind, value: unknown): Row {
  if (!value || typeof value !== 'object') throw new Error('Respuesta de catálogo inválida.');
  const r = value as Record<string, unknown>;
  if (kind === 'usuarios') {
    if (!Number.isInteger(r.id) || typeof r.vigente !== 'boolean') throw new Error('Contrato de usuarios inválido.');
    return r as Row;
  }
  const idKey = kind === 'tipos-usuarios' ? 'IdTipoUsuario' : kind === 'permisos' ? 'IdPermiso' : 'IdTipoUsuarioPermiso';
  if (!Number.isInteger(r[idKey])) throw new Error('Identificador de catálogo inválido.');
  return { id: Number(r[idKey]), vigente: r.Vigente === true || r.Vigente === 1,
    descripcion: String(r.Descripcion ?? ''), clave: String(r.Clave ?? ''),
    id_tipo_usuario: Number(r.IdTipoUsuario ?? 0), id_permiso: Number(r.IdPermiso ?? 0),
    rol: String(r.TipoUsuario ?? ''), permiso: String(r.ClavePermiso ?? ''),
    descripcion_permiso: String(r.DescripcionPermiso ?? '') };
}
export async function list(kind: AdminKind, signal?: AbortSignal): Promise<Row[]> {
  const response = await request<{ data: unknown[] }>(`/catalogos/${kind}`, { signal });
  if (!Array.isArray(response.data)) throw new Error('Listado inválido.');
  return response.data.map(row => normalize(kind, row));
}
export async function save(kind: AdminKind, row: Row): Promise<void> {
  const body = Object.fromEntries(definitions[kind].fields.map(field => [field.key,
    (row[field.key] === '' || row[field.key] == null) && field.optional ? null : field.type === 'number' || field.options ? Number(row[field.key]) : row[field.key]]));
  await request(`/catalogos/${kind}${row.id ? `/${row.id}` : ''}`, { method: row.id ? 'PUT' : 'POST', body });
}
export async function toggle(kind: AdminKind, row: Row): Promise<void> {
  await request(`/catalogos/${kind}/${row.id}/${row.vigente ? 'desactivar' : 'activar'}`, { method: 'POST' });
}
