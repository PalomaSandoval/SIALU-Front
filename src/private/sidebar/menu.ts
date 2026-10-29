import { LayoutDashboard, Database, Layers, Search } from 'lucide-react';
import type { MenuItem } from './components/MenuGroup.tsx';

export const menu: MenuItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Administración', icon: Database, children: [
    { label: 'Fuentes de datos', path: '/catalogos/fuentes' },
    { label: 'Ubicaciones y dependencias', path: '/catalogos/ubicaciones' },
    { label: 'Niveles de clasificación', path: '/catalogos/niveles' },
    { label: 'Acciones del firewall', path: '/catalogos/acciones' },
    { label: 'Origen y destino del tráfico', path: '/catalogos/sentidos-flujo' },
    { label: 'Grupos de infraestructura', path: '/catalogos/grupos-infraestructura' },
    { label: 'Activos por grupo', path: '/catalogos/grupos-activos' },
    { label: 'Identificadores de activos', path: '/catalogos/identificadores-activo' },
    { label: 'Interfaces de red', path: '/catalogos/interfaces' },
    { label: 'Identificadores de interfaces', path: '/catalogos/identificadores-interfaz' },
    { label: 'Contextos de red', path: '/catalogos/contextos-red' },
    { label: 'Zonas y contextos de firewall', path: '/catalogos/contextos-fuente' },
    { label: 'Asignaciones de IP', path: '/catalogos/asignaciones-ip' },
    { label: 'Redes institucionales', path: '/catalogos/redes-institucionales' },
    { label: 'Usuarios del sistema', path: '/catalogos/usuarios' },
    { label: 'Roles de usuario', path: '/catalogos/tipos-usuarios' },
    { label: 'Permisos de acceso', path: '/catalogos/permisos' },
    { label: 'Permisos por rol', path: '/catalogos/tipos-usuarios-permisos' },
    { label: 'Tipos de activo', path: '/catalogos/tipos-activo' },
  ] },
  { label: 'Servicios', icon: Layers, children: [
    { label: 'Orion', children: [
      { label: 'Resumen', path: '/servicios/orion' },
      { label: 'Equipos', path: '/servicios/orion/equipos' },
      { label: 'Disponibilidad', path: '/servicios/orion/disponibilidad' },
      { label: 'Alertas', path: '/servicios/orion/alertas' },
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

