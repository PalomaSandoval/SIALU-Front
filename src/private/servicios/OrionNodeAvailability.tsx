import { useEffect, useMemo, useRef, useState } from 'react';
import type { SubmitEvent } from 'react';
import { ApiError, request } from '../../services/api.ts';
import '../catalogos/catalog-admin.css';
import './orion-node-availability.css';

type OrionNode = { node_id: number; nombre: string };
type Period = { periodo: string; texto: string; disponibilidad: number };
type Stats = { node_id: number; consultado_en: string; periodos: Period[]; sesion_cerrada: boolean };
type Result = { node: OrionNode; stats: Stats };

const periodLabels: Record<string, string> = {
  'Today': 'Hoy',
  'Yesterday': 'Ayer',
  'Last 7 Days': 'Últimos 7 días',
  'Last 30 Days': 'Últimos 30 días',
  'This Month': 'Este mes',
  'Last Month': 'Mes anterior',
  'This Year': 'Este año',
};
const MAX_MATCHES = 50;
const percent = new Intl.NumberFormat('es-MX', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const localTime = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'medium' });
const utcTime = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'UTC' });
const nodeLabel = (node: OrionNode) => node.nombre || `Nodo sin nombre`;
const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function errorText(reason: unknown, fallback: string): string {
  if (!(reason instanceof ApiError)) return reason instanceof Error ? reason.message : fallback;
  if (reason.status === 0) return 'No se pudo conectar con SIALU API. Revisa que el backend esté en ejecución.';
  if (reason.status === 401 || reason.status === 419) return 'Tu sesión de SIALU expiró. Vuelve a iniciar sesión e intenta de nuevo.';
  if (reason.status === 403) return 'Tu usuario no tiene permiso para esta consulta.';
  if (reason.status === 404) return 'SIALU API no tiene esta ruta. Revisa que el backend esté actualizado.';
  if (reason.status === 422) return `Dato no válido: ${reason.message}`;
  if (reason.status === 503) return reason.message;
  return `${fallback} (${reason.message})`;
}

/** Orion → Disponibilidad de nodos: manual, one-node-at-a-time query of Orion's «Availability Statistics». */
export default function OrionNodeAvailability() {
  const [nodes, setNodes] = useState<OrionNode[] | null>(null);
  const [nodesError, setNodesError] = useState('');
  const [nodesRevision, setNodesRevision] = useState(0);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<OrionNode | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pending = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setNodes(null); setNodesError('');
    request<{ data: OrionNode[] }>('/monitoreo/disponibilidad/nodos/orion', { signal: controller.signal })
      .then(data => setNodes(data.data))
      .catch(reason => { if (!controller.signal.aborted) setNodesError(errorText(reason, 'No se pudo obtener la lista de nodos de Orion.')); });
    return () => controller.abort();
  }, [nodesRevision]);

  useEffect(() => () => pending.current?.abort(), []);

  const typedId = /^\d{1,10}$/.test(search.trim()) && Number(search.trim()) >= 1 && Number(search.trim()) <= 2147483647 ? Number(search.trim()) : null;
  const matches = useMemo(() => {
    const term = normalize(search);
    if (!nodes || !term) return [];
    const exact = typedId !== null ? nodes.filter(node => node.node_id === typedId) : [];
    const others = nodes.filter(node => node.node_id !== typedId && (normalize(node.nombre).includes(term) || String(node.node_id).startsWith(term)));
    return [...exact, ...others];
  }, [nodes, search, typedId]);
  // Without the list (or when the NodeID is not in it) a typed NodeID can still be queried directly.
  const typedNotListed = typedId !== null && !matches.some(node => node.node_id === typedId);

  function choose(node: OrionNode) { setSelected(node); setSearch(''); setError(''); }

  function consult(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    const node = selected;
    setLoading(true); setError(''); setResult(null);
    request<{ data: Stats }>(`/monitoreo/disponibilidad/nodos/${node.node_id}/orion`, { signal: controller.signal })
      .then(data => setResult({ node, stats: data.data }))
      .catch(reason => { if (!controller.signal.aborted) setError(errorText(reason, 'No se pudo consultar la disponibilidad en Orion.')); })
      .finally(() => { if (pending.current === controller) { pending.current = null; setLoading(false); } });
  }

  return <section className="network-admin orion-node-availability">
    <header>
      <h1>Disponibilidad de nodos</h1>
      <p>Consulta manual de las «Availability Statistics» de un nodo, tal como las calcula la consola web de Orion. Busca el nodo por nombre o NodeID, selecciónalo y pulsa «Consultar». Cada consulta abre y cierra una sesión en Orion; no se consultan otros nodos.</p>
    </header>

    <div className="orion-node-search">
      <label>Buscar nodo por nombre o NodeID
        <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Ej. 153 o el nombre del equipo" maxLength={100} autoComplete="off" />
      </label>
      {nodes === null && !nodesError && <p role="status">Cargando la lista de nodos de Orion…</p>}
      {nodesError && <div role="alert" className="orion-node-message">
        <p>{nodesError} Aun así puedes escribir un NodeID para consultarlo.</p>
        <button type="button" onClick={() => setNodesRevision(value => value + 1)}>Reintentar lista</button>
      </div>}
      {nodes && <small>{nodes.length} nodos en Orion.</small>}
      {search.trim() && <ul className="orion-node-matches" aria-label="Nodos encontrados">
        {matches.slice(0, MAX_MATCHES).map(node => <li key={node.node_id}>
          <button type="button" onClick={() => choose(node)}>
            <strong>{nodeLabel(node)}</strong><span>NodeID {node.node_id}</span>
          </button>
        </li>)}
        {typedNotListed && <li><button type="button" onClick={() => choose({ node_id: typedId!, nombre: '' })}>
          <strong>Usar NodeID {typedId}</strong><span>{nodes ? 'No aparece en la lista de Orion' : 'Sin verificar en la lista'}</span>
        </button></li>}
        {!matches.length && !typedNotListed && nodes && <li className="orion-node-empty">Ningún nodo coincide con «{search.trim()}».</li>}
        {matches.length > MAX_MATCHES && <li className="orion-node-empty">Se muestran {MAX_MATCHES} de {matches.length} coincidencias; escribe más para acotar.</li>}
      </ul>}
    </div>

    <form className="orion-node-selected" onSubmit={consult}>
      <div>
        <span>Nodo seleccionado</span>
        {selected ? <strong>{nodeLabel(selected)} <small>NodeID {selected.node_id}</small></strong> : <strong className="is-empty">Ninguno</strong>}
      </div>
      <button disabled={!selected || loading}>{loading ? 'Consultando…' : 'Consultar'}</button>
    </form>

    {loading && <p role="status">Consultando Orion. Puede tardar unos segundos…</p>}
    {error && <div role="alert" className="orion-node-message"><p><strong>No se obtuvo la disponibilidad.</strong> {error}</p></div>}

    {result && <article className="orion-node-result">
      <header>
        <h2>{nodeLabel(result.node)}</h2>
        <p>NodeID {result.stats.node_id} · Consultado el {localTime.format(new Date(result.stats.consultado_en))} (hora local) · {utcTime.format(new Date(result.stats.consultado_en))} UTC</p>
      </header>
      <div className="network-table"><table>
        <thead><tr><th>Periodo</th><th>Valor en Orion</th><th>Porcentaje</th></tr></thead>
        <tbody>{result.stats.periodos.map(period => <tr key={period.periodo}>
          <th>{periodLabels[period.periodo] ?? period.periodo}<small>{period.periodo}</small></th>
          <td>{period.texto}</td>
          <td className="orion-node-percent">{percent.format(period.disponibilidad)} %</td>
        </tr>)}</tbody>
      </table></div>
      {!result.stats.sesion_cerrada && <p className="orion-node-note">Aviso: SIALU no pudo confirmar el cierre de la sesión web en Orion.</p>}
    </article>}
  </section>;
}
