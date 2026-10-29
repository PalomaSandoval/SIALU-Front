import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import UserMenu from './components/UserMenu.tsx';

export default function Navbar({ onToggle, expanded }: { onToggle: () => void; expanded: boolean }) {
  return <header className="private-navbar">
    <div className="navbar-brand"><button className="navbar-toggle" type="button" onClick={onToggle} aria-label="Alternar menú lateral" aria-controls="private-sidebar" aria-expanded={expanded}><Menu size={20} aria-hidden="true" /></button><Link to="/" className="navbar-sialu">SIALU</Link></div>
    <UserMenu />
  </header>;
}