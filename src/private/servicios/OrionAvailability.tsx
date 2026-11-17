import { useEffect, useState } from 'react';
import type { SubmitEvent } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { request } from '../../services/api.ts';
import {
  activityProblem, assetName, confirmedDown, fullLocal, plural, rowState, useCurrentStatus, utcStamp, type ActivityEvent,
} from '../monitoreo/orionActivity.ts';
import '../catalogos/catalog-admin.css';
import '../monitoreo/monitoreo.css';

type Reading = { motivo: string | null; leido_desde: string | null; leido_hasta: string | null; ultimo_intento: { estado: string; fecha: string } | null };
type Result =
  | { disponible: false; motivo: string; desde: string; hasta: string }
  | {
    disponible: true; desde: string; hasta: string; lectura: Reading;
    cobertura: { desde: string | null; hasta: string | null; completa: boolean }; inicio_historial: string | null;
    resumen: { caidas: number; recuperaciones: number; abiertas: number; up_sin_caida: number };
    eventos: ActivityEvent[]; total: number; page: number; last_page: number;
  };

const types = [
  { value: '', label: 'Todos los eventos' },
  { value: 'caida', label: 'Caídas (Down)' },
  { value: 'recuperacion', label: 'Recuperaciones' },
  { value: 'abierta', label: 'Caídas sin Up registrado' },
  { value: 'up_sin_caida', label: 'Up sin caída previa' },
];
const longDay = (value: string) => new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));

/** Orion → Eventos Down/Up: every stored DOWN/UP event in chronological order, with search, filters and the read coverage it is backed by. */
export default function OrionAvailability() {
  const [params, setSearchParams] = useSearchParams();
  const location = useLocation();
  // Where the person came from (e.g. Incidentes with its filter); kept while filtering and paging here.
  const back = (location.state ?? null) as { from?: string; label?: string } | null;
  const setParams = (next: URLSearchParams) => setSearchParams(next, { state: location.state });
  const query = params.toString();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const status = useCurrentStatus();

  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    request<{ data: Result }>(`/monitoreo/dispositivos/actividad/historial?${query}`, { signal: controller.signal })
      .then(data => setResult(data.data))
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'No se pudo consultar el historial de Orion.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, revision]);

  function filter(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    ['q', 'tipo', 'desde', 'hasta'].forEach(key => { const value = String(form.get(key) ?? '').trim(); if (value) next.set(key, value); });
    setParams(next);
  }
  function page(value: number) { const next = new URLSearchParams(params); next.set('page', String(value)); setParams(next); }

  const data = result?.disponible ? result : null;
  const now = new Date();
  const confirmed = confirmedDown(data?.lectura.motivo === null, status);
  const problem = data?.lectura.motivo ? activityProblem(data.lectura) : null;
  const filtered = !!(params.get('q') || params.get('tipo'));

  return <section className="network-admin orion-history">
    <header>
      <Link className="orion-history-back" to={back?.from ?? '/'}>← {back?.label ?? 'Volver al resumen'}</Link>
      <h1>Eventos de Orion (Down/Up)</h1>
      <p>Historial cronológico de los eventos Down/Up que Orion informó para los activos de SIALU. Las fechas y los filtros usan días completos en UTC. Los nodos caídos ahora y las intermitencias están en <Link className="orion-inline-link" to="/servicios/orion/incidentes">Incidentes de Orion</Link>.</p>
    </header>

    <form key={query} className="network-toolbar" onSubmit={filter} role="search">
      <label>Buscar equipo o NodeID<input type="search" name="q" defaultValue={params.get('q') ?? ''} placeholder="Nombre del equipo o NodeID" maxLength={100} /></label>
      <label>Evento<select name="tipo" defaultValue={params.get('tipo') ?? ''}>{types.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
      <label>Desde (UTC)<input type="date" name="desde" defaultValue={params.get('desde') ?? result?.desde ?? ''} /></label>
      <label>Hasta (UTC)<input type="date" name="hasta" defaultValue={params.get('hasta') ?? result?.hasta ?? ''} /></label>
      <button disabled={loading}>Buscar</button>
      {filtered && <button type="button" onClick={() => setParams(new URLSearchParams([...params].filter(([key]) => key === 'desde' || key === 'hasta')))}>Quitar filtros</button>}
    </form>

    {error && <div role="alert"><p>{error}</p><button onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>}
    {result && !result.disponible && <p role="status">{result.motivo === 'sin_fuente' ? 'La fuente Orion no está configurada en el servidor.' : 'El historial de Orion no está disponible.'}</p>}

    {data && <>
      {problem && <div className="orion-card-alert is-warning" role="status"><p><strong>{problem.title}.</strong> {problem.text} Lo ocurrido después puede faltar y ninguna caída se confirma como actual.</p></div>}
      <p className="orion-history-coverage">
        {longDay(data.desde)} – {longDay(data.hasta)}.{' '}
        {data.cobertura.completa ? 'La lectura de Orion cubre todo el periodo.'
          : data.cobertura.desde && data.cobertura.hasta ? `La lectura de Orion solo comprueba como completo del ${utcStamp(data.cobertura.desde)} al ${utcStamp(data.cobertura.hasta)}; fuera de ese tramo puede faltar actividad.`
          : 'La lectura de Orion no cubre este periodo; los eventos guardados pueden estar incompletos.'}
        {data.inicio_historial && ` El historial de SIALU comienza el ${utcStamp(data.inicio_historial)}.`}
      </p>
      <dl className="orion-card-summary orion-history-summary">
        <div className="is-down"><dt>Caídas</dt><dd>{data.resumen.caidas}</dd></div>
        <div className="is-recovery"><dt>Recuperaciones</dt><dd>{data.resumen.recuperaciones}</dd></div>
        <div><dt>Sin Up registrado</dt><dd>{data.resumen.abiertas}</dd></div>
        <div><dt>Up sin caída previa</dt><dd>{data.resumen.up_sin_caida}</dd></div>
        <div className="orion-card-ingest"><dt>Última ingesta válida</dt><dd>{data.lectura.leido_hasta ? `${fullLocal(data.lectura.leido_hasta)} (local)` : 'Ninguna'}</dd></div>
      </dl>
      {filtered && <p className="orion-history-hint">Los totales son del periodo y la búsqueda; el filtro de evento solo cambia la lista.</p>}

      {loading ? <p role="status">Consultando el historial…</p> : !data.eventos.length ? <p>No hay eventos que coincidan con los filtros.</p> : <div className="network-table"><table>
        <thead><tr><th>Fecha (UTC)</th><th>Equipo</th><th>Evento</th><th>Detalle</th></tr></thead>
        <tbody>{data.eventos.map(event => {
          const state = rowState(event, confirmed, now);
          return <tr key={event.id} className={`orion-history-row is-${state.tone}`}>
            <td className="orion-history-date">{utcStamp(event.fecha)}<small>{fullLocal(event.fecha)} hora local</small></td>
            <td>{assetName(event)}<small>{event.nodo ? `NodeID ${event.nodo}` : 'NodeID no registrado'} · Orion {event.tipo}</small></td>
            <td><span className="orion-row-state"><span className="orion-dot" aria-hidden="true" />{state.label}</span>{state.note && <small>{state.note}</small>}</td>
            <td>{state.detail}</td>
          </tr>;
        })}</tbody>
      </table></div>}
      <div className="network-toolbar">
        <button disabled={loading || data.page <= 1} onClick={() => page(data.page - 1)}>Anterior</button>
        <span>{plural(data.total, 'evento', 'eventos')} · Página {data.page} de {data.last_page}</span>
        <button disabled={loading || data.page >= data.last_page} onClick={() => page(data.page + 1)}>Siguiente</button>
      </div>
    </>}
    {!result && loading && !error && <p role="status">Consultando el historial…</p>}
  </section>;
}
