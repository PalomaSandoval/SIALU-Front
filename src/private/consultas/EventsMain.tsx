import { useEffect, useState } from 'react';
import type { SubmitEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { request } from '../../services/api.ts';
import '../catalogos/catalog-admin.css';
interface EventRow { IdEvento: string; FechaEvento: string; IPOrigen: string | null; IPDestino: string | null; Fuente: string; Serial: string; ZonaOrigen: string | null; ZonaDestino: string | null; Accion: string | null; TipoEventoOrigen: string | null; Severidad: string | null }
const severities: Record<string, string> = { critica: 'Crítica', alta: 'Alta', media: 'Media', baja: 'Baja', informativa: 'Informativa', sin_clasificar: 'Sin clasificar' };
// Same keys as the threat view: id:<ThreatID>, nombre:<NombreAmenaza> or ninguna.
const threatFilterLabel = (key: string) => key === 'ninguna' ? 'sin identificar' : key.startsWith('id:') ? `ID ${key.slice(3)}` : key.replace(/^nombre:/, '');
interface Result { data: EventRow[]; total: number; page: number; last_page: number }
export default function EventQueriesMain() {
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    request<Result>(`/consultas/eventos?${query}`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setResult(data); })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudieron consultar los eventos.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, revision]);
  function filter(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const next = new URLSearchParams(params);
    ['ip', 'desde', 'hasta'].forEach(key => { const value = String(data.get(key) || ''); if (value) next.set(key, value); else next.delete(key); });
    next.delete('page'); setParams(next);
  }
  function navigate(page: number) { const next = new URLSearchParams(params); next.set('page', String(page)); setParams(next); }
  return <section className="network-admin"><header><h1>Consulta de eventos</h1><p>Eventos de Palo Alto. Las fechas y los filtros de fecha se muestran en UTC.</p></header>
    {(params.has('zona') || params.has('serial') || params.has('fuente_id') || params.has('tipo') || params.has('severidad') || params.has('subtipo') || params.has('amenaza')) && <p>Filtros aplicados: {params.has('tipo') && <>tipo <strong>{params.get('tipo')}</strong> · </>}{params.has('severidad') && <>severidad <strong>{severities[params.get('severidad')!] ?? params.get('severidad')}</strong> · </>}{params.has('subtipo') && <>subtipo <strong>{params.get('subtipo') || 'sin subtipo'}</strong> · </>}{params.has('amenaza') && <>amenaza <strong>{threatFilterLabel(params.get('amenaza')!)}</strong> · </>}{params.has('zona') && <>zona <strong>{params.get('zona')}</strong> · </>}{params.has('serial') && <>firewall <strong>{params.get('serial')}</strong> · </>}{params.has('fuente_id') && <>fuente #{params.get('fuente_id')}</>}. La zona puede aparecer como origen o destino. <button onClick={() => setParams({})}>Quitar filtros</button></p>}
    <form key={query} className="network-toolbar" onSubmit={filter}><label>IP de origen o destino<input name="ip" defaultValue={params.get('ip') ?? ''} placeholder="IP exacta" /></label><label>Desde (UTC)<input type="date" name="desde" defaultValue={params.get('desde') ?? ''} /></label><label>Hasta (UTC)<input type="date" name="hasta" defaultValue={params.get('hasta') ?? ''} /></label><button disabled={loading}>Buscar</button></form>
    {error && <div role="alert"><p>{error}</p><button onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>}
    {loading ? <p role="status">Consultando eventos…</p> : !error && result && <>{!result.data.length ? <p>No hay eventos que coincidan con los filtros.</p> : <div className="network-table"><table><thead><tr><th>Fecha (UTC)</th><th>IP de origen / zona</th><th>IP de destino / zona</th><th>Tipo / severidad</th><th>Acción</th><th>Fuente / firewall</th></tr></thead><tbody>{result.data.map(row => <tr key={`${row.IdEvento}-${row.FechaEvento}`}><td>{row.FechaEvento}</td><td>{row.IPOrigen || 'Sin IP'}<small>{row.ZonaOrigen || 'Sin zona'}</small></td><td>{row.IPDestino || 'Sin IP'}<small>{row.ZonaDestino || 'Sin zona'}</small></td><td>{row.TipoEventoOrigen || 'Sin tipo'}<small>{row.Severidad || 'Sin severidad'}</small></td><td>{row.Accion || 'Sin acción'}</td><td>{row.Fuente}<small>Serie: {row.Serial || 'Sin identificar'}</small></td></tr>)}</tbody></table></div>}<div className="network-toolbar"><button disabled={result.page <= 1} onClick={() => navigate(result.page - 1)}>Anterior</button><span>{result.total} eventos · Página {result.page} de {result.last_page}</span><button disabled={result.page >= result.last_page} onClick={() => navigate(result.page + 1)}>Siguiente</button></div></>}
  </section>;
}
