import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { MenuItem } from '../sidebar/components/MenuGroup.tsx';

const descriptions: Record<string, string> = {
  '/catalogos/fuentes': 'Gestiona las fuentes de datos conectadas al sistema.',
  '/catalogos/ubicaciones': 'Organiza ubicaciones, áreas y dependencias.',
  '/catalogos/niveles': 'Configura los niveles de severidad.',
  '/catalogos/acciones': 'Administra las acciones registradas del firewall.',
  '/catalogos/usuarios': 'Consulta y administra usuarios del sistema.',
  '/catalogos/tipos-usuarios': 'Define los roles disponibles para usuarios.',
  '/catalogos/permisos': 'Revisa los permisos de acceso.',
  '/catalogos/tipos-usuarios-permisos': 'Asigna permisos a cada rol.',
  '/consultas/eventos': 'Explora los eventos registrados por las fuentes.',
  '/consultas/activos': 'Consulta la actividad asociada a cada activo.',
  '/consultas/correlacion': 'Relaciona eventos de distintas fuentes.',
};

export default function SubnavMenu({ id, title, activePrefix, items }: { id: string; title: string; activePrefix: string; items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { pathname } = useLocation();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  function showMenu() {
    setMounted(true);
    setOpen(true);
  }
  function hideMenu() {
    setOpen(false);
    setMounted(false);
  }

  useEffect(() => {
    setOpen(false);
    setMounted(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) hideMenu();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        hideMenu();
        trigger.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return <div className="subnav-group" ref={container}
    onMouseEnter={showMenu}
    onMouseLeave={hideMenu}
    onBlurCapture={event => { if (!container.current?.contains(event.relatedTarget as Node)) hideMenu(); }}>
    <button ref={trigger} type="button" className={`subnavbar-link subnav-trigger${pathname.startsWith(activePrefix) ? ' is-active' : ''}`} aria-expanded={open} aria-controls={id} onClick={event => { if (event.detail === 0 && open) hideMenu(); else showMenu(); }}>
      {title}
    </button>
    {mounted && <div className="subnav-options" id={id} data-state={open ? 'open' : 'closed'} inert={!open}>
      <ul>{items.map(item => item.path && <li key={item.path}>
        <NavLink to={item.path} className={({ isActive }) => `subnav-option${isActive ? ' is-active' : ''}`} onClick={hideMenu}>
          <strong>{item.label}</strong>
          <span>{descriptions[item.path]}</span>
        </NavLink>
      </li>)}</ul>
    </div>}
  </div>;
}
