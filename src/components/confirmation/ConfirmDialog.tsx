import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp, X } from 'lucide-react';
import { theme } from '../../theme/theme.ts';

export interface ConfirmationOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
}

interface Props { options: ConfirmationOptions | null; onResolve: (confirmed: boolean) => void }

export default function ConfirmDialog({ options, onResolve }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!options || !element) return;
    element.showModal();
    cancel.current?.focus();
    return () => { if (element.open) element.close(); };
  }, [options]);

  if (!options) return null;
  return createPortal(<dialog ref={dialog} className={`sialu-confirm ${options.tone === 'danger' ? 'is-danger' : ''}`}
    style={theme.cssVariables} aria-labelledby={titleId} aria-describedby={descriptionId}
    onCancel={event => { event.preventDefault(); onResolve(false); }}
    onClick={event => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onResolve(false);
    }}>
    <style>{styles}</style>
    <button type="button" className="sialu-confirm-close" aria-label="Cerrar confirmación" onClick={() => onResolve(false)}><X size={17} aria-hidden="true" /></button>
    <div className="sialu-confirm-icon" aria-hidden="true"><CircleHelp size={23} /></div>
    <h2 id={titleId}>{options.title}</h2>
    <p id={descriptionId}>{options.description}</p>
    <div className="sialu-confirm-actions">
      <button ref={cancel} type="button" className="sialu-confirm-cancel" onClick={() => onResolve(false)}>{options.cancelLabel || 'Cancelar'}</button>
      <button type="button" className="sialu-confirm-accept" onClick={() => onResolve(true)}>{options.confirmLabel || 'Confirmar'}</button>
    </div>
  </dialog>, document.body);
}

const styles = `
.sialu-confirm{--confirm-accent:var(--palette-primary);--confirm-tint:var(--palette-noticeSurface);box-sizing:border-box;position:fixed;width:400px;max-width:calc(100vw - 32px);max-height:calc(100svh - 48px);margin:auto;padding:30px 26px 24px;border:1px solid var(--palette-editorialBorder);border-radius:20px;background:var(--palette-white);color:var(--palette-text);font-family:var(--font-body);text-align:center;overflow:auto}
.sialu-confirm.is-danger{--confirm-accent:var(--palette-errorText);--confirm-tint:var(--palette-errorSurface)}
.sialu-confirm::backdrop{background:rgba(27,19,32,.32)}
.sialu-confirm *{box-sizing:border-box}
.sialu-confirm button{font-family:inherit;cursor:pointer}
.sialu-confirm-close{position:absolute;right:9px;top:9px;display:grid;place-items:center;width:36px;height:36px;padding:0;border:0;border-radius:50%;background:transparent;color:var(--palette-muted)}
.sialu-confirm-close:hover{background:var(--palette-neutralSurface)}
.sialu-confirm-icon{display:grid;place-items:center;width:52px;height:52px;margin:4px auto 19px;border:7px solid color-mix(in srgb,var(--confirm-tint),white 45%);border-radius:50%;background:var(--confirm-tint);color:var(--confirm-accent)}
.sialu-confirm h2{font-size:18px;font-weight:700;line-height:1.4;margin:0 0 10px;letter-spacing:-.02em;overflow-wrap:anywhere}
.sialu-confirm p{max-width:310px;margin:0 auto 24px;font-size:13px;line-height:1.7;color:var(--palette-legacyMuted);overflow-wrap:anywhere}
.sialu-confirm-actions{display:flex;gap:10px}
.sialu-confirm-actions button{flex:1;min-width:0;min-height:42px;padding:10px 12px;border:1px solid var(--palette-editorialControlBorder);border-radius:8px;font-size:13px;font-weight:600;line-height:1.4}
.sialu-confirm-cancel{background:var(--palette-white);color:var(--palette-text)}
.sialu-confirm-cancel:hover{background:var(--palette-neutralSurface)}
.sialu-confirm-actions .sialu-confirm-accept{background:var(--confirm-accent);border-color:var(--confirm-accent);color:var(--palette-white)}
.sialu-confirm-accept:hover{filter:brightness(.9)}
.sialu-confirm button:focus-visible{outline:2px solid var(--confirm-accent);outline-offset:3px}
@media(max-width:420px){.sialu-confirm{padding:30px 20px 20px}}
`;
