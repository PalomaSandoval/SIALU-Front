import { useEffect, useRef } from 'react';
import type React from 'react';
import { X } from 'lucide-react';
import { results } from '../types.ts';
import type { TrafficAction, Result } from '../types.ts';

interface Props {
  draft: TrafficAction | null; busy: boolean; error: string;
  onChange: React.Dispatch<React.SetStateAction<TrafficAction | null>>;
  onSave: (event: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
}
export default function TrafficActionForm({ draft, busy, error, onChange, onSave }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const open = draft !== null;
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  return <><style>{styles}</style><dialog ref={dialog} className="traffic-action-form" aria-labelledby="traffic-action-form-title"
    onCancel={event => { if (busy) event.preventDefault(); else onChange(null); }}>
    {draft && <form onSubmit={onSave}>
      <header><h2 id="traffic-action-form-title">{draft.id ? 'Editar acción' : 'Editar acción'}</h2>
        <button type="button" disabled={busy} aria-label="Cerrar formulario" onClick={() => onChange(null)}><X size={18} /></button></header>
      <fieldset disabled={busy}>
        <label>Nombre *<input autoFocus required maxLength={50} value={draft.nombre} onChange={event => onChange({ ...draft, nombre: event.target.value })} /></label>
        <label>Descripción<textarea maxLength={300} rows={4} value={draft.descripcion} onChange={event => onChange({ ...draft, descripcion: event.target.value })} /></label>
        <label>Resultado<select value={draft.resultado} onChange={event => onChange({...draft, resultado: event.target.value as Result})}>{Object.entries(results).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <p>El nombre y resultado son compartidos por los eventos y equivalencias de esta acción.</p>
        {error && <p className="traffic-action-form-error" role="alert">{error}</p>}
      </fieldset>
      <footer><button className="traffic-action-button" type="button" disabled={busy} onClick={() => onChange(null)}>Cancelar</button>
        <button className="traffic-action-button primary" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button></footer>
    </form>}
  </dialog></>;
}
const styles = `
.traffic-action-form{width:480px;max-width:calc(100vw - 32px);max-height:85svh;padding:0;border:1px solid var(--palette-editorialControlBorder);border-radius:16px;background:var(--palette-white);color:var(--palette-text);font:inherit}
.traffic-action-form::backdrop{background:rgba(27,19,32,.32)}
.traffic-action-form header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px;border-bottom:1px solid var(--palette-editorialBorder)}
.traffic-action-form h2{margin:0;font-size:18px;font-weight:600}
.traffic-action-form header button{display:grid;place-items:center;width:40px;height:40px;border:0;background:transparent;color:var(--palette-muted);border-radius:50%;cursor:pointer}
.traffic-action-form fieldset{border:0;margin:0;padding:24px;min-width:0}
.traffic-action-form label{display:block;margin-bottom:20px;color:var(--palette-muted);font-size:13px}
.traffic-action-form input,.traffic-action-form textarea{display:block;width:100%;margin-top:8px;border:1px solid var(--palette-editorialControlBorder);border-radius:8px;padding:11px;background:var(--palette-white);color:var(--palette-text);font:inherit;box-sizing:border-box}
.traffic-action-form select{display:block;width:100%;margin-top:8px;padding:11px;border:1px solid var(--palette-editorialControlBorder);border-radius:8px;background:var(--palette-white);color:var(--palette-text);font:inherit}.traffic-action-form textarea{resize:vertical}
.traffic-action-form footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid var(--palette-editorialBorder)}
.traffic-action-form-error{color:var(--palette-errorText);font-size:13px;line-height:1.6}
`;
