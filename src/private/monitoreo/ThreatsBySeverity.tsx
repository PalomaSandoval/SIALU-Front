import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { request } from '../../services/api.ts';
import './monitoreo.css';

type SeverityKey = 'critica' | 'alta' | 'media' | 'baja' | 'informativa' | 'sin_clasificar';
type Threat = { clave: string; threat_id: string | null; nombre: string | null; subtipo: string | null; eventos: number; ultima_deteccion: string };
type Subtype = { subtipo: string | null; eventos: number; amenazas: number };
type Detail = {
  periodo: string; desde: string; hasta: string; severidad: { clave: SeverityKey; nombre: string };
  eventos: number; subtipos: Subtype[]; amenazas: Threat[];
};
type SortKey = 'eventos' | 'nombre' | 'subtipo' | 'ultima_deteccion';

const severityKeys: SeverityKey[] = ['critica', 'alta', 'media', 'baja', 'informativa', 'sin_clasificar'];
const pageSize = 100;
const count = new Intl.NumberFormat('es-MX');
const day = (value: string) => new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  .format(new Date(value + 'T00:00:00Z'));
const plural = (value: number, one: string, many: string) => `${count.format(value)} ${value === 1 ? one : many}`;
const subtypeNames: Record<string, string> = {
  vulnerability: 'Vulnerabilidad', spyware: 'Spyware', virus: 'Virus',
  'wildfire-virus': 'Virus de WildFire', 'ml-virus': 'Virus detectado por ML',
  wildfire: 'WildFire', url: 'Filtrado de URL', file: 'Bloqueo de archivos',
  data: 'Filtrado de datos', flood: 'Inundación de tráfico',
  scan: 'Escaneo', packet: 'Protección de paquetes',
};
const subtypeLabel = (value: string | null) => value === null ? 'Sin subtipo' : subtypeNames[value.toLowerCase()] ?? value;
const threatLabel = (threat: Threat) => threat.nombre ?? (threat.threat_id ? `ID ${threat.threat_id}` : 'Amenaza sin identificar');
const compareText = (a: string | null, b: string | null) => (a ?? '￿').localeCompare(b ?? '￿', 'es', { sensitivity: 'base' });

// Opened from the dashboard severity chart; keeps its severity and period in the URL so returning restores both.
export default function ThreatsBySeverity() {
  const { session } = useAuth();
  // The event query is restricted to administrators, so only they get links to individual events.
  const canQuery = session?.data.TipoUsuario.trim().toUpperCase() === 'ADMINISTRADOR';
  const [params, setParams] = useSearchParams();
  const severity = params.get('severidad') as SeverityKey | null;
  const validSeverity = severity !== null && severityKeys.includes(severity);
  const periodo = params.get('periodo') ?? 'today';
  const periodQuery = new URLSearchParams({ periodo, ...(periodo === 'custom' ? { desde: params.get('desde') ?? '', hasta: params.get('hasta') ?? '' } : {}) });
  const query = validSeverity ? new URLSearchParams({ severidad: severity, ...Object.fromEntries(periodQuery) }).toString() : '';
  // "subtipo" absent: every subtype; empty: events without a subtype.
  const subtypeFilter = params.has('subtipo') ? (params.get('subtipo') || null) : undefined;

  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'eventos', desc: true });
  const [visible, setVisible] = useState(pageSize);

  useEffect(() => {
    setData(null); setError('');
    if (!query) return;
    const controller = new AbortController();
    request<{ data: Detail }>(`/monitoreo/amenazas/detalle?${query}`, { signal: controller.signal })
      .then(result => setData(result.data))
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'No se pudieron consultar las amenazas.'); });
    return () => controller.abort();
  }, [query, reload]);

  useEffect(() => setVisible(pageSize), [query, subtypeFilter, sort]);

  const threats = useMemo(() => {
    const rows = (data?.amenazas ?? []).filter(threat => subtypeFilter === undefined || threat.subtipo === subtypeFilter);
    const direction = sort.desc ? -1 : 1;
    // Ties fall back to frequency and then recency, the initial order.
    return [...rows].sort((a, b) => {
      const primary = sort.key === 'eventos' ? a.eventos - b.eventos
        : sort.key === 'ultima_deteccion' ? a.ultima_deteccion.localeCompare(b.ultima_deteccion)
          : sort.key === 'nombre' ? compareText(threatLabel(a), threatLabel(b)) : compareText(a.subtipo, b.subtipo);
      return primary * direction || b.eventos - a.eventos || b.ultima_deteccion.localeCompare(a.ultima_deteccion);
    });
  }, [data, subtypeFilter, sort]);

  const selectedSubtype = subtypeFilter === undefined ? undefined : data?.subtipos.find(item => item.subtipo === subtypeFilter);
  const listedEvents = threats.reduce((sum, threat) => sum + threat.eventos, 0);
  // A threat can only repeat across subtypes, so the distinct count over every subtype dedupes by key.
  const distinctThreats = subtypeFilter === undefined ? new Set(threats.map(threat => threat.clave)).size : threats.length;
  const maxEvents = Math.max(1, ...(data?.subtipos.map(item => item.eventos) ?? []));
  const backUrl = `/${periodo === 'today' ? '' : `?${periodQuery}`}`;
  const severityName = data?.severidad.nombre ?? (validSeverity ? { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja', informativa: 'Informativa', sin_clasificar: 'Sin clasificar' }[severity] : '');

  function toggleSubtype(value: string | null) {
    const next = new URLSearchParams(params);
    if (subtypeFilter !== undefined && subtypeFilter === value) next.delete('subtipo');
    else next.set('subtipo', value ?? '');
    setParams(next, { replace: true });
  }

  function sortBy(key: SortKey) {
    setSort(current => current.key === key ? { key, desc: !current.desc } : { key, desc: key === 'eventos' || key === 'ultima_deteccion' });
  }

  // The profile keeps the list's severity and period, so its counts are the ones shown here.
  function profileUrl(threatId: string) {
    return `/monitoreo/amenazas/ficha?${new URLSearchParams({ threat_id: threatId, severidad: data!.severidad.clave, ...Object.fromEntries(periodQuery) })}`;
  }

  function eventsUrl(threat: Threat) {
    return `/consultas/eventos?${new URLSearchParams({
      tipo: 'THREAT', severidad: data!.severidad.clave, desde: data!.desde, hasta: data!.hasta, subtipo: threat.subtipo ?? '', amenaza: threat.clave,
    })}`;
  }

  const header = (key: SortKey, label: string, className = '') => <th scope="col" className={className}
    aria-sort={sort.key === key ? (sort.desc ? 'descending' : 'ascending') : 'none'}>
    <button type="button" className="threat-sort" onClick={() => sortBy(key)}>
      {label}{sort.key === key && (sort.desc ? <ArrowDown size={13} aria-hidden="true" /> : <ArrowUp size={13} aria-hidden="true" />)}
    </button>
  </th>;

  return <section className={`monitoring-page threat-detail${validSeverity ? ` is-${severity}` : ''}`} aria-labelledby="threat-detail-title"
    aria-busy={validSeverity && !data && !error}>
    <header className="monitoring-header">
      <div className="monitoring-heading">
        <Link className="monitoring-eyebrow threat-detail-back" to={backUrl}><ArrowLeft size={14} aria-hidden="true" /> Resumen</Link>
        <h1 id="threat-detail-title">Amenazas por severidad{severityName && <>: <span className="threat-detail-severity">{severityName}</span></>}</h1>
        <p>{data ? <>Eventos de amenaza de Palo Alto del {data.desde === data.hasta ? day(data.desde) : `${day(data.desde)} al ${day(data.hasta)}`} (días en UTC)</> : validSeverity ? 'Consultando periodo…' : ''}</p>
      </div>
    </header>

    {!validSeverity ? <div className="threat-severity-card device-status-error" role="alert">
      <p>La severidad indicada no es válida. Vuelve al resumen y elige una severidad de la gráfica.</p>
      <Link to={backUrl}>Volver al resumen</Link>
    </div> : error ? <div className="threat-severity-card device-status-error" role="alert">
      <p>{error}</p>
      <button type="button" onClick={() => setReload(value => value + 1)}>Reintentar</button>
    </div> : !data ? <p className="threat-severity-card threat-severity-note" role="status">Cargando amenazas…</p>
      : data.eventos === 0 ? <p className="threat-severity-card threat-severity-note" role="status">
        No se detectaron eventos de amenaza de severidad {data.severidad.nombre.toLocaleLowerCase('es')} en este periodo.
      </p> : <>
        <dl className="threat-detail-summary">
          <div><dt>Eventos</dt><dd>{count.format(data.eventos)}</dd></div>
          <div><dt>Amenazas distintas</dt><dd>{count.format(new Set(data.amenazas.map(threat => threat.clave)).size)}</dd></div>
          <div><dt>Subtipos</dt><dd>{count.format(data.subtipos.length)}</dd></div>
        </dl>

        <section className="threat-detail-block" aria-labelledby="threat-subtypes-title">
          <header className="device-status-header">
            <h2 id="threat-subtypes-title">Eventos por subtipo</h2>
            {subtypeFilter !== undefined && <button type="button" className="threat-detail-clear" onClick={() => toggleSubtype(subtypeFilter)}>Mostrar todos los subtipos</button>}
          </header>
          <div className="threat-severity-card">
            <ul className="threat-bars" aria-label="Eventos por subtipo. Elige un subtipo para filtrar la lista de amenazas.">
              {data.subtipos.map(item => {
                const selected = subtypeFilter !== undefined && subtypeFilter === item.subtipo;
                const description = `${subtypeLabel(item.subtipo)}: ${plural(item.eventos, 'evento', 'eventos')}, ${plural(item.amenazas, 'amenaza distinta', 'amenazas distintas')}`;
                return <li key={item.subtipo ?? ''}>
                  <button type="button" className={`threat-bar${selected ? ' is-selected' : ''}${subtypeFilter !== undefined && !selected ? ' is-dimmed' : ''}`}
                    aria-pressed={selected} aria-label={`${selected ? 'Quitar filtro' : 'Filtrar'}: ${description}`} title={description}
                    onClick={() => toggleSubtype(item.subtipo)}>
                    <span className={`threat-bar-name${item.subtipo === null ? ' is-empty' : ''}`}>{subtypeLabel(item.subtipo)}</span>
                    <span className="threat-bar-track" aria-hidden="true"><span className="threat-bar-fill" style={{ width: `${item.eventos / maxEvents * 100}%` }} /></span>
                    <strong>{count.format(item.eventos)}</strong>
                    <span className="threat-bar-meta">{plural(item.amenazas, 'amenaza', 'amenazas')}</span>
                  </button>
                </li>;
              })}
            </ul>
            <p className="threat-severity-note">La barra muestra eventos por subtipo; a su derecha, cuántas amenazas distintas los generaron.</p>
          </div>
        </section>

        <section className="threat-detail-block" aria-labelledby="threat-list-title">
          <header className="device-status-header">
            <h2 id="threat-list-title">Amenazas detectadas{subtypeFilter !== undefined && <> · {subtypeLabel(subtypeFilter)}</>}</h2>
            <span className="threat-detail-count" role="status">
              {plural(distinctThreats, 'amenaza distinta', 'amenazas distintas')} · {plural(listedEvents, 'evento', 'eventos')}
            </span>
          </header>
          <div className="threat-severity-card threat-list-card">
            {subtypeFilter !== undefined && !selectedSubtype ? <p className="threat-severity-note" role="status">
              No hay eventos del subtipo «{subtypeLabel(subtypeFilter)}» con esta severidad en el periodo. <button type="button" className="threat-detail-clear" onClick={() => toggleSubtype(subtypeFilter)}>Mostrar todos los subtipos</button>
            </p> : <>
              <div className="threat-table">
                <table>
                  <thead><tr>
                    {header('nombre', 'Amenaza')}
                    {header('subtipo', 'Subtipo')}
                    {header('eventos', 'Eventos', 'is-number')}
                    {header('ultima_deteccion', 'Última detección (UTC)')}
                  </tr></thead>
                  <tbody>
                    {threats.slice(0, visible).map(threat => {
                      const name = <>
                        <span className={threat.nombre || threat.threat_id ? '' : 'is-empty'}>{threatLabel(threat)}</span>
                        <small>{threat.nombre && threat.threat_id ? `ID ${threat.threat_id}` : threat.nombre ? 'Sin ID de amenaza' : ''}</small>
                      </>;
                      return <tr key={`${threat.clave}|${threat.subtipo ?? ''}`}>
                        <th scope="row">{threat.threat_id
                          ? <Link className="threat-link" to={profileUrl(threat.threat_id)} aria-label={`Ver ficha de ${threatLabel(threat)}`}>{name}</Link>
                          : canQuery ? <Link className="threat-link" to={eventsUrl(threat)} aria-label={`Ver ${plural(threat.eventos, 'evento', 'eventos')} de ${threatLabel(threat)}`}>{name}</Link>
                            : name}</th>
                        <td className={threat.subtipo === null ? 'is-empty' : ''}>{subtypeLabel(threat.subtipo)}</td>
                        <td className="is-number">{canQuery
                          ? <Link className="threat-count-link" to={eventsUrl(threat)} aria-label={`Ver ${plural(threat.eventos, 'evento', 'eventos')} de ${threatLabel(threat)}`}>{count.format(threat.eventos)}</Link>
                          : count.format(threat.eventos)}</td>
                        <td className="is-date">{threat.ultima_deteccion}</td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <div className="threat-list-footer">
                <span>Mostrando {count.format(Math.min(visible, threats.length))} de {plural(threats.length, 'fila', 'filas')}</span>
                {visible < threats.length && <button type="button" className="threat-detail-clear" onClick={() => setVisible(value => value + pageSize)}>Mostrar {count.format(Math.min(pageSize, threats.length - visible))} más</button>}
              </div>
              <p className="threat-severity-note">
                Las amenazas se agrupan por su identificador de Palo Alto; si un evento no lo trae, por su nombre.
                {' Elige una amenaza con ID para ver su ficha.'}
                {canQuery ? ' Elige el número de eventos para consultar los eventos individuales.' : ' La consulta de eventos individuales está disponible para administradores.'}
              </p>
            </>}
          </div>
        </section>
      </>}
  </section>;
}
