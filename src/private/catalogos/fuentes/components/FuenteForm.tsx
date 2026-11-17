import { useEffect, useRef } from 'react';
import type React from 'react';
import { X } from 'lucide-react';
import type { Fuente } from '../types.ts';
import FuenteIconUpload from './FuenteIconUpload.tsx';

interface Props {
  draft: Fuente | null; busy: boolean; error: string;
  setDraft: React.Dispatch<React.SetStateAction<Fuente | null>>;
  onSave: (event: React.SubmitEvent<HTMLFormElement>) => Promise<void>;
  onUploadIcon: (file: File) => Promise<void>;
}
export default function FuenteForm({ draft, busy, error, setDraft, onSave, onUploadIcon }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const isOpen = draft !== null;
  useEffect(() => { if (isOpen) dialog.current?.showModal(); else dialog.current?.close(); }, [isOpen]);
  function field(key: keyof Omit<Fuente, 'id' | 'vigente' | 'integracion_configurada'>, label: string, required = false, maxLength?: number, placeholder?: string, type = 'text') {
    return <label className="fu-field">{label}{required && <span aria-hidden="true"> *</span>}<input type={type} required={required} maxLength={maxLength} min={type === 'number' ? 0 : undefined} max={type === 'number' ? 2147483647 : undefined} value={draft?.[key] || ''} placeholder={placeholder} onChange={event => setDraft(value => value && ({ ...value, [key]: event.target.value }))} /></label>;
  }
  // Read-only on edit: these values drive the integration and must match what the backend stored.
  function readOnly(label: string, value: string) {
    return <label className="fu-field">{label}<input readOnly value={value} /></label>;
  }
  const editing = !!draft?.id;
  return <><style>{styles}</style>
    <dialog ref={dialog} className="fu-dialog" aria-labelledby="fu-dialog-title" onCancel={event => { if (busy) event.preventDefault(); else setDraft(null); }} onClick={event => { if (!busy && event.target === event.currentTarget) setDraft(null); }}>
      {draft && <form onSubmit={onSave}><header><div><h2 id="fu-dialog-title">{draft.id ? 'Editar fuente' : 'Agregar fuente'}</h2><p>Configura la información del sistema de origen.</p></div><button type="button" disabled={busy} className="fu-close" aria-label="Cerrar formulario" onClick={() => setDraft(null)}><X size={20} /></button></header><fieldset disabled={busy} className="fu-form-body"><p className="fu-required">Los campos con * son obligatorios. {editing ? 'El método de integración y la zona horaria no se pueden modificar.' : 'Las credenciales y la conexión efectiva de las APIs se configuran en el backend.'}</p><div className="fu-form-grid">{field('nombre', 'Nombre de la fuente', true, 100, 'Ej. SolarWinds Orion')}{field('fabricante', 'Fabricante', false, 100, 'Ej. SolarWinds')}{editing ? <>{readOnly('Método de integración', draft.metodo)}{readOnly('Zona horaria', draft.zona)}</> : <><label className="fu-field">Método de integración *<select value={draft.metodo} onChange={event => setDraft({ ...draft, metodo: event.target.value })}>{['API', 'SYSLOG', 'BD', 'ARCHIVO', 'AGENTE', 'WEF', 'OTRO'].map(method => <option key={method}>{method}</option>)}</select></label>{field('zona', 'Zona horaria', true, 64, 'Ej. UTC')}{field('origen', 'Origen de los datos', false, 200, 'Dirección o identificador del origen')}{field('version', 'Versión', false, 50)}</>}<label className="fu-field">Estado<select disabled={draft.integracion_configurada} value={String(draft.vigente)} onChange={event => setDraft({ ...draft, vigente: event.target.value === 'true' })}><option value="true">Activa</option><option value="false">Inactiva</option></select></label></div>{editing && <FuenteIconUpload fuente={draft} busy={busy} onUpload={onUploadIcon} />} {!editing && <details className="fu-advanced"><summary>Configuración avanzada</summary><p>Retención en días. Deja los campos vacíos si no está definida.</p><div className="fu-form-grid">{field('raw', 'Datos originales', false, undefined, 'Sin definir', 'number')}{field('eventos', 'Eventos procesados', false, undefined, 'Sin definir', 'number')}</div><label className="fu-field">Parámetros de integración (JSON)<textarea rows={4} value={draft.parametros} placeholder="{}" onChange={event => setDraft({ ...draft, parametros: event.target.value })} /></label></details>}{error && <p className="fu-error" role="alert">{error}</p>}</fieldset><footer><button type="button" disabled={busy} className="fu-button" onClick={() => setDraft(null)}>Cancelar</button><button type="submit" disabled={busy} className="fu-button fu-primary">{busy ? 'Guardando…' : draft.id ? 'Guardar cambios' : 'Agregar fuente'}</button></footer></form>}
    </dialog>
  </>;
}

const styles = `
.fu-notice button,.fu-close{display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;border:0;background:transparent;color:var(--palette-muted);cursor:pointer}
.fu-dialog{border:1px solid var(--palette-legacyBorder);border-radius:14px;padding:0;width:650px;max-width:calc(100vw - 32px);max-height:88svh;overflow-y:auto;color:var(--palette-text);background:var(--palette-white);font:inherit;box-shadow:0 20px 80px var(--palette-legacyCardShadow)}
.fu-dialog::backdrop{background:rgba(20,14,24,.35)}
.fu-dialog header{display:flex;justify-content:space-between;align-items:flex-start;padding:24px;border-bottom:1px solid var(--palette-neutralSurface)}
.fu-dialog h2{font-size:19px;margin:0 0 8px;font-weight:600}
.fu-dialog header p,.fu-advanced p{font-size:12px;color:var(--palette-legacyMuted);line-height:1.6;margin:0}
.fu-form-body{padding:20px 24px}
.fu-required{font-size:11px;color:var(--palette-legacyMuted);margin:0 0 20px}
.fu-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px 18px}
.fu-field{display:block;font-size:12px;color:var(--palette-muted)}
.fu-field>span{color:var(--palette-primary)}
.fu-field input,.fu-field select,.fu-field textarea{display:block;width:100%;border:1px solid var(--palette-legacyBorder);border-radius:7px;background:var(--palette-white);color:var(--palette-text);padding:11px 10px;margin-top:8px;font:inherit;box-sizing:border-box}
.fu-field textarea{resize:vertical;font-family:monospace}
.fu-field input[readonly]{background:var(--palette-neutralSurface);color:var(--palette-muted);cursor:default}
.fu-field input:focus,.fu-field select:focus,.fu-field textarea:focus{outline:2px solid var(--palette-primary);outline-offset:1px}
.fu-icon-section{display:flex;align-items:center;gap:16px;margin-top:22px;padding:18px;border:1px solid var(--palette-legacyBorder);border-radius:8px}
.fu-icon-preview{display:grid;place-items:center;width:72px;height:72px;flex:none;border:1px solid var(--palette-legacyBorder);border-radius:8px;background:var(--palette-neutralSurface);overflow:hidden}
.fu-icon-preview img{width:100%;height:100%;object-fit:contain}
.fu-icon-preview span{padding:6px;color:var(--palette-legacyMuted);font-size:10px;text-align:center}
.fu-icon-section strong{display:block;font-size:12px}
.fu-icon-section p{margin:5px 0 10px;color:var(--palette-legacyMuted);font-size:11px}
.fu-file-input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}
.fu-icon-upload{padding:8px 12px;border:1px solid var(--palette-legacyBorder);border-radius:6px;background:var(--palette-white);color:var(--palette-text);font-size:12px;cursor:pointer}
.fu-icon-upload:hover{background:var(--palette-neutralSurface)}
.fu-advanced{margin-top:24px;border-top:1px solid var(--palette-neutralSurface);padding-top:18px}
.fu-advanced summary{cursor:pointer;font-size:12px;color:var(--palette-primary)}
.fu-advanced p{margin:15px 0}
.fu-advanced>.fu-field{margin-top:20px}
.fu-dialog footer{display:flex;justify-content:flex-end;gap:10px;padding:18px 24px;border-top:1px solid var(--palette-neutralSurface)}
.fu-error{font-size:12px;color:var(--palette-errorText);background:var(--palette-errorSurface);padding:12px;border-radius:7px}
fieldset.fu-form-body{border:0;margin:0;min-width:0}
.fu-dialog{box-shadow:none;border-radius:12px}
@media(max-width:600px){.fu-form-grid{grid-template-columns:1fr}.fu-dialog header,.fu-form-body{padding:20px}.fu-dialog footer{padding:16px 20px}}
`;
