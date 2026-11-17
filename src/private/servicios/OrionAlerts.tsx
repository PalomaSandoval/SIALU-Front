import { useEffect, useState } from 'react';
import type { SubmitEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { request } from '../../services/api.ts';
import '../catalogos/catalog-admin.css';
import './orion-alerts.css';
import { FreshnessPanel, type Freshness } from './freshness.tsx';

interface AlertRow {
  IdAlerta: string; IdAlertaActivaOrigen: string; NombreAlerta: string | null; Estado: 'ACTIVA' | 'RESUELTA';
  FechaDisparo: string | null; FechaResolucion: string | null; HistorialExpirado: string | number | boolean;
  SeveridadOrigen: string | null; FechaObservacionSeveridad: string; Severidad: string;
  TipoEntidadOrigen: string | null; EntidadOrigen: string | null; NodoOrigen: string | null; Mensaje: string | null;
  IdActivo: string | null; Activo: string | null;
}
type Result =
  | { disponible: false; motivo: 'sin_configurar' | 'sin_migrar' }
  | { disponible: true; data: AlertRow[]; total: number; page: number; last_page: number;
      resumen: { activas: number; resueltas: number }; ultimo_intento: { estado: string; inicio: string; fin: string | null } | null; frescura: Freshness };

const unavailable: Record<string, string> = {
  sin_configurar: 'El identificador de la fuente Orion no está configurado en el servidor.',
  sin_migrar: 'El registro de alertas aún no está instalado en la base de datos (migración 016 pendiente de autorización).',
};
const utc = (value: string | null) => value ? `${value} UTC` : null;
const expired = (row: AlertRow) => row.HistorialExpirado === true || Number(row.HistorialExpirado) === 1;

function State({ row }: { row: AlertRow }) {
  if (row.Estado === 'ACTIVA') return <span className="orion-alert-state active">Activa</span>;
  return <><span className="orion-alert-state">Resuelta</span>{!row.FechaResolucion && <small>Hora de resolución no disponible</small>}</>;
}

export default function OrionAlerts() {
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError('');
    request<Result>(`/integraciones/orion/alertas?${query}`, { signal: controller.signal })
      .then(data => { if (!controller.signal.aborted) setResult(data); })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudieron consultar las alertas.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, revision]);
  function filter(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const next = new URLSearchParams(params);
    ['estado', 'desde', 'hasta'].forEach(key => { const value = String(data.get(key) || ''); if (value) next.set(key, value); else next.delete(key); });
    next.delete('page'); setParams(next);
  }
  function navigate(page: number) { const next = new URLSearchParams(params); next.set('page', String(page)); setParams(next); }
  return <section className="network-admin">
    <header><h1>Alertas de Orion</h1>
      <p>Alertas que realmente se dispararon en Orion. La severidad es la configurada en la alerta de Orion al momento de importarla y se muestra con su equivalente del catálogo de SIALU; si ese valor no tiene una equivalencia verificada aparece como Desconocida, junto al valor original. Las caídas DOWN/UP se registran por separado en Eventos Down/Up. Fechas en UTC.</p>
      {result?.disponible && <div className="orion-alert-summary">
        <span><strong>{result.resumen.activas}</strong>Activas</span>
        <span><strong>{result.resumen.resueltas}</strong>Resueltas</span>
      </div>}
      {result?.disponible && <FreshnessPanel freshness={result.frescura} />}
      {result?.disponible && result.frescura.estado !== 'al_dia' && result.frescura.estado !== 'aun_sin_datos' && <p className="ingestion-note">La lista refleja la última consulta exitosa{result.frescura.ultima_consulta_exitosa ? ` (${utc(result.frescura.ultima_consulta_exitosa)})` : ', que aún no existe'}. Alertas disparadas o resueltas después pueden no aparecer, y una alerta marcada como activa puede haberse resuelto.</p>}
    </header>
    <form key={query} className="network-toolbar" onSubmit={filter}>
      <label>Estado<select name="estado" defaultValue={params.get('estado') ?? ''}><option value="">Todas</option><option value="ACTIVA">Activas</option><option value="RESUELTA">Resueltas</option></select></label>
      <label>Desde (UTC)<input type="date" name="desde" defaultValue={params.get('desde') ?? ''} /></label>
      <label>Hasta (UTC)<input type="date" name="hasta" defaultValue={params.get('hasta') ?? ''} /></label>
      <button disabled={loading}>Buscar</button>
    </form>
    {error && <div role="alert"><p>{error}</p><button onClick={() => setRevision(value => value + 1)}>Reintentar</button></div>}
    {loading ? <p role="status">Consultando alertas…</p> : !error && result && (!result.disponible ? <p>{unavailable[result.motivo] ?? 'Las alertas no están disponibles.'}</p> : <>
      {!result.data.length ? <p>No hay alertas que coincidan con los filtros.</p> : <div className="network-table"><table>
        <thead><tr><th>Estado</th><th>Alerta</th><th>Equipo</th><th>Severidad</th><th>Disparo (UTC)</th><th>Resolución (UTC)</th></tr></thead>
        <tbody>{result.data.map(row => <tr key={row.IdAlerta}>
          <td><State row={row} /></td>
          <td>{row.NombreAlerta || 'Alerta sin configuración en Orion'}<small>{row.Mensaje || 'Sin mensaje'} · ID Orion {row.IdAlertaActivaOrigen}</small></td>
          <td>{row.Activo || (row.NodoOrigen ? `Nodo Orion ${row.NodoOrigen} sin activo en SIALU` : 'Sin nodo relacionado')}<small>{[row.EntidadOrigen, row.TipoEntidadOrigen].filter(Boolean).join(' · ') || 'Entidad no informada'}</small></td>
          <td>{row.Severidad}<small>{row.SeveridadOrigen !== null ? `Orion: ${row.SeveridadOrigen}` : 'Orion: sin dato'} · observada {utc(row.FechaObservacionSeveridad)}</small></td>
          <td>{utc(row.FechaDisparo) ?? 'No disponible'}{expired(row) && <small>Historial anterior no disponible en Orion</small>}</td>
          <td>{utc(row.FechaResolucion) ?? (row.Estado === 'ACTIVA' ? 'Sigue activa' : 'No disponible')}</td>
        </tr>)}</tbody>
      </table></div>}
      <div className="network-toolbar"><button disabled={result.page <= 1} onClick={() => navigate(result.page - 1)}>Anterior</button><span>{result.total} alertas · Página {result.page} de {result.last_page}</span><button disabled={result.page >= result.last_page} onClick={() => navigate(result.page + 1)}>Siguiente</button></div>
    </>)}
  </section>;
}
