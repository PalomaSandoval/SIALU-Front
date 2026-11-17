import { Database, House, Layers, Search } from 'lucide-react';
import type { MenuItem } from './components/MenuGroup.tsx';

export const menu: MenuItem[] = [
  { label: 'Monitoreo', path: '/', icon: House },
  { label: 'Administración', icon: Database, children: [
    { label: 'Fuentes de datos', path: '/catalogos/fuentes' },
    { label: 'Ubicaciones y dependencias', path: '/catalogos/ubicaciones' },
    { label: 'Niveles de severidad', path: '/catalogos/niveles' },
    { label: 'Acciones del firewall', path: '/catalogos/acciones' },
    { label: 'Usuarios del sistema', path: '/catalogos/usuarios' },
    { label: 'Roles de usuario', path: '/catalogos/tipos-usuarios' },
    { label: 'Permisos de acceso', path: '/catalogos/permisos' },
    { label: 'Permisos por rol', path: '/catalogos/tipos-usuarios-permisos' },
  ] },
  { label: 'Servicios', icon: Layers, children: [
    { label: 'Orion', children: [
      { label: 'Resumen', path: '/servicios/orion' },
      { label: 'Equipos', path: '/servicios/orion/equipos' },
      { label: 'Incidentes', path: '/servicios/orion/incidentes' },
      { label: 'Eventos Down/Up', path: '/servicios/orion/eventos' },
      { label: 'Alertas', path: '/servicios/orion/alertas' },
      { label: 'Disponibilidad de nodos', path: '/servicios/orion/disponibilidad-nodos' },
    ] },
    { label: 'Palo Alto', children: [
      { label: 'Resumen', path: '/servicios/palo-alto' },
      { label: 'Detecciones', path: '/servicios/palo-alto/detecciones' },
      { label: 'Tráfico', path: '/servicios/palo-alto/trafico' },
      { label: 'Amenazas', path: '/servicios/palo-alto/amenazas' },
    ] },
  ] },
  { label: 'Consultas', icon: Search, children: [
    { label: 'Eventos', path: '/consultas/eventos' },
    { label: 'Por activo', path: '/consultas/activos' },
    { label: 'Correlación', path: '/consultas/correlacion' },
  ] },
];

export function menuPages(items: MenuItem[] = menu, parents: string[] = []): { path: string; title: string; section: string }[] {
  return items.flatMap(item => item.children
    ? menuPages(item.children, [...parents, item.label])
    : [{ path: item.path!, title: item.label, section: parents.join(' / ') }]);
}

