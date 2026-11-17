import { useEffect, useState } from 'react';
import { request } from '../../services/api.ts';
import { FreshnessPanel, utc, type Freshness } from './freshness.tsx';

type DayState = 'con_eventos' | 'sin_eventos_cubierto' | 'sin_eventos_no_comprobado' | 'ingesta_retrasada' | 'hueco_confirmado';
interface Day { fecha: string; estado: DayState; eventos: number; hueco_parcial: boolean }
interface Range { desde: string; hasta: string }
interface Stream {
  flujo: string; nombre: string; frescura: Freshness; inicio_historial: string | null; aun_sin_datos: boolean;
  retencion: { dias_observados: number | null; limite_estimado: string | null; ultimo_avance_conocido: string | null; tramo_probablemente_irrecuperable: Range | null };
  ventanas_comprobadas: Range[]; huecos_confirmados: Range[]; dias: Day[]; resumen: Record<DayState, number>;
}
type Result = { disponible: false; motivo: string } | { disponible: true; desde: string; hasta: string; generado_en: string; inicio_historial: string | null; flujos: Stream[] };

const STATES: { key: DayState; label: string; help: string }[] = [
  { key: 'con_eventos', label: 'Hay eventos', help: 'Se guardó al menos un evento ese día.' },
  { key: 'sin_eventos_cubierto', label: 'Sin eventos, cobertura comprobada', help: 'Un avance continuo de la ingesta leyó el día completo y no encontró eventos.' },
  { key: 'sin_eventos_no_comprobado', label: 'Sin eventos, cobertura no comprobada', help: 'No hay eventos ni evidencia de que la fuente se haya leído ese día. No significa pérdida.' },
  { key: 'ingesta_retrasada', label: 'Ingesta retrasada', help: 'Posterior al último avance conocido de una ingesta que supera su umbral.' },
  { key: 'hueco_confirmado', label: 'Hueco confirmado', help: 'La ingesta registró que ese tramo no se leyó antes de que la fuente lo descartara.' },
];
const label = (state: DayState) => STATES.find(s => s.key === state)?.label ?? state;

/** Consecutive days with the same state, for a text reading of the strip. */
function runs(days: Day[]) {
  const result: { desde: string; hasta: string; estado: DayState; eventos: number; dias: number }[] = [];
  for (const day of days) {
    const last = result[result.length - 1];
    if (last && last.estado === day.estado) { last.hasta = day.fecha; last.eventos += day.eventos; last.dias++; }
    else result.push({ desde: day.fecha, hasta: day.fecha, estado: day.estado, eventos: day.eventos, dias: 1 });
  }
  return result;
}

function Retention({ stream }: { stream: Stream }) {
  const r = stream.retencion;
  if (r.dias_observados === null) return <p className="ingestion-note">No se ha observado la retención de esta fuente; SIALU no estima qué datos ya no se pueden recuperar.</p>;
  return <div className="ingestion-retention">
    <dl>
      <dt>Último dato guardado o leído</dt><dd>{utc(r.ultimo_avance_conocido) ?? 'Ninguno'}</dd>
      <dt>Retención observada en la fuente</dt><dd>≈ {r.dias_observados} días (límite estimado hoy: {utc(r.limite_estimado)})</dd>
      <dt>Tramo que probablemente ya no se puede recuperar</dt>
      <dd>{r.tramo_probablemente_irrecuperable
        ? `${utc(r.tramo_probablemente_irrecuperable.desde)} → ${utc(r.tramo_probablemente_irrecuperable.hasta)}`
        : r.ultimo_avance_conocido ? 'Ninguno: lo posterior al último dato sigue dentro de la retención observada.' : 'No se puede estimar sin un dato o avance previo.'}</dd>
    </dl>
    <p className="ingestion-note">Estimación basada en una retención observada de forma aproximada. La fecha exacta de pérdida depende de la retención real configurada en la fuente. SIALU no reconstruye eventos de ese tramo; si existieron y ya no están en la fuente, no se pueden recuperar.</p>
  </div>;
}

function StreamCoverage({ stream }: { stream: Stream }) {
  return <article className="ingestion-stream">
    <FreshnessPanel freshness={stream.frescura} />
    {!stream.frescura.instalado ? <p className="ingestion-note">El registro de este flujo aún no está instalado en la base de datos (migración pendiente de autorización); no hay cobertura que mostrar.</p>
    : stream.aun_sin_datos ? <p className="ingestion-note">Aún sin datos: no hay ingesta desde el inicio del historial ({utc(stream.inicio_historial)}). La cobertura se calculará a partir de la primera ingesta.</p> : <>
      <Retention stream={stream} />
      <div className="ingestion-strip" role="img" aria-label={`Cobertura diaria de ${stream.nombre}`}>
        {stream.dias.map(day => <span key={day.fecha} className={`ingestion-day ${day.estado}${day.hueco_parcial ? ' partial-gap' : ''}`}
          title={`${day.fecha}: ${label(day.estado)}${day.eventos ? ` · ${day.eventos} eventos` : ''}${day.hueco_parcial ? ' · incluye un hueco confirmado' : ''}`} />)}
      </div>
      <table className="ingestion-runs">
        <thead><tr><th>Periodo (UTC)</th><th>Estado</th><th>Eventos</th></tr></thead>
        <tbody>{runs(stream.dias).map(run => <tr key={run.desde}>
          <td>{run.desde === run.hasta ? run.desde : `${run.desde} → ${run.hasta}`}<small>{run.dias} {run.dias === 1 ? 'día' : 'días'}</small></td>
          <td><span className={`ingestion-dot ${run.estado}`} />{label(run.estado)}</td>
          <td>{run.eventos || '—'}</td>
        </tr>)}</tbody>
      </table>
      {stream.ventanas_comprobadas.length > 0 && <p className="ingestion-note">Lectura continua comprobada: {stream.ventanas_comprobadas.map(r => `${utc(r.desde)} → ${utc(r.hasta)}`).join('; ')}.</p>}
      {stream.huecos_confirmados.length > 0 && <p className="ingestion-note">Huecos registrados por la ingesta: {stream.huecos_confirmados.map(r => `${utc(r.desde)} → ${utc(r.hasta)}`).join('; ')}.</p>}
    </>}
  </article>;
}

export default function IngestionCoverage({ adapter }: { adapter: 'orion' | 'paloalto' }) {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setError('');
    request<{ data: Result }>(`/integraciones/${adapter}/cobertura`, { signal: controller.signal })
      .then(r => setResult(r.data))
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'No se pudo consultar la cobertura.'); });
    return () => controller.abort();
  }, [adapter, reload]);
  return <section className="ingestion-coverage">
    <h2>Cobertura de la ingesta</h2>
    <p>Estado de cada día (UTC). Un día sin eventos solo se considera comprobado o hueco cuando el avance de la ingesta lo demuestra; los lotes registrados no indican qué periodo consultaron.</p>
    <ul className="ingestion-legend">{STATES.map(s => <li key={s.key}><span className={`ingestion-dot ${s.key}`} /><strong>{s.label}</strong> {s.help}</li>)}</ul>
    {error ? <div role="alert"><p>{error}</p><button onClick={() => setReload(v => v + 1)}>Reintentar</button></div>
      : !result ? <p role="status">Consultando cobertura…</p>
      : !result.disponible ? <p>El identificador de la fuente no está configurado en el servidor.</p>
      : <>
        <p className="ingestion-note">Periodo {result.desde} → {result.hasta} · calculado {utc(result.generado_en)}.{result.inicio_historial && ` El historial de SIALU comienza el ${utc(result.inicio_historial)}; no se consideran datos anteriores.`}</p>
        {result.flujos.map(stream => <StreamCoverage key={stream.flujo} stream={stream} />)}
      </>}
  </section>;
}
