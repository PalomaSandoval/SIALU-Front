import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export interface MenuItem { label: string; path?: string; icon?: LucideIcon; children?: MenuItem[] }
export default function MenuGroup({ item, onNavigate }: { item: MenuItem; onNavigate: () => void }) {
  const Icon = item.icon;
  const { pathname } = useLocation();
  function containsPath(entry: MenuItem): boolean { return entry.path === pathname || Boolean(entry.children?.some(containsPath)); }
  const selected = containsPath(item);
  const [expanded, setExpanded] = useState(selected);
  useEffect(() => { if (selected) setExpanded(true); }, [selected]);
  if (item.children) return <details className="menu-group" open={expanded}>
    <summary onClick={event => { event.preventDefault(); setExpanded(value => !value); }}>{Icon && <Icon size={18} aria-hidden="true" />}<span>{item.label}</span></summary>
    <div className="menu-children">{item.children.map(child => <MenuGroup key={child.label} item={child} onNavigate={onNavigate} />)}</div>
  </details>;
  return <NavLink to={item.path!} end onClick={onNavigate} className={({ isActive }) => `menu-link${isActive ? ' is-active' : ''}`}>
    {Icon && <Icon size={18} aria-hidden="true" />}<span>{item.label}</span>
  </NavLink>;
}
