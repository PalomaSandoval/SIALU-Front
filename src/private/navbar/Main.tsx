import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Menu, Search, X } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { menuPages } from '../sidebar/menu.ts';
import UserMenu from './components/UserMenu.tsx';

export default function Navbar({ onToggle, expanded }: { onToggle: () => void; expanded: boolean }) {
  const { pathname } = useLocation();
  const { session } = useAuth();
  const canAdmin = session?.data.TipoUsuario.trim().toUpperCase() === 'ADMINISTRADOR';
  const pages = menuPages().filter(page => canAdmin || (!page.path.startsWith('/catalogos/') && page.path !== '/consultas/eventos'));
  const current = pages.find(page => page.path === pathname);
  const title = pathname === '/' ? 'Resumen' : pathname === '/monitoreo/amenazas' ? 'Amenazas por severidad' : pathname === '/monitoreo/amenazas/ficha' ? 'Ficha de amenaza' : current?.title || 'Página';
  const sections = current?.section.split(' / ').filter(Boolean) ?? [];
  const breadcrumbs = [
    { label: 'Inicio', to: '/' },
    ...sections.map(label => ({
      label: label === 'Administración' ? 'Administración de catálogos' : label,
      to: label === 'Administración' ? '/catalogos/fuentes'
        : label === 'Consultas' ? (canAdmin ? '/consultas/eventos' : '/consultas/activos')
        : label === 'Palo Alto' ? '/servicios/palo-alto'
        : '/servicios/orion',
    })),
  ];
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const searchInput = useRef<HTMLInputElement>(null);
  const results = pages.filter(page => `${page.section} ${page.title}`.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'))).slice(0, 8);

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') setSearchOpen(false);
    }
    document.addEventListener('keydown', shortcut);
    return () => document.removeEventListener('keydown', shortcut);
  }, []);
  useEffect(() => { if (searchOpen) searchInput.current?.focus(); }, [searchOpen]);
  useEffect(() => { setSearchOpen(false); }, [pathname]);

  return <header className="private-navbar">
    <div className="navbar-leading">
      <button className="navbar-toggle navbar-toggle-mobile" type="button" onClick={onToggle}
        aria-label="Alternar menú lateral" aria-controls="private-sidebar" aria-expanded={expanded}><Menu size={20} aria-hidden="true" /></button>
      <nav className="navbar-breadcrumb" aria-label="Ruta de navegación">
        <ol>{breadcrumbs.map(crumb => <li key={`${crumb.label}-${crumb.to}`}>
          <Link to={crumb.to}>{crumb.label}</Link><ChevronRight size={14} strokeWidth={1.8} aria-hidden="true" />
        </li>)}<li><span aria-current="page">{title}</span></li></ol>
      </nav>
    </div>
    <div className="navbar-actions">
      <button className="navbar-icon-button" type="button" aria-label="Buscar páginas (Ctrl+K)" title="Buscar · Ctrl+K"
        onClick={() => setSearchOpen(true)}><Search size={19} strokeWidth={1.8} aria-hidden="true" /></button>
      <UserMenu />
    </div>
    {searchOpen && <div className="navbar-search-overlay" onPointerDown={event => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
      <div className="navbar-search-dialog" role="dialog" aria-modal="true" aria-label="Buscar páginas">
        <div className="navbar-search-field"><Search size={19} aria-hidden="true" />
          <input ref={searchInput} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Buscar páginas…" aria-label="Buscar páginas" />
          <button type="button" onClick={() => setSearchOpen(false)} aria-label="Cerrar búsqueda"><X size={18} aria-hidden="true" /></button>
        </div>
        <div className="navbar-search-results">
          {results.length ? results.map(page => <NavLink key={page.path} to={page.path} onClick={() => { setSearchOpen(false); setQuery(''); }}>
            <span>{page.title}</span><small>{page.section || 'Monitoreo'}</small>
          </NavLink>) : <p>No se encontraron páginas.</p>}
        </div>
      </div>
    </div>}
  </header>;
}
