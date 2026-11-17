import { Link } from 'react-router-dom';
import { duration, fullLocal, parse, plural, usePolling } from './orionActivity.ts';
import {
  assetLabel, DEFAULT_HOURS, INCIDENTS_PATH, periodLabel, statusProblem, type IntermittentData, type OpenData,
} from '../servicios/orionIncidents.ts';

const iso = (value: string) => parse(value).toISOString();
const incidentLink = (node: string, view?: 'intermitencias') => `${INCIDENTS_PATH}?${new URLSearchParams({ ...(view ? { vista: view } : {}), q: node })}`;
const PREVIEW_LIMIT = 3;

/** Dashboard figures and a short, identified list of affected nodes. Exported for the render check. */
export function OrionSummaryBody({ open, intermittent }: { open: OpenData | null; intermittent: IntermittentData | null }) {
  const openReady = open?.disponible ? open : null;
  const verified = openReady?.estado.verificado && openReady.resumen ? openReady.resumen : null;
  const flaps = intermittent?.disponible ? intermittent : null;
  const problem = openReady && !verified ? statusProblem(openReady.estado) : null;
  const downNodes = verified ? (openReady?.vista_previa ?? []) : [];
  const intermittentNodes = flaps?.vista_previa ?? [];
  const visibleDownNodes = downNodes.slice(0, PREVIEW_LIMIT);
  const visibleIntermittentNodes = intermittentNodes.slice(0, PREVIEW_LIMIT);
  const remainingDown = Math.max(openReady?.total ?? 0, downNodes.length) - visibleDownNodes.length;
  const remainingIntermittent = Math.max(flaps?.total ?? 0, intermittentNodes.length) - visibleIntermittentNodes.length;
  return <>
    {open && !open.disponible && <p className="orion-card-note" role="status">La fuente Orion no está configurada en el servidor.</p>}
    {problem && <div className="orion-card-alert is-warning" role="status"><p><strong>{problem.title}.</strong> {problem.text}</p></div>}
    {(downNodes.length > 0 || intermittentNodes.length > 0) && <div className="orion-summary-lists">
      {downNodes.length > 0 && <section aria-labelledby="orion-summary-down-title">
        <h3 id="orion-summary-down-title">Nodos caídos ahora</h3>
        <ul>{visibleDownNodes.map(node => {
          const unique = node.correspondencia === 'UNICA';
          const title = unique ? assetLabel(node.activos) : `NodeID ${node.nodo}`;
          const detail = node.correspondencia === 'AMBIGUA' ? `Asociación ambigua: ${assetLabel(node.activos)}`
            : node.correspondencia === 'SIN_ACTIVO' ? 'Sin activo en SIALU' : `NodeID ${node.nodo}`;
          return <li key={node.nodo}><Link to={incidentLink(node.nodo)}><strong>{title}</strong><small>{detail}{node.caido_desde ? ` · desde ${fullLocal(node.caido_desde)} (${duration(node.caido_desde, new Date())})` : ' · inicio no registrado'}</small></Link></li>;
        })}</ul>
        {remainingDown > 0 && <Link className="orion-summary-more" to={INCIDENTS_PATH}>Ver {remainingDown} nodos más →</Link>}
      </section>}
      {intermittentNodes.length > 0 && <section aria-labelledby="orion-summary-flaps-title">
        <h3 id="orion-summary-flaps-title">Intermitentes ({periodLabel(flaps!.horas)})</h3>
        <ul>{visibleIntermittentNodes.map(node => <li key={node.nodo}><Link to={incidentLink(node.nodo, 'intermitencias')}>
          <strong>{assetLabel(node.activos)}</strong><small>NodeID {node.nodo} · {plural(node.episodios, 'caída', 'caídas')}</small>
        </Link></li>)}</ul>
        {remainingIntermittent > 0 && <Link className="orion-summary-more" to={`${INCIDENTS_PATH}?vista=intermitencias`}>Ver {remainingIntermittent} nodos más →</Link>}
      </section>}
    </div>}
    {verified && verified.nodos_sin_activo > 0 && <p className="orion-card-note">{plural(verified.nodos_sin_activo, 'nodo caído no tiene', 'nodos caídos no tienen')} activo en SIALU.</p>}
    {flaps && !flaps.cobertura.completa && <p className="orion-card-note">La lectura de eventos no cubre todo el periodo: las intermitencias pueden ser más.</p>}
    {verified && openReady?.estado.consultado_en && <p className="orion-card-note">
      Estado consultado en Orion: <time dateTime={iso(openReady.estado.consultado_en)}>{fullLocal(openReady.estado.consultado_en)}</time> (local).
    </p>}
  </>;
}

/** Dashboard: Orion figures plus affected node names, with links to incident details. */
export default function OrionSummaryCard() {
  const open = usePolling<OpenData>('/monitoreo/orion/incidentes/caidas?resumen=1', 'No se pudo consultar el estado de Orion.');
  const intermittent = usePolling<IntermittentData>(`/monitoreo/orion/incidentes/intermitencias?resumen=1&horas=${DEFAULT_HOURS}`, 'No se pudieron consultar las intermitencias de Orion.');
  const error = open.error || intermittent.error;
  return <section className="orion-card orion-summary-card" aria-labelledby="orion-card-title" aria-busy={open.loading || intermittent.loading}>
    <header className="orion-card-header">
      <div>
        <h2 id="orion-card-title">Orion</h2>
        <p className="orion-card-scope">Estado actual de los nodos e intermitencias de las últimas 24 horas</p>
      </div>
      <Link to={INCIDENTS_PATH}>Ver incidentes <span aria-hidden="true">→</span></Link>
    </header>
    {error && <div className="orion-card-alert is-error" role="alert">
      <p><strong>No se pudo consultar Orion.</strong> {error}</p>
      <button type="button" onClick={() => { open.retry(); intermittent.retry(); }}>Reintentar</button>
    </div>}
    {!open.data && !intermittent.data && !error
      ? <p className="orion-card-note" role="status">Consultando Orion…</p>
      : <OrionSummaryBody open={open.data} intermittent={intermittent.data} />}
  </section>;
}
