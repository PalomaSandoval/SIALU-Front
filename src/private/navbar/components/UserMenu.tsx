import React, { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthProvider.tsx';
import { errorMessage } from '../../../services/errors.ts';
const userMenuStyles = `
.private-layout .sialu-account{position:relative;font-family:var(--font-body);--account-surface:var(--palette-white);--account-ink:var(--palette-text);--account-muted:var(--palette-legacyMuted);--account-brand:var(--palette-primary);--account-soft:var(--palette-noticeSurface);--account-edge:#ede9f0;--account-danger:#dc2626}
.private-layout .account-trigger{display:flex;align-items:center;gap:10px;border:0;border-radius:8px;background:transparent;color:var(--account-ink);padding:5px 8px;min-height:42px;text-align:left}
.private-layout .account-trigger:hover{background:var(--account-soft)}
.private-layout .account-avatar{width:34px;height:34px;flex-shrink:0;border-radius:50%;display:grid;place-items:center;background:var(--account-soft);color:var(--account-brand);font-size:12px;font-weight:600;border:0;box-shadow:none}
.private-layout .account-trigger-identity{display:flex;flex-direction:column;gap:3px;min-width:0}.private-layout .account-name{font-size:13px;font-weight:500;max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.private-layout .account-role{display:block;font-size:12px;color:var(--account-muted);font-weight:400;line-height:1.5}
.private-layout .account-chevron{transition:transform 150ms ease;color:var(--account-muted)}.private-layout .account-chevron.rotated{transform:rotate(180deg)}
.private-layout .account-panel{position:absolute;right:0;top:calc(100% + 8px);z-index:50;width:280px;max-width:calc(100vw - 24px);padding:7px;background:var(--account-surface);color:var(--account-ink);border:1px solid var(--account-edge);border-radius:12px;box-shadow:0 10px 30px rgba(20,10,30,.10);transform-origin:top right;animation:account-enter 150ms ease-out}
.private-layout .account-profile{display:flex;align-items:center;gap:10px;padding:12px 9px}.private-layout .profile-avatar{width:40px;height:40px}.private-layout .account-profile-copy{min-width:0;flex:1}.private-layout .account-profile-name{display:block;font-size:14px;font-weight:600;line-height:1.45;overflow-wrap:anywhere}.private-layout .account-email{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;line-height:1.7;color:var(--account-muted);margin-top:2px}
.private-layout .account-divider{height:1px;background:var(--account-edge);margin:5px 5px}
.private-layout .account-item{display:flex;align-items:center;gap:10px;min-height:40px;width:100%;padding:9px 12px;background:transparent;border:0;border-radius:8px;font-size:14px;font-weight:400;text-align:left;color:var(--account-ink);line-height:22px}.private-layout .account-item svg{flex-shrink:0;stroke-width:1.7;color:var(--account-muted)}
.private-layout .account-item:not([aria-disabled="true"]):hover{background:color-mix(in srgb,var(--account-brand) 7%,transparent);color:var(--account-ink)}
.private-layout .account-item[aria-disabled="true"]{cursor:default;color:var(--account-muted)}.private-layout .account-pending{margin-left:auto;font-size:10px;color:var(--account-muted)}
.private-layout .sialu-account button:focus-visible{outline:2px solid var(--account-brand);outline-offset:-2px}
.private-layout .account-signout,.private-layout .account-signout svg{color:var(--account-danger)}.private-layout .account-signout:not([aria-disabled="true"]):hover{color:var(--account-danger);background:rgba(220,38,38,.06)}.private-layout .account-error{font-size:12px;color:var(--account-danger);margin:8px 12px;overflow-wrap:anywhere}
@keyframes account-enter{from{opacity:0;transform:translateY(-4px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}
@media(max-width:800px){.private-layout .account-trigger-identity{display:none}.private-layout .account-panel{position:fixed;top:66px;left:12px;right:12px;width:auto;max-width:none}.private-layout .account-trigger{padding:5px}}
@media(prefers-reduced-motion:reduce){.private-layout .account-panel{animation:none}.private-layout .account-chevron{transition:none}}

.private-layout .account-email-heading{padding:10px 12px}.private-layout .account-email-heading .account-email{font-size:12px;margin-top:4px}

`;

function normalCase(value: string) {
  return value === value.toLocaleUpperCase('es')
    ? value.toLocaleLowerCase('es').replace(/(^|\s)\S/g, letter => letter.toLocaleUpperCase('es')) : value;
}

export default function UserMenu() {
  const { session, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const initialFocus = useRef<'first' | 'last'>('first');
  const id = useId();
  const user = session?.data;
  const name = normalCase(user?.cn || user?.uid || 'Usuario');
  const role = normalCase(user?.TipoUsuario || 'Usuario');
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('es');
  const items = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') || []);

  useEffect(() => { setOpen(false); }, [location]);
  useEffect(() => {
    if (!open) return;
    const choices = items();
    (initialFocus.current === 'last' ? choices.at(-1) : choices[0])?.focus();
    function outside(event: PointerEvent) { if (!container.current?.contains(event.target as Node)) setOpen(false); }
    function focusOutside(event: FocusEvent) { if (!container.current?.contains(event.target as Node)) setOpen(false); }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', focusOutside);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', focusOutside); };
  }, [open]);

  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape' && open) { event.preventDefault(); setOpen(false); trigger.current?.focus(); return; }
    if (!open) return;
    const choices = items();
    const index = choices.indexOf(document.activeElement as HTMLElement);
    let next: number;
    if (event.key === 'ArrowDown') next = (index + 1) % choices.length;
    else if (event.key === 'ArrowUp') next = (index - 1 + choices.length) % choices.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = choices.length - 1;
    else return;
    event.preventDefault(); choices[next]?.focus();
  }
  async function signOut() {
    if (busy) return;
    setBusy(true); setError('');
    try { await logout(); setOpen(false); }
    catch (exception) { setError(errorMessage(exception)); }
    finally { setBusy(false); }
  }

  return <div className="sialu-account" ref={container} onKeyDown={keyboard}>
      <style>{userMenuStyles}</style>
    <button ref={trigger} className="account-trigger" type="button" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
      onClick={() => { initialFocus.current = 'first'; setOpen(value => !value); }}
      onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); initialFocus.current = event.key === 'ArrowUp' ? 'last' : 'first'; setOpen(true); } }}>
      <span className="account-avatar" aria-hidden="true">{initials}</span><span className="account-trigger-identity"><span className="account-name">{name}</span><span className="account-role">{role}</span></span>
      <ChevronDown size={15} className={`account-chevron${open ? ' rotated' : ''}`} aria-hidden="true" />
    </button>
    {open && <div ref={panel} id={id} className="account-panel" role="menu" aria-label="Menú de usuario">
      {user?.mail && <><div className="account-email-heading" role="presentation"><span className="account-role">Universidad Autonoma de Chihuahua</span><span className="account-email" title={user.mail}>{user.mail}</span></div><div className="account-divider" role="separator" /></>}
      <button className="account-item account-signout" type="button" role="menuitem" tabIndex={-1} aria-disabled={busy} aria-busy={busy} onClick={signOut}><LogOut size={17} aria-hidden="true" /><span>{busy ? 'Cerrando sesión…' : 'Cerrar sesión'}</span></button>
      {error && <p className="account-error" role="alert">{error}</p>}
    </div>}
  </div>;
}
