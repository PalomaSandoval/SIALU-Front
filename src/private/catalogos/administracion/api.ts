import { request } from '../../../services/api.ts';

export type AdminKind = 'usuarios' | 'tipos-usuarios' | 'permisos' | 'tipos-usuarios-permisos' | 'contextos-red' | 'contextos-fuente' | 'asignaciones-ip' | 'grupos-infraestructura' | 'grupos-activos' | 'interfaces' | 'identificadores-interfaz' | 'identificadores-activo';
export type Row = Record<string, string | number | boolean | null> & { id: number; vigente: boolean };
export interface Field { key: string; label: string; type?: 'number' | 'email' | 'datetime-local'; max?: number; optional?: boolean; options?: 'roles' | 'permisos' | 'areas' | 'contextos' | 'activos' | 'fuentes' | 'grupos' | 'interfaces' }
export const definitions: Record<AdminKind, { title: string; fields: Field[] }> = {
  'identificadores-activo': { title: 'Identificadores de activos por fuente', fields: [{ key: 'activo_id', label: 'Activo', options: 'activos' }, { key: 'fuente_id', label: 'Fuente', options: 'fuentes' }, { key: 'tipo', label: 'Tipo (ej. NODE_ID)', max: 30 }, { key: 'valor', label: 'Valor externo', max: 200 }, { key: 'inicio', label: 'Inicio conocido (UTC)', type: 'datetime-local', optional: true }, { key: 'fin', label: 'Fin (UTC)', type: 'datetime-local', optional: true }] },
  'interfaces': { title: 'Interfaces de red', fields: [{ key: 'activo_id', label: 'Activo', options: 'activos' }, { key: 'nombre', label: 'Interfaz', max: 150 }, { key: 'mac', label: 'MAC', max: 23, optional: true }, { key: 'descripcion', label: 'Descripción', max: 300, optional: true }] },
  'identificadores-interfaz': { title: 'Identificadores de interfaces', fields: [{ key: 'interfaz_id', label: 'Interfaz', options: 'interfaces' }, { key: 'fuente_id', label: 'Fuente', options: 'fuentes' }, { key: 'tipo', label: 'Tipo de identificador', max: 30 }, { key: 'valor', label: 'Valor externo', max: 200 }] },
  'grupos-infraestructura': { title: 'Grupos de infraestructura', fields: [{ key: 'nombre', label: 'Nombre', max: 150 }, { key: 'descripcion', label: 'Descripción', max: 300, optional: true }] },
  'grupos-activos': { title: 'Activos por grupo', fields: [{ key: 'activo_id', label: 'Activo', options: 'activos' }, { key: 'grupo_id', label: 'Grupo', options: 'grupos' }] },
  'contextos-red': { title: 'Contextos de red', fields: [{ key: 'nombre', label: 'Nombre', max: 150 }, { key: 'descripcion', label: 'Descripción', max: 300, optional: true }] },
  'contextos-fuente': { title: 'Zonas y contextos de firewall', fields: [{ key: 'fuente_id', label: 'Fuente', options: 'fuentes' }, { key: 'serial', label: 'Serial', max: 100 }, { key: 'vsys', label: 'Sistema virtual (vsys)', max: 100 }, { key: 'zona', label: 'Zona de origen', max: 100 }, { key: 'contexto_id', label: 'Contexto de red', options: 'contextos' }] },
  'asignaciones-ip': { title: 'Asignaciones históricas de IP', fields: [{ key: 'activo_id', label: 'Activo', options: 'activos' }, { key: 'contexto_id', label: 'Contexto de red', options: 'contextos' }, { key: 'ip', label: 'Dirección IP', max: 45 }, { key: 'interfaz_id', label: 'Interfaz', options: 'interfaces', optional: true }, { key: 'inicio', label: 'Inicio (UTC)', type: 'datetime-local' }, { key: 'fin', label: 'Fin (UTC)', type: 'datetime-local', optional: true }] },
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
  if (['usuarios','contextos-red','contextos-fuente','asignaciones-ip','grupos-infraestructura','grupos-activos','interfaces','identificadores-interfaz','identificadores-activo'].includes(kind)) {
    if (!Number.isInteger(r.id) || typeof r.vigente !== 'boolean') throw new Error('Contrato de usuarios inválido.');
    for (const key of ['inicio','fin']) if (typeof r[key] === 'string') r[key] = r[key].replace(' ', 'T');
    return r as Row;
  }
  const idKey = kind === 'tipos-usuarios' ? 'IdTipoUsuario' : kind === 'permisos' ? 'IdPermiso' : 'IdTipoUsuarioPermiso';
  if (!Number.isInteger(r[idKey])) throw new Error('Identificador de catálogo inválido.');
  return { id: Number(r[idKey]), vigente: r.Vigente === true || r.Vigente === 1,
    descripcion: String(r.Descripcion ?? ''), clave: String(r.Clave ?? ''),
    id_tipo_usuario: Number(r.IdTipoUsuario ?? 0), id_permiso: Number(r.IdPermiso ?? 0),
    rol: String(r.TipoUsuario ?? ''), permiso: String(r.ClavePermiso ?? '') };
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
