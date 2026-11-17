import { useCallback, useEffect, useId, useState } from 'react';
import { ChevronDown, Menu } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import type { MenuItem } from './components/MenuGroup.tsx';
import { menu } from './menu.ts';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { request } from '../../services/api.ts';

interface SourceNavigationItem { id: number; nombre: string; icono_url: string }

export const SOURCE_ICONS_UPDATED = 'sialu:source-icons-updated';

function SidebarGroup({ item, expanded, onExpand, onNavigate, depth = 0 }: {
  item: MenuItem; expanded: boolean; onExpand: () => void; onNavigate: () => void; depth?: number;
}) {
  const { pathname } = useLocation();
  const selected = item.children?.some(child => child.path === pathname || child.children?.some(grandchild => grandchild.path === pathname)) ?? false;
  const [open, setOpen] = useState(selected);
  const panelId = useId();
  const Icon = item.icon;

  useEffect(() => { if (selected) setOpen(true); }, [selected]);

  if (!item.children) return <NavLink to={item.path!} end onClick={onNavigate}
    className={({ isActive }) => `sidebar-nav-link${isActive ? ' is-active' : ''}${depth ? ' is-child' : ''}`}
    title={!expanded ? item.label : undefined}>
    {Icon && <Icon size={19} strokeWidth={1.8} aria-hidden="true" />}
    <span>{item.label}</span>
  </NavLink>;

  return <div className="sidebar-nav-group">
    <button type="button" className={`sidebar-nav-link sidebar-nav-trigger${open && expanded ? ' is-open' : ''}`}
      aria-expanded={expanded && open} aria-controls={panelId} title={!expanded ? item.label : undefined}
      onClick={() => { if (!expanded) { onExpand(); setOpen(true); } else setOpen(value => !value); }}>
      {Icon && <Icon size={19} strokeWidth={1.8} aria-hidden="true" />}
      <span>{item.label === 'Administración' ? 'Administración de catálogos' : item.label}</span><ChevronDown className="sidebar-nav-chevron" size={15} aria-hidden="true" />
    </button>
    <div id={panelId} className={`sidebar-nav-panel${expanded && open ? ' is-open' : ''}`}
      aria-hidden={!(expanded && open)} inert={!(expanded && open)}>
      <div className="sidebar-nav-panel-inner"><div className="sidebar-nav-children">
        {item.children.map(child => <SidebarGroup key={child.path ?? child.label} item={child} expanded={expanded} onExpand={onExpand} onNavigate={onNavigate} depth={depth + 1} />)}
      </div></div>
    </div>
  </div>;
}

export default function Sidebar({ open, mobile, onToggle, onNavigate }: { open: boolean; mobile: boolean; onToggle: () => void; onNavigate: () => void }) {
  const [sources, setSources] = useState<SourceNavigationItem[]>([]);
  const { session } = useAuth();
  const canAdmin = session?.data.TipoUsuario.trim().toUpperCase() === 'ADMINISTRADOR';
  const navigation = menu.filter(item => item.label !== 'Servicios' && (canAdmin || item.label !== 'Administración')).map(item =>
    item.label === 'Consultas' && !canAdmin
      ? { ...item, children: item.children?.filter(child => child.path !== '/consultas/eventos') }
      : item);
  const loadSources = useCallback(() => {
    void request<{ data: SourceNavigationItem[] }>('/fuentes-navegacion')
      .then(result => setSources(result.data))
      .catch(() => setSources([]));
  }, []);

  useEffect(() => {
    loadSources();
    window.addEventListener(SOURCE_ICONS_UPDATED, loadSources);
    return () => window.removeEventListener(SOURCE_ICONS_UPDATED, loadSources);
  }, [loadSources]);

  return <aside id="private-sidebar" className={`private-sidebar${open ? ' is-open' : mobile ? ' is-mobile-closed' : ' is-collapsed'}`} inert={mobile && !open}>
    <div className="sidebar-brand">
      <Link to="/" className="sidebar-brand-link" aria-label="SIALU · Inicio" title={!open ? 'SIALU · Inicio' : undefined} onClick={onNavigate}>
        <img src="/images/loginCERT.png" alt="" />
        <span>SIALU</span>
      </Link>
      <button className="navbar-toggle sidebar-toggle" type="button" onClick={onToggle}
        aria-label={open ? 'Colapsar menú lateral' : 'Expandir menú lateral'} aria-controls="private-sidebar" aria-expanded={open}
        title={open ? 'Colapsar menú' : 'Expandir menú'}><Menu size={20} aria-hidden="true" /></button>
    </div>
    <div className="sidebar-scroll">
      <nav className="sidebar-main-nav" aria-label="Navegación principal">
        {navigation.map(item => <SidebarGroup key={item.label} item={item}
          expanded={open} onExpand={onToggle} onNavigate={onNavigate} />)}
      </nav>
      {sources.length > 0 && <div className="sidebar-bottom">
        <nav className="source-navigation" aria-label="Aplicaciones">
          <div className="sidebar-section-label">APLICACIONES</div>
          {sources.map(source => <button key={source.id} type="button"
            className="source-navigation-item"
            aria-label={`Aplicación ${source.nombre}; página próximamente`}
            title={`${source.nombre} · Próximamente`}>
            <img src={source.icono_url} alt="" />
            <span>{source.nombre}</span>
          </button>)}
        </nav>
      </div>}
    </div>
  </aside>;
}
