import { useEffect, useRef } from 'react';
import type React from 'react';
import { X } from 'lucide-react';
import { locationDefinitions } from '../types.ts';
import type { LocationEntry, LocationKind } from '../types.ts';

interface Props {
  kind: LocationKind; draft: LocationEntry | null; busy: boolean; error: string;
  onChange: React.Dispatch<React.SetStateAction<LocationEntry | null>>;
  onSave: (event: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
}
export default function LocationForm({ kind, draft, busy, error, onChange, onSave }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const open = draft !== null;
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  return <><style>{styles}</style><dialog ref={dialog} className="location-form" aria-labelledby="location-form-title"
    onCancel={event => { if (busy) event.preventDefault(); else onChange(null); }}>
    {draft && <form onSubmit={onSave}>
      <header><h2 id="location-form-title">Editar {locationDefinitions[kind].singular}</h2>
        <button type="button" disabled={busy} aria-label="Cerrar formulario" onClick={() => onChange(null)}><X size={18} /></button></header>
      <fieldset disabled={busy}>
        <label>Nombre *<input autoFocus required maxLength={150} value={draft.nombre} onChange={event => onChange({ ...draft, nombre: event.target.value })} /></label>
        <label>Descripción<textarea maxLength={300} rows={4} value={draft.descripcion} onChange={event => onChange({ ...draft, descripcion: event.target.value })} /></label>
        {error && <p className="location-form-error" role="alert">{error}</p>}
      </fieldset>
      <footer><button className="location-button" type="button" disabled={busy} onClick={() => onChange(null)}>Cancelar</button>
        <button className="location-button primary" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button></footer>
    </form>}
  </dialog></>;
}
const styles = `
.location-form{width:480px;max-width:calc(100vw - 32px);max-height:85svh;padding:0;border:1px solid var(--palette-editorialControlBorder);border-radius:16px;background:var(--palette-white);color:var(--palette-text);font:inherit}
.location-form::backdrop{background:rgba(27,19,32,.32)}
.location-form header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px;border-bottom:1px solid var(--palette-editorialBorder)}
.location-form h2{margin:0;font-size:18px;font-weight:600}
.location-form header button{display:grid;place-items:center;width:40px;height:40px;border:0;background:transparent;color:var(--palette-muted);border-radius:50%;cursor:pointer}
.location-form fieldset{border:0;margin:0;padding:24px;min-width:0}
.location-form label{display:block;margin-bottom:20px;color:var(--palette-muted);font-size:13px}
.location-form input,.location-form textarea{display:block;width:100%;margin-top:8px;border:1px solid var(--palette-editorialControlBorder);border-radius:8px;padding:11px;background:var(--palette-white);color:var(--palette-text);font:inherit;box-sizing:border-box}
.location-form textarea{resize:vertical}
.location-form footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid var(--palette-editorialBorder)}
.location-form-error{color:var(--palette-errorText);font-size:13px;line-height:1.6}
`;
