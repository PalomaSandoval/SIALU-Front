import { useEffect, useRef } from 'react';
import type React from 'react';
import { X } from 'lucide-react';
import type { Level } from '../useLevels.ts';

interface Props {
  draft: Level | null; busy: boolean; error: string;
  onChange: React.Dispatch<React.SetStateAction<Level | null>>;
  onSave: (event: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
}
export default function LevelForm({ draft, busy, error, onChange, onSave }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const open = draft !== null;
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  return <><style>{styles}</style><dialog ref={dialog} className="level-form" aria-labelledby="level-form-title"
    onCancel={event => { if (busy) event.preventDefault(); else onChange(null); }}>
    {draft && <form onSubmit={onSave}>
      <header><h2 id="level-form-title">Editar nivel de severidad</h2>
        <button type="button" disabled={busy} aria-label="Cerrar formulario" onClick={() => onChange(null)}><X size={18} /></button></header>
      <fieldset disabled={busy}>
        <label>Nombre *<input autoFocus required maxLength={50} value={draft.nombre} onChange={event => onChange({ ...draft, nombre: event.target.value })} /></label>
        <label>Descripción<textarea maxLength={300} rows={4} value={draft.descripcion} onChange={event => onChange({ ...draft, descripcion: event.target.value })} /></label>
        <label>Nivel<input type="number" readOnly value={draft.nivel} /><span className="level-range">El número de nivel es fijo.</span></label>
        {error && <p className="level-form-error" role="alert">{error}</p>}
      </fieldset>
      <footer><button className="level-button" type="button" disabled={busy} onClick={() => onChange(null)}>Cancelar</button>
        <button className="level-button primary" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button></footer>
    </form>}
  </dialog></>;
}
const styles = `
.level-form input:read-only{background:var(--palette-editorialSurface);color:var(--palette-muted);appearance:textfield;cursor:default}
.level-form input:read-only::-webkit-inner-spin-button,.level-form input:read-only::-webkit-outer-spin-button{appearance:none;margin:0}
.level-range{display:block;font-size:11px;line-height:1.5;color:var(--palette-muted);margin-top:7px}
.level-form{width:480px;max-width:calc(100vw - 32px);max-height:85svh;padding:0;border:1px solid var(--palette-editorialControlBorder);border-radius:16px;background:var(--palette-white);color:var(--palette-text);font:inherit}
.level-form::backdrop{background:rgba(27,19,32,.32)}
.level-form header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px;border-bottom:1px solid var(--palette-editorialBorder)}
.level-form h2{margin:0;font-size:18px;font-weight:600}
.level-form header button{display:grid;place-items:center;width:40px;height:40px;border:0;background:transparent;color:var(--palette-muted);border-radius:50%;cursor:pointer}
.level-form fieldset{border:0;margin:0;padding:24px;min-width:0}
.level-form label{display:block;margin-bottom:20px;color:var(--palette-muted);font-size:13px}
.level-form input,.level-form textarea{display:block;width:100%;margin-top:8px;border:1px solid var(--palette-editorialControlBorder);border-radius:8px;padding:11px;background:var(--palette-white);color:var(--palette-text);font:inherit;box-sizing:border-box}
.level-form textarea{resize:vertical}
.level-form footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid var(--palette-editorialBorder)}
.level-form-error{color:var(--palette-errorText);font-size:13px;line-height:1.6}
`;
