import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useHref, useLinkClickHandler } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { request } from '../../services/api.ts';

type SeverityKey = 'critica' | 'alta' | 'media' | 'baja' | 'informativa' | 'sin_clasificar';
type ThreatSeverity = {
  periodo: string; desde: string; hasta: string; total: number;
  severidades: { clave: SeverityKey; nombre: string; total: number }[];
};
export type ThreatPeriod = { periodo: string; desde: string | null; hasta: string | null };

const order: SeverityKey[] = ['critica', 'alta', 'media', 'baja', 'informativa', 'sin_clasificar'];
const fixed = order.slice(0, 5);
const ringSize = 240;
const ringCenter = ringSize / 2;
const ringRadius = 96;
const ringStroke = 12;
const ringCircumference = 2 * Math.PI * ringRadius;
const ringGap = ringCircumference * (3 / 360);

const percent = new Intl.NumberFormat('es-MX', { style: 'percent', maximumFractionDigits: 1 });
const count = new Intl.NumberFormat('es-MX');

// Opens "Amenazas por severidad" with the dashboard's own period, so returning to the summary restores it.
function detailUrl(period: ThreatPeriod, key: SeverityKey) {
  const params = new URLSearchParams({ severidad: key });
  if (period.periodo !== 'today') params.set('periodo', period.periodo);
  if (period.periodo === 'custom') { params.set('desde', period.desde ?? ''); params.set('hasta', period.hasta ?? ''); }
  return `/monitoreo/amenazas?${params}`;
}

function SvgLink({ to, label, onFocus, onBlur, children }: {
  to: string; label: string; onFocus: () => void; onBlur: () => void; children: ReactNode;
}) {
  const href = useHref(to);
  const onClick = useLinkClickHandler(to);
  return <a href={href} onClick={onClick} aria-label={label} onFocus={onFocus} onBlur={onBlur}>{children}</a>;
}

// Owns the dashboard period selector (`controls`): counts only Palo Alto THREAT events (never Orion availability).
export default function ThreatSeverityPanel({ period, scope, controls }: { period: ThreatPeriod; scope: string; controls: ReactNode }) {
  const { session } = useAuth();
  const canQueryAll = session?.data.TipoUsuario.trim().toUpperCase() === 'ADMINISTRADOR';
  const [data, setData] = useState<ThreatSeverity | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [active, setActive] = useState<SeverityKey | null>(null);
  const incomplete = period.periodo === 'custom' && (!period.desde || !period.hasta);
  const query = new URLSearchParams({ periodo: period.periodo, ...(period.periodo === 'custom' ? { desde: period.desde ?? '', hasta: period.hasta ?? '' } : {}) }).toString();

  useEffect(() => {
    setData(null); setError(''); setActive(null);
    if (incomplete) return;
    const controller = new AbortController();
    request<{ data: ThreatSeverity }>(`/monitoreo/amenazas/severidad?${query}`, { signal: controller.signal })
      .then(result => setData(result.data))
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'No se pudo consultar la severidad de las amenazas.'); });
    return () => controller.abort();
  }, [query, incomplete, reload]);

  const byKey = new Map(data?.severidades.map(item => [item.clave, item]));
  const rows = order.filter(key => fixed.includes(key) || (byKey.get(key)?.total ?? 0) > 0)
    .map(key => ({ key, name: byKey.get(key)?.nombre ?? '', total: byKey.get(key)?.total ?? 0 }));
  const total = data?.total ?? 0;
  const describe = (row: typeof rows[number]) => `${row.name}: ${count.format(row.total)} (${percent.format(total ? row.total / total : 0)})`;
  const allEventsUrl = data ? `/consultas/eventos?${new URLSearchParams({ tipo: 'THREAT', desde: data.desde, hasta: data.hasta })}` : '';
  const activeRow = rows.find(row => row.key === active && row.total > 0);
  const visibleRows = rows.filter(row => row.total > 0);
  let ringOffset = 0;
  const segments = visibleRows.map(row => {
    const sweep = total ? row.total / total * ringCircumference : 0;
    const dash = visibleRows.length === 1 ? ringCircumference : Math.max(0.01, sweep - ringGap - ringStroke);
    const start = ringOffset + (sweep - dash) / 2;
    ringOffset += sweep;
    return { ...row, dash, start };
  });

  return <section className="threat-severity" aria-labelledby="threat-severity-title" aria-busy={!data && !error && !incomplete}>
    <div className="threat-severity-card">
      <header className="threat-severity-header">
        <div>
          <h2 id="threat-severity-title">Severidad de amenazas</h2>
          <p className="threat-severity-scope">Palo Alto · {scope} (días UTC)</p>
        </div>
        {canQueryAll && data && total > 0 && <Link to={allEventsUrl}>Ver detalle <span aria-hidden="true">→</span></Link>}
      </header>
      {controls}
      {error ? <div className="device-status-error" role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => setReload(value => value + 1)}>Reintentar</button>
      </div> : incomplete ? <p className="threat-severity-note" role="status">Elige las fechas de inicio y fin del periodo personalizado.</p> : <>
        <div className="threat-severity-body">
          <div className="threat-severity-chart">
            <svg viewBox={`0 0 ${ringSize} ${ringSize}`} role="group" aria-label={data
              ? `${count.format(total)} eventos de amenaza. ${rows.map(describe).join('; ')}.` : 'Cargando severidad de amenazas'}>
              {(segments.length !== 1) && <circle className="threat-ring-track" cx={ringCenter} cy={ringCenter} r={ringRadius} />}
              {segments.map(row => <g key={row.key} className={`threat-ring is-${row.key}${active && active !== row.key ? ' is-dimmed' : ''}`}
                onPointerEnter={() => setActive(row.key)} onPointerLeave={() => setActive(null)}>
                <SvgLink to={detailUrl(period, row.key)} label={`Ver amenazas: ${describe(row)}`}
                  onFocus={() => setActive(row.key)} onBlur={() => setActive(null)}>
                  <title>{describe(row)}</title>
                  <circle className="threat-ring-arc" cx={ringCenter} cy={ringCenter} r={ringRadius}
                    strokeDasharray={segments.length === 1 ? undefined : `${row.dash} ${ringCircumference}`}
                    strokeDashoffset={segments.length === 1 ? undefined : -row.start}
                    transform={`rotate(-90 ${ringCenter} ${ringCenter})`} />
                  <circle className="threat-ring-hit" cx={ringCenter} cy={ringCenter} r={ringRadius}
                    strokeDasharray={segments.length === 1 ? undefined : `${row.dash} ${ringCircumference}`}
                    strokeDashoffset={segments.length === 1 ? undefined : -row.start}
                    transform={`rotate(-90 ${ringCenter} ${ringCenter})`} />
                </SvgLink>
              </g>)}
              <text className={`threat-total${activeRow ? ' is-active' : ''}`} x={ringCenter} y={ringCenter - 3} textAnchor="middle">
                {activeRow ? `${count.format(activeRow.total)} · ${activeRow.name}` : data ? count.format(total) : '…'}
              </text>
              <text className="threat-total-label" x={ringCenter} y={ringCenter + 22} textAnchor="middle">
                {activeRow ? `${percent.format(activeRow.total / total)} del total` : 'eventos de amenaza'}
              </text>
            </svg>
          </div>
          <ul className="threat-legend" aria-label="Amenazas por severidad">
            {rows.map(row => {
              const content = <>
                <span className="threat-legend-dot" aria-hidden="true" />
                <span className="threat-legend-name">{row.name}</span>
                <span className="threat-legend-value"><strong>{data ? count.format(row.total) : '…'}</strong>{data && <> · {percent.format(total ? row.total / total : 0)}</>}</span>
              </>;
              return <li key={row.key} className={`is-${row.key}${active === row.key ? ' is-active' : ''}${data && row.total === 0 ? ' is-zero' : ''}`}
                onPointerEnter={() => setActive(row.key)} onPointerLeave={() => setActive(null)}>
                {data && row.total > 0
                  ? <Link className="threat-legend-row" to={detailUrl(period, row.key)} aria-label={`Ver amenazas: ${describe(row)}`}
                    onFocus={() => setActive(row.key)} onBlur={() => setActive(null)}>{content}</Link>
                  : <span className="threat-legend-row">{content}</span>}
              </li>;
            })}
          </ul>
        </div>
        {data && total === 0 && <p className="threat-severity-note" role="status">No hay eventos de amenaza en este periodo.</p>}
      </>}
    </div>
  </section>;
}
