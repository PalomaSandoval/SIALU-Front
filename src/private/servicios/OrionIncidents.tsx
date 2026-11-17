import { useEffect, useState } from 'react';
import type { SubmitEvent } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { request } from '../../services/api.ts';
import { duration, fullLocal, parse, plural, utcStamp } from '../monitoreo/orionActivity.ts';
import {
  assetLabel, DEFAULT_HOURS, EVENTS_PATH, eventsLink, lastPeriod, parseHours, PERIOD_HOURS, readProblem, seconds, startReasons, statusProblem,
  type IntermittentData, type IntermittentNode, type OpenData, type StatusContext,
} from './orionIncidents.ts';
import '../catalogos/catalog-admin.css';
import '../monitoreo/monitoreo.css';

type View = 'caidas' | 'intermitencias';
/** Episodes shown per node before "Ver N más". */
const EPISODES_VISIBLE = 5;
const iso = (value: string) => parse(value).toISOString();

function Pager({ page, last, total, noun, loading, onPage }: { page: number; last: number; total: number; noun: [string, string]; loading: boolean; onPage: (page: number) => void }) {
  if (last <= 1) return <p className="orion-incidents-count">{plural(total, ...noun)}</p>;
  return <nav className="network-toolbar orion-incidents-pager" aria-label="Paginación">
    <button type="button" disabled={loading || page <= 1} onClick={() => onPage(page - 1)}>Anterior</button>
    <span>{plural(total, ...noun)} · Página {page} de {last}</span>
    <button type="button" disabled={loading || page >= last} onClick={() => onPage(page + 1)}>Siguiente</button>
  </nav>;
}

function StatusWarning({ status }: { status: StatusContext }) {
  const problem = statusProblem(status);
  return <div className="orion-card-alert is-warning" role="status">
    <p><strong>{problem.title}.</strong> {problem.text} No se muestra ninguna cifra como actual.</p>
  </div>;
}

/** Caídas abiertas: every node Down in the latest valid snapshot. Exported for the render check. */
export function OpenOutagesView({ data, now, searching, loading, onPage, from }: {
  data: Extract<OpenData, { disponible: true }>; now: Date; searching: boolean; loading: boolean; onPage: (page: number) => void; from: string;
}) {
  if (!data.estado.verificado || !data.resumen || !data.nodos) return <StatusWarning status={data.estado} />;
  const summary = data.resumen;
  const read = readProblem(data.lectura_eventos);
  const unknown = summary.nodos_caidos - summary.con_inicio;
  return <>
    <dl className="orion-card-summary orion-history-summary" aria-label="Resumen de caídas abiertas">
      <div className={summary.nodos_caidos ? 'is-down' : ''}><dt>Nodos de Orion caídos</dt><dd>{summary.nodos_caidos}</dd></div>
      <div><dt>Activos de SIALU afectados</dt><dd>{summary.activos_afectados}</dd></div>
      <div><dt>Nodos sin activo en SIALU</dt><dd>{summary.nodos_sin_activo}</dd></div>
      {summary.nodos_ambiguos > 0 && <div><dt>Nodos con varios activos</dt><dd>{summary.nodos_ambiguos}</dd></div>}
      <div><dt>Con inicio conocido</dt><dd>{summary.con_inicio}</dd></div>
      <div className="orion-card-ingest"><dt>Última consulta de estado</dt><dd>{data.estado.consultado_en ? <time dateTime={iso(data.estado.consultado_en)}>{fullLocal(data.estado.consultado_en)} (local)</time> : '—'}</dd></div>
    </dl>
    <p className="orion-history-hint">
      Cifras de la última consulta de estado de Orion ({plural(summary.nodos_consultados, 'nodo consultado', 'nodos consultados')}).
      {' '}Un activo de SIALU puede tener varios nodos; los nodos sin activo también se cuentan.
      {summary.nodos_sin_estado > 0 && ` ${plural(summary.nodos_sin_estado, 'nodo tiene', 'nodos tienen')} un estado que SIALU no interpreta y no se cuenta como caído.`}
      {unknown > 0 && ` ${plural(unknown, 'caída no tiene', 'caídas no tienen')} inicio registrado: su duración es desconocida.`}
    </p>
    {read && <div className="orion-card-alert is-warning" role="status"><p><strong>Inicios no disponibles.</strong> {read} Sin una lectura al día no se puede asegurar desde cuándo sigue caído cada nodo.</p></div>}

    {!data.nodos.length
      ? <p className="orion-incidents-empty">{searching ? 'Ningún nodo caído coincide con la búsqueda.' : 'Ningún nodo está caído en la última consulta de estado de Orion.'}</p>
      : <div className="network-table"><table>
        <caption className="sr-only">Nodos de Orion caídos en la última consulta de estado</caption>
        <thead><tr><th scope="col">Nodo de Orion</th><th scope="col">Activo de SIALU</th><th scope="col">Caído desde</th><th scope="col">Tiempo caído</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
        <tbody>{data.nodos.map(node => <tr key={node.nodo} className="orion-history-row is-down">
          <th scope="row">NodeID {node.nodo}<small>Orion: {node.status_nombre ?? `Status ${node.status ?? 'desconocido'}`}</small></th>
          <td>{node.correspondencia === 'AMBIGUA' ? <>Varios activos<small>{assetLabel(node.activos)}</small></>
            : node.correspondencia === 'SIN_ACTIVO' ? <span className="orion-incidents-muted">Sin activo en SIALU</span> : assetLabel(node.activos)}</td>
          <td className="orion-history-date">{node.caido_desde
            ? <><time dateTime={iso(node.caido_desde)}>{fullLocal(node.caido_desde)}</time> <span className="orion-incidents-muted">local</span><small>{utcStamp(node.caido_desde)}</small></>
            : <>Inicio no registrado<small>{startReasons[node.motivo_inicio ?? ''] ?? 'SIALU no puede relacionar un Down con esta caída.'}</small></>}</td>
          <td>{node.caido_desde ? duration(node.caido_desde, now) : <span className="orion-incidents-muted" aria-label="Desconocido">—</span>}</td>
          <td>{node.correspondencia !== 'SIN_ACTIVO' && <Link to={eventsLink(node.nodo, node.caido_desde ?? new Date(now.getTime() - 6 * 86_400_000))} state={{ from, label: 'Volver a incidentes' }}
            aria-label={`Ver eventos del NodeID ${node.nodo}`}>Ver eventos</Link>}</td>
        </tr>)}</tbody>
      </table></div>}
    <Pager page={data.page} last={data.last_page} total={data.total} noun={['nodo caído', 'nodos caídos']} loading={loading} onPage={onPage} />
  </>;
}

const stateLabels: Record<string, string> = { EN_LINEA: 'En línea', CAIDO: 'Caído', SIN_ESTADO: 'Estado no interpretable', NO_EN_ORION: 'No aparece en Orion' };

function EpisodeItem({ episode, now }: { episode: IntermittentNode['episodios_detalle'][number]; now: Date }) {
  return <li>
    <time dateTime={iso(episode.caida)} title={utcStamp(episode.caida)}>{fullLocal(episode.caida)}</time>
    {episode.recuperacion
      ? <> → <time dateTime={iso(episode.recuperacion)} title={utcStamp(episode.recuperacion)}>{fullLocal(episode.recuperacion)}</time> · duró {seconds(episode.duracion_segundos ?? 0)}</>
      : episode.en_curso ? <> · <strong>sigue caído</strong> ({duration(episode.caida, now)})</>
      : <> · sin Up registrado <span className="orion-incidents-muted">(duración desconocida)</span></>}
  </li>;
}

/** Intermitencias: nodes with two or more DOWN episodes in the period. Exported for the render check. */
export function IntermittenceView({ data, now, searching, loading, onPage, from }: {
  data: Extract<IntermittentData, { disponible: true }>; now: Date; searching: boolean; loading: boolean; onPage: (page: number) => void; from: string;
}) {
  const read = readProblem(data.lectura_eventos);
  const coverage = data.cobertura;
  const atLeast = coverage.completa ? '' : 'al menos ';
  return <>
    <p className="orion-history-coverage">
      Caídas iniciadas entre el <time dateTime={iso(data.inicio_periodo)}>{fullLocal(data.inicio_periodo)}</time> y el <time dateTime={iso(data.hasta)}>{fullLocal(data.hasta)}</time> (hora local).
      {' '}{coverage.completa ? 'La lectura de eventos de Orion cubre todo el periodo.'
        : coverage.desde && coverage.hasta ? `La lectura de eventos solo comprueba como completo del ${fullLocal(coverage.desde)} al ${fullLocal(coverage.hasta)}; las cifras pueden ser mayores.`
        : 'La lectura de eventos de Orion no cubre este periodo; las cifras pueden estar incompletas.'}
      {data.inicio_periodo !== data.desde && ' El historial de SIALU comienza después del inicio del periodo.'}
    </p>
    {read && <div className="orion-card-alert is-warning" role="status"><p><strong>Lectura de eventos no actual.</strong> {read} Ninguna caída se confirma como en curso.</p></div>}
    {!data.estado.verificado && <div className="orion-card-alert is-warning" role="status"><p><strong>Estado actual no disponible.</strong> {statusProblem(data.estado).text}</p></div>}
    <dl className="orion-card-summary orion-history-summary" aria-label="Resumen de intermitencias">
      <div className={data.resumen.nodos_intermitentes ? 'is-warning' : ''}><dt>Nodos intermitentes</dt><dd>{atLeast && data.resumen.nodos_intermitentes ? '≥ ' : ''}{data.resumen.nodos_intermitentes}</dd></div>
      <div><dt>Episodios de caída</dt><dd>{atLeast && data.resumen.episodios ? '≥ ' : ''}{data.resumen.episodios}</dd></div>
    </dl>
    <p className="orion-history-hint">Un episodio es un Down que abrió una caída en SIALU; un Down repetido de un nodo ya caído no cuenta. Solo hay episodios de nodos con un activo de SIALU.</p>

    {!data.nodos?.length
      ? <p className="orion-incidents-empty">{searching ? 'Ningún nodo intermitente coincide con la búsqueda.' : `Ningún nodo tuvo dos o más caídas en ${lastPeriod(data.horas)}.`}</p>
      : <div className="network-table"><table>
        <caption className="sr-only">Nodos con dos o más caídas en {lastPeriod(data.horas)}</caption>
        <thead><tr><th scope="col">Nodo y activo</th><th scope="col">Episodios</th><th scope="col">Estado actual</th><th scope="col">Caídas (hora local)</th><th scope="col"><span className="sr-only">Acciones</span></th></tr></thead>
        <tbody>{data.nodos.map(node => {
          const shown = node.episodios_detalle.slice(0, EPISODES_VISIBLE);
          const rest = node.episodios_detalle.slice(EPISODES_VISIBLE);
          return <tr key={node.nodo} className={`orion-history-row ${node.estado_actual === 'CAIDO' ? 'is-down' : 'is-repeat'}`}>
            <th scope="row">{assetLabel(node.activos)}<small>NodeID {node.nodo}</small></th>
            <td>{node.episodios}</td>
            <td>{node.estado_actual ? stateLabels[node.estado_actual] : <span className="orion-incidents-muted">No disponible</span>}</td>
            <td><ol className="orion-episodes">{shown.map(episode => <EpisodeItem key={episode.id} episode={episode} now={now} />)}</ol>
              {rest.length > 0 && <details className="orion-episodes-more"><summary>Ver {rest.length} más</summary>
                <ol className="orion-episodes">{rest.map(episode => <EpisodeItem key={episode.id} episode={episode} now={now} />)}</ol></details>}
              {node.episodios > node.episodios_detalle.length && <small>Se muestran los {node.episodios_detalle.length} más recientes de {node.episodios}.</small>}
            </td>
            <td><Link to={eventsLink(node.nodo, data.inicio_periodo)} state={{ from, label: 'Volver a incidentes' }} aria-label={`Ver eventos del NodeID ${node.nodo}`}>Ver eventos</Link></td>
          </tr>;
        })}</tbody>
      </table></div>}
    {data.nodos && <Pager page={data.page} last={data.last_page} total={data.total} noun={['nodo intermitente', 'nodos intermitentes']} loading={loading} onPage={onPage} />}
  </>;
}

/** Orion → Incidentes: open outages (current snapshot) and intermittence (DOWN episodes in a period). */
export default function OrionIncidents() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const view: View = params.get('vista') === 'intermitencias' ? 'intermitencias' : 'caidas';
  const hours = parseHours(params.get('horas'));
  const search = params.get('q') ?? '';
  const page = params.get('page') ?? '1';
  const [state, setState] = useState<{ key: string; open?: OpenData; intermittent?: IntermittentData; error?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const [now, setNow] = useState(() => new Date());

  const query = new URLSearchParams({ page, ...(search ? { q: search } : {}), ...(view === 'intermitencias' ? { horas: String(hours) } : {}) }).toString();
  const key = `${view}?${query}`;
  useEffect(() => {
    const controller = new AbortController(); setLoading(true);
    const path = view === 'caidas' ? `/monitoreo/orion/incidentes/caidas?${query}` : `/monitoreo/orion/incidentes/intermitencias?${query}`;
    request<{ data: OpenData | IntermittentData }>(path, { signal: controller.signal })
      .then(result => { setNow(new Date()); setState(view === 'caidas' ? { key, open: result.data as OpenData } : { key, intermittent: result.data as IntermittentData }); })
      .catch(reason => { if (!controller.signal.aborted) setState({ key, error: reason instanceof Error ? reason.message : 'No se pudieron consultar los incidentes de Orion.' }); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [key, revision]);
  // Elapsed times keep moving between reads.
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 30_000); return () => window.clearInterval(timer); }, []);

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([name, value]) => { if (value) next.set(name, value); else next.delete(name); });
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  }
  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const changes: Record<string, string | null> = { q: String(form.get('q') ?? '').trim() || null };
    if (view === 'intermitencias') changes.horas = String(form.get('horas')) === String(DEFAULT_HOURS) ? null : String(form.get('horas'));
    update(changes);
  }

  const current = state?.key === key ? state : null;
  const from = `${location.pathname}${location.search}`;
  const tabs: { value: View; label: string }[] = [{ value: 'caidas', label: 'Caídas abiertas' }, { value: 'intermitencias', label: 'Intermitencias' }];
  const unavailable = current?.open && !current.open.disponible ? current.open : current?.intermittent && !current.intermittent.disponible ? current.intermittent : null;

  return <section className="network-admin orion-history orion-incidents" aria-labelledby="orion-incidents-title">
    <header>
      <Link className="orion-history-back" to="/">← Volver al resumen</Link>
      <h1 id="orion-incidents-title">Incidentes de Orion</h1>
      <p>Nodos de Orion caídos ahora y nodos con caídas repetidas. El estado actual sale de la última consulta de estado de Orion; los inicios y episodios, de los eventos Down/Up registrados. Para el registro cronológico completo consulta <Link className="orion-inline-link" to={EVENTS_PATH}>Eventos de Orion (Down/Up)</Link>.</p>
    </header>

    <nav className="orion-incidents-tabs" aria-label="Vistas de incidentes">
      {tabs.map(tab => <Link key={tab.value} aria-current={view === tab.value ? 'page' : undefined}
        to={`?${new URLSearchParams([...params].filter(([name]) => name === 'q' || (name === 'horas' && tab.value === 'intermitencias')).concat(tab.value === 'caidas' ? [] : [['vista', tab.value]]))}`}>
        {tab.label}</Link>)}
    </nav>

    <form key={key} className="network-toolbar" onSubmit={submit} role="search" aria-label={`Buscar en ${view === 'caidas' ? 'caídas abiertas' : 'intermitencias'}`}>
      <label>Buscar NodeID o activo<input type="search" name="q" defaultValue={search} placeholder="NodeID exacto o nombre del activo" maxLength={100} /></label>
      {view === 'intermitencias' && <label>Periodo<select name="horas" defaultValue={String(hours)}>
        {PERIOD_HOURS.map(value => <option key={value} value={value}>{lastPeriod(value).replace(/^l/, 'L')}</option>)}</select></label>}
      <button disabled={loading}>{view === 'intermitencias' ? 'Aplicar' : 'Buscar'}</button>
      {search && <button type="button" onClick={() => update({ q: null })}>Quitar búsqueda</button>}
    </form>

    <div aria-live="polite" aria-busy={loading}>
      {current?.error && <div role="alert"><p>{current.error}</p><button type="button" onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>}
      {!current && <p role="status">Consultando los incidentes de Orion…</p>}
      {unavailable && <p role="status">{unavailable.motivo === 'sin_fuente' ? 'La fuente Orion no está configurada en el servidor.' : 'Los incidentes de Orion no están disponibles.'}</p>}
      {current?.open?.disponible && <OpenOutagesView data={current.open} now={now} searching={!!search} loading={loading} from={from} onPage={value => update({ page: String(value) })} />}
      {current?.intermittent?.disponible && <IntermittenceView data={current.intermittent} now={now} searching={!!search} loading={loading} from={from} onPage={value => update({ page: String(value) })} />}
    </div>
  </section>;
}

