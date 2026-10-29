import React from 'react';


import { Link, NavLink, useLocation } from 'react-router-dom';
import MenuGroup from './components/MenuGroup.tsx';
import type { MenuItem } from './components/MenuGroup.tsx';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { menu } from './menu.ts';

export default function Sidebar({ open, onNavigate, onExpand }: { open: boolean; onNavigate: () => void; onExpand: () => void }) {
  const { session } = useAuth();
  const canAdmin = session?.data.TipoUsuario.trim().toUpperCase() === 'ADMINISTRADOR';
  const visibleMenu = menu.filter(item => canAdmin || item.label !== 'Administración').map(item => item.children && !canAdmin ? { ...item, children: item.children.filter(child => child.path !== '/consultas/eventos') } : item);
  const { pathname } = useLocation();
  function isSelected(item: MenuItem): boolean {
    return item.path === pathname || Boolean(item.children?.some(isSelected));
  }
  return <aside id="private-sidebar" className={`private-sidebar${open ? ' is-open' : ' is-collapsed'}`}>
    <Link to="/" className="sidebar-brand" aria-label="SIALU Inicio" onClick={onNavigate}><span className="sidebar-logo"><img src="/images/loginCERT.png" alt="CERT" /></span></Link>
    <nav aria-label="Navegación principal">{visibleMenu.map(item => {
      if (open) return <React.Fragment key={item.label}>{(item.path === "/" || item.label === "Administración" || item.label === "Servicios") && <div className="sidebar-section-label">{item.path === "/" ? "GENERAL" : item.label === "Administración" ? "CATÁLOGOS" : "OPERACIÓN"}</div>}<MenuGroup item={item} onNavigate={onNavigate} /></React.Fragment>;
      const Icon = item.icon;
      return item.children
        ? <button key={item.label} type="button" className={`menu-link rail-link${isSelected(item) ? ' is-active' : ''}`} title={item.label} aria-label={`Abrir ${item.label}`} onClick={onExpand}>{Icon && <Icon size={20} aria-hidden="true" />}</button>
        : <NavLink key={item.label} to={item.path!} end title={item.label} aria-label={item.label} onClick={onNavigate} className={({ isActive }) => `menu-link rail-link${isActive ? ' is-active' : ''}`}>{Icon && <Icon size={20} aria-hidden="true" />}</NavLink>;
    })}</nav>
    
    {open && <div className="sidebar-session"><div className="sidebar-signature"><small>Sistema Integral de Analítica de Logs Universitario</small></div></div>}
  </aside>;
}