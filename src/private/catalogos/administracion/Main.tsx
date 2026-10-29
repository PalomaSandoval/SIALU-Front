import { useEffect, useRef, useState } from 'react';
import type { SubmitEvent } from 'react';
import CatalogList from '../../../components/catalogos/CatalogList.tsx';
import { useConfirmation } from '../../../components/confirmation/ConfirmationProvider.tsx';
import { request } from '../../../services/api.ts';
import { definitions, list, save, toggle } from './api.ts';
import type { AdminKind, Row } from './api.ts';
import './administracion.css';

interface Option { id: number; nombre: string; vigente: boolean }
export default function AdministrationMain({ kind }: { kind: AdminKind }) {
  const [items, setItems] = useState<Row[]>([]);
  const [options, setOptions] = useState<Record<string, Option[]>>({});
  const [draft, setDraft] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const confirm = useConfirmation();
  const definition = definitions[kind];
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    const needs = new Set(definition.fields.map(f => f.options));
    Promise.all([
      list(kind, controller.signal),
      needs.has('roles') ? list('tipos-usuarios', controller.signal) : Promise.resolve([]),
      needs.has('permisos') ? list('permisos', controller.signal) : Promise.resolve([]),
      needs.has('areas') ? request<{ data: Option[] }>('/catalogos/areas', { signal: controller.signal }) : Promise.resolve({ data: [] }),
      needs.has('contextos') ? request<{ data: Option[] }>('/catalogos/contextos-red', { signal: controller.signal }) : Promise.resolve({ data: [] }),
      needs.has('activos') ? request<{ data: Option[] }>('/catalogos/ubicaciones/activos', { signal: controller.signal }) : Promise.resolve({ data: [] }),
      needs.has('grupos') ? request<{ data: Option[] }>('/catalogos/grupos-infraestructura', { signal: controller.signal }) : Promise.resolve({ data: [] }),
      needs.has('interfaces') ? request<{ data: Option[] }>('/catalogos/interfaces', { signal: controller.signal }) : Promise.resolve({ data: [] }),
      needs.has('fuentes') ? request<{ data: Option[] }>('/catalogos/fuentes', { signal: controller.signal }) : Promise.resolve({ data: [] }),
    ]).then(([rows, roles, permissions, areas, contexts, assets, groups, interfaces, sources]) => {
      if (controller.signal.aborted) return;
      setItems(rows); setOptions({ roles: roles.map(r => ({ id: r.id, nombre: String(r.descripcion), vigente: r.vigente })),
        permisos: permissions.map(r => ({ id: r.id, nombre: String(r.clave), vigente: r.vigente })), areas: areas.data, contextos: contexts.data, activos: assets.data, grupos: groups.data, interfaces: interfaces.data, fuentes: sources.data });
    }).catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudo cargar.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [kind, definition, revision]);
  const open = draft !== null;
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  function edit(row?: Row) {
    setFormError('');
    setDraft(row ? { ...row } : { ...Object.fromEntries(definition.fields.map(f => [f.key, ''])), id: 0, vigente: true });
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft || busy) return;
    if (draft.id && !await confirm({ title: '¿Guardar cambios?', description: 'Se actualizará la configuración seleccionada.', confirmLabel: 'Guardar' })) return;
    setBusy(true); setFormError('');
    try { await save(kind, draft); setDraft(null); setNotice('Registro guardado.'); setRevision(r => r + 1); }
    catch(e) { setFormError(e instanceof Error ? e.message : 'No se pudo guardar.'); }
    finally { setBusy(false); }
  }
  async function changeState(row: Row) {
    if (busy || !await confirm({ title: row.vigente ? '¿Desactivar registro?' : '¿Activar registro?', description: 'Este cambio puede afectar los accesos del sistema.', confirmLabel: 'Confirmar', tone: row.vigente ? 'danger' : 'default' })) return;
    setBusy(true); setError('');
    try { await toggle(kind, row); setRevision(r => r + 1); setNotice('Estado actualizado.'); }
    catch(e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar.'); }
    finally { setBusy(false); }
  }
  const title = (r: Row) => String(kind === 'interfaces' ? r.nombre : (kind === 'identificadores-interfaz' || kind === 'identificadores-activo') ? `${r.tipo}: ${r.valor}` : kind === 'grupos-activos' ? `${options.activos?.find(o=>o.id===Number(r.activo_id))?.nombre ?? r.activo_id} · ${options.grupos?.find(o=>o.id===Number(r.grupo_id))?.nombre ?? r.grupo_id}` : (kind === 'contextos-red' || kind === 'grupos-infraestructura') ? r.nombre : kind === 'asignaciones-ip' ? r.ip : kind === 'contextos-fuente' ? `${r.serial} / ${r.vsys} / ${r.zona}` : kind === 'usuarios' ? r.uid : kind === 'permisos' ? r.clave : kind === 'tipos-usuarios-permisos' ? `${r.rol} · ${r.permiso}` : r.descripcion);
  return <section className="administration-page"><header><h1>{definition.title}</h1><button disabled={loading || busy || !!error} onClick={() => edit()}>Agregar registro</button></header>
    {kind === 'asignaciones-ip' && <p>Las horas se registran en UTC. Para cambiar de equipo, cierra la asignación y crea otra. Las IP sin contexto requieren conciliación antes de asociar eventos.</p>}
    {notice && <p role="status">{notice}</p>}
    <CatalogList items={items} loading={loading} busy={busy} error={error} onRetry={() => setRevision(r => r + 1)} getKey={r => r.id} getTitle={title}
      getSubtitle={r => String(kind === 'usuarios' ? `${r.nombre} ${r.primer_apellido}` : r.descripcion ?? '')} isActive={r => r.vigente} onEdit={edit} onToggle={['contextos-red','contextos-fuente','asignaciones-ip','grupos-infraestructura','grupos-activos','interfaces','identificadores-interfaz','identificadores-activo'].includes(kind) ? undefined : changeState} />
    <dialog ref={dialog} onCancel={e => { if (busy) e.preventDefault(); else setDraft(null); }} aria-labelledby="admin-form-title">
      {draft && <form onSubmit={submit}><h2 id="admin-form-title">{draft.id ? 'Editar registro' : 'Agregar registro'}</h2><fieldset disabled={busy}>
        {definition.fields.map(field => <label key={field.key}>{field.label}{!field.optional && ' *'}
          {field.options ? <select required={!field.optional} value={String(draft[field.key] ?? '')} onChange={e => setDraft({ ...draft, [field.key]: e.target.value })}>
            <option value="">Selecciona</option>{(options[field.options] ?? []).filter(o => o.vigente || o.id === Number(draft[field.key])).map(o => <option key={o.id} value={o.id}>{o.nombre}{!o.vigente && ' (inactivo)'}</option>)}
          </select> : <input required={!field.optional} step={field.type === 'datetime-local' ? '0.001' : undefined} type={field.type ?? 'text'} min={field.key === 'extension' ? 0 : 1} max={field.type === 'number' ? 2147483647 : undefined} maxLength={field.max} value={String(draft[field.key] ?? '')} onChange={e => setDraft({ ...draft, [field.key]: e.target.value })} />}
        </label>)}
      </fieldset>{formError && <p role="alert">{formError}</p>}<footer><button type="button" disabled={busy} onClick={() => setDraft(null)}>Cancelar</button><button disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button></footer></form>}
    </dialog>
  </section>;
}
