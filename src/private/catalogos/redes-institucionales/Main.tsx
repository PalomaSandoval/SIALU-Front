import { useEffect, useRef, useState } from 'react';
import type { SubmitEvent } from 'react';
import { Plus } from 'lucide-react';
import CatalogList from '../../../components/catalogos/CatalogList.tsx';
import { request } from '../../../services/api.ts';
import { useConfirmation } from '../../../components/confirmation/ConfirmationProvider.tsx';
import '../catalog-admin.css';
interface Option { id: number; nombre: string; vigente: boolean }
interface Network { id: number; nombre: string; cidr: string; inicio: string; fin: string; version: number; tipo: string; zona: string; vlan: number | null; campus: string; campus_id: number | null; zona_id: number | null; unidad_id: number | null; criticidad_id: number | null; descripcion: string; vigente: boolean }
const types: Record<string, string> = { INTERNA: 'Interna', DMZ: 'DMZ', PUBLICA_PROPIA: 'Pública de la UACH', INVITADOS: 'Invitados', GESTION: 'Gestión', OTRA: 'Otra' };
const blank: Network = { id: 0, nombre: '', cidr: '', inicio: '', fin: '', version: 4, tipo: 'INTERNA', zona: '', vlan: null, campus: '', campus_id: null, zona_id: null, unidad_id: null, criticidad_id: null, descripcion: '', vigente: true };
export default function InstitutionalNetworksMain() {
  const confirm = useConfirmation();
  const [items, setItems] = useState<Network[]>([]);
  const [units, setUnits] = useState<Option[]>([]);
  const [campuses, setCampuses] = useState<Option[]>([]);
  const [zones, setZones] = useState<Option[]>([]);
  const [levels, setLevels] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const [draft, setDraft] = useState<Network | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    Promise.all([
      request<{ data: Network[] }>('/catalogos/redes-institucionales', { signal: controller.signal }),
      request<{ data: Option[] }>('/catalogos/unidades-institucionales', { signal: controller.signal }),
      request<{ data: Option[] }>('/catalogos/criticidad', { signal: controller.signal }),
      request<{ data: Option[] }>('/catalogos/campus', { signal: controller.signal }),
      request<{ data: Option[] }>('/catalogos/zonas-red', { signal: controller.signal }),
    ]).then(([networks, units, levels, campuses, zones]) => { if (!controller.signal.aborted) { setItems(networks.data); setUnits(units.data); setLevels(levels.data); setCampuses(campuses.data); setZones(zones.data); } })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudieron cargar las redes.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  const open = draft !== null;
  useEffect(() => { if (open) dialog.current?.showModal(); else dialog.current?.close(); }, [open]);
  function edit(item?: Network) { setFormError(''); setDraft(item ? { ...item } : { ...blank }); }
  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft || busy) return;
    if (draft.id && !await confirm({ title: '¿Guardar cambios?', description: 'Los rangos vigentes se utilizan para clasificar el tráfico de la UACH, incluido el historial.', confirmLabel: 'Guardar cambios' })) return;
    setBusy(true); setFormError('');
    try {
      const saved = await request<{ data: Network }>(`/catalogos/redes-institucionales${draft.id ? `/${draft.id}` : ''}`, { method: draft.id ? 'PUT' : 'POST', body: draft });
      setItems(previous => (draft.id ? previous.map(item => item.id === draft.id ? saved.data : item) : [...previous, saved.data]).sort((a,b) => a.nombre.localeCompare(b.nombre)));
      setNotice('Red institucional guardada.'); setDraft(null);
    } catch (e) { setFormError(e instanceof Error ? e.message : 'No se pudo guardar la red.'); }
    finally { setBusy(false); }
  }
  async function toggle(item: Network) {
    if (busy) return;
    if (!await confirm({ title: item.vigente ? '¿Desactivar red?' : '¿Activar red?', description: item.vigente ? 'Este segmento dejará de utilizarse para reconocer IP institucionales. La clasificación del tráfico puede cambiar.' : 'Este segmento se utilizará para reconocer IP institucionales.', confirmLabel: item.vigente ? 'Desactivar' : 'Activar', tone: item.vigente ? 'danger' : 'default' })) return;
    setBusy(true); setError('');
    try {
      const result = await request<{ data: Network }>(`/catalogos/redes-institucionales/${item.id}/${item.vigente ? 'desactivar' : 'activar'}`, { method: 'POST' });
      setItems(previous => previous.map(row => row.id === item.id ? result.data : row)); setNotice('Estado de la red actualizado.');
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo cambiar el estado.'); }
    finally { setBusy(false); }
  }
  return <section className="network-admin institutional-networks"><style>{styles}</style><header className="network-heading"><div><h1>Redes institucionales</h1><p>Registra los segmentos IP de las facultades, áreas y servicios de la UACH.</p></div><button disabled={loading || busy || !!error} onClick={() => edit()}><Plus size={16} aria-hidden="true" /> Agregar red</button></header>
    {notice && <p role="status">{notice}</p>}
    {!loading && !error && !items.length ? <div className="institutional-empty"><h2>Aún no hay redes institucionales registradas</h2><p>Agrega el segmento oficial y selecciona la facultad o unidad a la que pertenece. El sistema calculará la IP inicial y final a partir del rango.</p><button onClick={() => edit()}>Agregar primera red</button></div> : <CatalogList items={items} loading={loading} busy={busy} error={error} onRetry={() => setRevision(value => value + 1)} getKey={item => item.id} getTitle={item => item.nombre} getSubtitle={item => `${item.cidr} · ${item.inicio} a ${item.fin}`} isActive={item => item.vigente}
      details={[{ key: 'unidad', label: 'Facultad / unidad', value: item => units.find(unit => unit.id === Number(item.unidad_id))?.nombre || 'Sin asignar' }, { key: 'tipo', label: 'Tipo', value: item => types[item.tipo] || item.tipo }, { key: 'descripcion', label: 'Descripción', value: item => item.descripcion || 'Sin descripción' }]}
      getSearchText={item => `${item.nombre} ${item.cidr} ${item.inicio} ${item.fin} ${item.zona} ${item.campus} ${item.descripcion} ${units.find(unit => unit.id === Number(item.unidad_id))?.nombre || ''}`} onEdit={edit} onToggle={toggle}
      labels={{ title: 'Redes institucionales', singular: 'red', plural: 'redes', all: 'Todas', active: 'Activas', inactive: 'Inactivas', activeState: 'Activa', inactiveState: 'Inactiva', empty: 'No hay redes que coincidan', search: 'Buscar por red, IP o facultad' }} />}
    <dialog ref={dialog} className="network-dialog institutional-dialog" aria-labelledby="institutional-form-title" onCancel={e => { if (busy) e.preventDefault(); else setDraft(null); }}>
      {draft && <form onSubmit={save}><h2 id="institutional-form-title">{draft.id ? 'Editar red institucional' : 'Agregar red institucional'}</h2><fieldset disabled={busy}>
        <label>Nombre *<input autoFocus required maxLength={150} value={draft.nombre} onChange={e => setDraft({ ...draft, nombre: e.target.value })} placeholder="Ej. Red de Ingeniería" /></label>
        <label>Segmento IP (CIDR) *<input required maxLength={49} value={draft.cidr} onChange={e => setDraft({ ...draft, cidr: e.target.value })} placeholder="Ejemplo de formato: 192.0.2.0/24" /><small>Usa el segmento oficial proporcionado por redes. La IP inicial y final se calculan al guardar. Admite IPv4 e IPv6.</small></label>
        <label>Facultad / unidad institucional<select value={draft.unidad_id ?? ''} onChange={e => setDraft({ ...draft, unidad_id: e.target.value ? Number(e.target.value) : null })}><option value="">Sin asignar</option>{units.filter(item => item.vigente || item.id === Number(draft.unidad_id)).map(item => <option key={item.id} value={item.id}>{item.nombre}{!item.vigente ? ' (inactiva)' : ''}</option>)}</select></label>
        <div className="institutional-fields"><label>Tipo de red *<select value={draft.tipo} onChange={e => setDraft({ ...draft, tipo: e.target.value })}>{Object.entries(types).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>VLAN<input type="number" min={1} max={4094} value={draft.vlan ?? ''} onChange={e => setDraft({ ...draft, vlan: e.target.value ? Number(e.target.value) : null })} /></label></div>
        <label>Ubicación<select value={draft.campus_id ?? ''} onChange={e => setDraft({ ...draft, campus_id: e.target.value ? Number(e.target.value) : null, campus: e.target.value ? campuses.find(c=>c.id===Number(e.target.value))?.nombre ?? '' : '' })}><option value="">Sin asignar{draft.campus ? ` (valor anterior: ${draft.campus})` : ''}</option>{campuses.filter(c=>c.vigente || c.id===Number(draft.campus_id)).map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label>
        <label>Zona institucional<select value={draft.zona_id ?? ''} onChange={e => setDraft({ ...draft, zona_id: e.target.value ? Number(e.target.value) : null, zona: e.target.value ? zones.find(z=>z.id===Number(e.target.value))?.nombre ?? '' : '' })}><option value="">Sin asignar</option>{zones.filter(z=>z.vigente || z.id===Number(draft.zona_id)).map(z=><option key={z.id} value={z.id}>{z.nombre}</option>)}</select></label>
        <label>Criticidad<select value={draft.criticidad_id ?? ''} onChange={e => setDraft({ ...draft, criticidad_id: e.target.value ? Number(e.target.value) : null })}><option value="">Sin asignar</option>{levels.filter(item => item.vigente || item.id === Number(draft.criticidad_id)).map(item => <option key={item.id} value={item.id}>{item.nombre}{!item.vigente ? ' (inactiva)' : ''}</option>)}</select></label>
        <label>Descripción<textarea rows={3} maxLength={300} value={draft.descripcion} onChange={e => setDraft({ ...draft, descripcion: e.target.value })} /></label>
      </fieldset>{formError && <p role="alert">{formError}</p>}<footer><button type="button" disabled={busy} onClick={() => setDraft(null)}>Cancelar</button><button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar'}</button></footer></form>}
    </dialog>
  </section>;
}
const styles = `
.institutional-networks{--palette-primary:var(--palette-editorialPrimary);--palette-text:var(--palette-editorialText);--palette-muted:var(--palette-editorialMuted)}.network-heading{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;align-items:flex-start;margin-bottom:28px}.network-heading>button{display:inline-flex;align-items:center;gap:8px}.institutional-empty{padding:32px;border:1px solid var(--palette-editorialBorder);border-radius:12px;background:var(--palette-white)}.institutional-empty h2{font-size:17px}.institutional-dialog{width:620px}.institutional-dialog select{font:inherit;width:100%;padding:10px;border:1px solid var(--palette-editorialControlBorder);border-radius:8px;background:var(--palette-white);color:inherit;display:block;margin-top:8px}.institutional-fields{display:grid;grid-template-columns:1fr 1fr;gap:18px}
`;


/* como puedo hacer un promt que me revisa y me responda lo siguiente: 

```typescriptreact
1. Duda de como se van a insertar mas servicios desde el dashboard, por ejemplo como se le va a meter el apikey o demas (y si es necesario agregarlo desde el dia de hoy)
2. ¿A que se refiere con unidades institucionales? Se que lo tengo en la base de datos pero ya no se si dejarlo ya que este catalogo es principalmente para usar con orion, y orion no entrega unidades institucionales como tal, es decir, facultades y demas, no se si esas las tendria que agregar yo a mano
3. Palo alto entrega niveles de severidad? o como se clasificaran en un futuro?
4. Como se evalua si el origen y destino es externo e interno?
5. Ver si es necesario dejar grupos de infrestructura aparte o ubicado en ubicaciones y dependencias (ahorita esta doble)
6. ¿Que es activos por grupo?, es necesario que este en el area de administracion de catalogos, y por que se puede editar y elegir otros? Creo que esta mal esa parte
7. ¿que es asignaciones de ip?
8. Es importante tener redes institucionales en el sistema para poner los segmentos de facultades y demas lugares de la universidad? es que ni palo alto ni orion entregan facultades (por poner un ejemplo), en sus logs
9. En usuarios de sistema poner donde esta el nombre, completo (tambien el segundo apellido)
10.En tipos de activo, como se va a automatizar que los activos se clasifiquen si son camaras, bases de datos y demas?
11.¿que ofrece presentar los identificadores de activos? 
12.¿que ofrece presentar los identificadores de interfaces? 
13.¿que ofrece contextos de red? 
14.¿que ofrece asignaciones historicas de IP? 
15 Revisar si es importante que los registros de ip y todo lo relacionado a ellos es importante agregar, ya que pues eso viene de palo alto y orion, agregar ip estaria mal


```*/