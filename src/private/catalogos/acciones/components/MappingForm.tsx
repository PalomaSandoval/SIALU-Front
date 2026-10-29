import { useEffect, useRef } from 'react';
import type React from 'react';
import { X } from 'lucide-react';

import { results } from '../types.ts';
import type { TrafficAction, ActionMapping } from '../types.ts';

interface Props {
  draft: ActionMapping; actions: TrafficAction[]; busy: boolean; error: string;
  onEditAction: (action: TrafficAction) => void;
  onChange: React.Dispatch<React.SetStateAction<ActionMapping | null>>;
  onSave: (event: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
}
export default function MappingForm({ draft, actions, onEditAction, busy, error, onChange, onSave }: Props) {
  const selected = actions.find(action => action.id === draft.accion_id);
  const dialog = useRef<HTMLDialogElement>(null);
  const open = draft !== null;
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  return <><style>{styles}</style><dialog ref={dialog} className="traffic-mapping-form" aria-labelledby="traffic-mapping-form-title"
    onCancel={event => { if (busy) event.preventDefault(); else onChange(null); }}>
    {draft && <form onSubmit={onSave}>
      <header><h2 id="traffic-mapping-form-title">Editar interpretación de la acción</h2>
        <button type="button" disabled={busy} aria-label="Cerrar formulario" onClick={() => onChange(null)}><X size={18} /></button></header>
      <fieldset disabled={busy}>
        <label>Fuente<input readOnly value={draft.fuente} /></label>
        <label>Acción recibida<input readOnly value={draft.valor} /></label>
        <label>Interpretación en SIALU<select autoFocus required value={draft.accion_id} onChange={event => onChange({...draft, accion_id: Number(event.target.value)})}>{actions.filter(a => a.vigente || a.id === draft.accion_id).map(a => <option key={a.id} value={a.id} disabled={!a.vigente}>{a.nombre}</option>)}</select></label>
        <label>Resultado<input readOnly value={selected ? results[selected.resultado] : 'Sin asignar'} /></label>
        {selected && <button className="traffic-action-button" type="button" disabled={busy} onClick={() => onEditAction(selected)}>Editar nombre, descripción y resultado</button>}
        <p>Se aplicará a los próximos eventos. No reasigna eventos históricos.</p>
        {error && <p className="traffic-mapping-form-error" role="alert">{error}</p>}
      </fieldset>
      <footer><button className="traffic-action-button" type="button" disabled={busy} onClick={() => onChange(null)}>Cancelar</button>
        <button className="traffic-action-button primary" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button></footer>
    </form>}
  </dialog></>;
}
const styles = `
.traffic-mapping-form{width:480px;max-width:calc(100vw - 32px);max-height:85svh;padding:0;border:1px solid var(--palette-editorialControlBorder);border-radius:16px;background:var(--palette-white);color:var(--palette-text);font:inherit}
.traffic-mapping-form::backdrop{background:rgba(27,19,32,.32)}
.traffic-mapping-form header{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px;border-bottom:1px solid var(--palette-editorialBorder)}
.traffic-mapping-form h2{margin:0;font-size:18px;font-weight:600}
.traffic-mapping-form header button{display:grid;place-items:center;width:40px;height:40px;border:0;background:transparent;color:var(--palette-muted);border-radius:50%;cursor:pointer}
.traffic-mapping-form fieldset{border:0;margin:0;padding:24px;min-width:0}
.traffic-mapping-form label{display:block;margin-bottom:20px;color:var(--palette-muted);font-size:13px}
.traffic-mapping-form input,.traffic-mapping-form textarea{display:block;width:100%;margin-top:8px;border:1px solid var(--palette-editorialControlBorder);border-radius:8px;padding:11px;background:var(--palette-white);color:var(--palette-text);font:inherit;box-sizing:border-box}
.traffic-mapping-form select{display:block;width:100%;margin-top:8px;padding:11px;border:1px solid var(--palette-editorialControlBorder);border-radius:8px;background:var(--palette-white);color:var(--palette-text);font:inherit}.traffic-mapping-form textarea{resize:vertical}
.traffic-mapping-form footer{display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid var(--palette-editorialBorder)}
.traffic-mapping-form-error{color:var(--palette-errorText);font-size:13px;line-height:1.6}
`;
