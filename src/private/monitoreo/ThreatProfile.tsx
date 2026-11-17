import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { request } from '../../services/api.ts';
import './monitoreo.css';

type SeverityKey = 'critica' | 'alta' | 'media' | 'baja' | 'informativa' | 'sin_clasificar';
type Reference = { tipo: 'CVE' | 'URL' | 'FABRICANTE' | 'BUGTRAQ'; valor: string };
type Profile = {
  threat_id: string; periodo: string; desde: string; hasta: string;
  severidad: { clave: SeverityKey; nombre: string } | null;
  observado: {
    eventos: number; ultima_deteccion: string | null; acciones: { accion: string | null; eventos: number }[];
    subtipos: (string | null)[]; nombre_log: string | null; categoria_log: string | null; nombres_distintos: number;
  };
  fuente_oficial: {
    estado: 'SIN_ACCESO' | 'PENDIENTE' | 'ENCONTRADA' | 'NO_ENCONTRADA' | 'ERROR';
    fuente: string | null; fecha_consulta: string | null; descripcion: string | null; referencias: Reference[]; mensaje: string | null;
  };
};

const count = new Intl.NumberFormat('es-MX');
const day = (value: string) => new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  .format(new Date(value + 'T00:00:00Z'));
const unavailable = <span className="is-empty">No disponible</span>;
const referenceLabels: Record<Reference['tipo'], string> = { CVE: 'CVE', URL: 'Referencias', FABRICANTE: 'ID del fabricante', BUGTRAQ: 'Bugtraq' };

// Profile of one Palo Alto ThreatID. Official text appears only when Palo Alto supplied it; the observed section
// counts the same events as "Amenazas por severidad" for the severity and period it was opened with.
export default function ThreatProfile() {
  const { session } = useAuth();
  const canQuery = session?.data.TipoUsuario.trim().toUpperCase() === 'ADMINISTRADOR';
  const [params] = useSearchParams();
  const threatId = params.get('threat_id')?.trim() ?? '';
  const periodo = params.get('periodo') ?? 'today';
  const context = new URLSearchParams({
    ...(params.get('severidad') ? { severidad: params.get('severidad')! } : {}),
    ...(periodo !== 'today' ? { periodo } : {}),
    ...(periodo === 'custom' ? { desde: params.get('desde') ?? '', hasta: params.get('hasta') ?? '' } : {}),
  });
  const query = threatId ? new URLSearchParams({ threat_id: threatId, ...Object.fromEntries(context) }).toString() : '';
  const [data, setData] = useState<Profile | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setData(null); setError('');
    if (!query) return;
    const controller = new AbortController();
    request<{ data: Profile }>(`/monitoreo/amenazas/ficha?${query}`, { signal: controller.signal })
      .then(result => setData(result.data))
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'No se pudo consultar la ficha de la amenaza.'); });
    return () => controller.abort();
  }, [query, reload]);

  const backUrl = context.has('severidad') ? `/monitoreo/amenazas?${context}` : `/${periodo === 'today' ? '' : `?${context}`}`;
  const official = data?.fuente_oficial;
  const observed = data?.observado;
  const eventsUrl = data && `/consultas/eventos?${new URLSearchParams({
    tipo: 'THREAT', ...(data.severidad ? { severidad: data.severidad.clave } : {}), desde: data.desde, hasta: data.hasta, amenaza: `id:${data.threat_id}`,
  })}`;

  return <section className={`monitoring-page threat-detail${data?.severidad ? ` is-${data.severidad.clave}` : ''}`} aria-labelledby="threat-profile-title"
    aria-busy={!!threatId && !data && !error}>
    <header className="monitoring-header">
      <div className="monitoring-heading">
        <Link className="monitoring-eyebrow threat-detail-back" to={backUrl}><ArrowLeft size={14} aria-hidden="true" /> {context.has('severidad') ? 'Amenazas por severidad' : 'Resumen'}</Link>
        <h1 id="threat-profile-title">{observed?.nombre_log ?? (threatId ? `Amenaza ${threatId}` : 'Ficha de amenaza')}</h1>
        <p>{threatId && <>ThreatID {threatId} de Palo Alto</>}</p>
      </div>
    </header>

    {!threatId ? <div className="threat-severity-card device-status-error" role="alert">
      <p>Falta el identificador de la amenaza. Elige una amenaza desde “Amenazas por severidad”.</p>
      <Link to={backUrl}>Volver</Link>
    </div> : error ? <div className="threat-severity-card device-status-error" role="alert">
      <p>{error}</p>
      <button type="button" onClick={() => setReload(value => value + 1)}>Reintentar</button>
    </div> : !data || !official || !observed ? <p className="threat-severity-card threat-severity-note" role="status">Cargando ficha…</p> : <>
      <section className="threat-detail-block threat-profile-first" aria-labelledby="threat-official-title">
        <header className="device-status-header">
          <h2 id="threat-official-title">Información de Palo Alto</h2>
          {official.fuente && <span className="threat-detail-count">
            Fuente: {official.fuente}{official.fecha_consulta && <> · consultada el {official.fecha_consulta} UTC</>}
          </span>}
        </header>
        <div className="threat-severity-card">
          {official.estado === 'ENCONTRADA' ? <>
            <dl className="threat-profile-fields">
              <div><dt>Descripción</dt><dd>{official.descripcion ? <p className="threat-profile-text">{official.descripcion}</p> : unavailable}</dd></div>
              {(['CVE', 'URL', 'FABRICANTE', 'BUGTRAQ'] as const).map(type => {
                const values = official.referencias.filter(item => item.tipo === type);
                return values.length > 0 && <div key={type}><dt>{referenceLabels[type]}</dt><dd><ul className="threat-profile-list">
                  {values.map(item => <li key={item.valor}>{type === 'URL' && /^https?:\/\//i.test(item.valor)
                    ? <a href={item.valor} target="_blank" rel="noopener noreferrer">{item.valor}</a> : item.valor}</li>)}
                </ul></dd></div>;
              })}
            </dl>
            {official.referencias.length === 0 && <p className="threat-severity-note">Palo Alto no entregó referencias ni CVE para esta amenaza.</p>}
          </> : <p className={official.estado === 'ERROR' ? 'device-status-error' : 'threat-severity-note'} role="status">
            {official.estado === 'NO_ENCONTRADA' ? 'Palo Alto no tiene información publicada para este ThreatID.'
              : official.estado === 'PENDIENTE' ? 'La información oficial de esta amenaza todavía no se ha consultado.'
                : official.mensaje ?? 'La información oficial no está disponible.'}
            {' '}No se muestra descripción ni referencias.
          </p>}
        </div>
      </section>

      <section className="threat-detail-block" aria-labelledby="threat-observed-title">
        <header className="device-status-header">
          <h2 id="threat-observed-title">Observado por SIALU</h2>
          <span className="threat-detail-count">
            {data.severidad ? <>Severidad {data.severidad.nombre.toLocaleLowerCase('es')} · </> : null}
            {data.desde === data.hasta ? day(data.desde) : `${day(data.desde)} al ${day(data.hasta)}`} (UTC)
          </span>
        </header>
        {observed.eventos === 0 ? <p className="threat-severity-card threat-severity-note" role="status">
          SIALU no registró eventos de esta amenaza{data.severidad ? ' con esta severidad' : ''} en el periodo.
        </p> : <>
          <dl className="threat-detail-summary">
            <div><dt>Eventos</dt><dd>{canQuery && eventsUrl ? <Link className="threat-count-link" to={eventsUrl}>{count.format(observed.eventos)}</Link> : count.format(observed.eventos)}</dd></div>
            <div><dt>Última detección (UTC)</dt><dd className="threat-profile-date">{observed.ultima_deteccion ?? unavailable}</dd></div>
            <div><dt>Subtipo</dt><dd className="threat-profile-date">{observed.subtipos.length ? observed.subtipos.map(item => item ?? 'Sin subtipo').join(', ') : unavailable}</dd></div>
          </dl>
          <div className="threat-severity-card threat-profile-observed">
            <h3>Acciones del firewall</h3>
            <ul className="threat-legend threat-profile-actions">
              {observed.acciones.map(item => <li key={item.accion ?? ''}><span className="threat-legend-row">
                <span className="threat-legend-dot" aria-hidden="true" />
                <span className={`threat-legend-name${item.accion ? '' : ' is-empty'}`}>{item.accion ?? 'Acción no disponible'}</span>
                <strong>{count.format(item.eventos)}</strong>
                <span className="threat-legend-percent">{plural(item.eventos)}</span>
              </span></li>)}
            </ul>
            <dl className="threat-profile-fields">
              <div><dt>Categoría según el log</dt><dd>{observed.categoria_log ?? unavailable}</dd></div>
              {observed.nombres_distintos > 1 && <div><dt>Nombre</dt><dd>Los logs registran {observed.nombres_distintos} nombres distintos para este ThreatID; se muestra uno de ellos.</dd></div>}
            </dl>
            <p className="threat-severity-note">
              Datos de los eventos THREAT que SIALU recibió del firewall; el nombre y la categoría vienen del log, no de una fuente oficial.
              {!canQuery && ' La consulta de eventos individuales está disponible para administradores.'}
            </p>
          </div>
        </>}
      </section>
    </>}
  </section>;
}

function plural(value: number) { return value === 1 ? 'evento' : 'eventos'; }
