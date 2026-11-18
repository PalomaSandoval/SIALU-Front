import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { ApiError, request } from '../../services/api.ts';
import '../catalogos/catalog-admin.css';
import './orion-monthly-availability.css';

type DayInfo = { dia: number; cobertura: 'COMPLETA' | 'SD' | 'FUTURO'; fuente: string | null; captura_origen: number | null; motivo: string | null };
type Summary = { orden: number; nivel: 'GENERAL' | 'AREA' | 'GRUPO'; area: string | null; grupo: string | null; total_nodos: number; incluidos: number; sin_datos: number; con_error: number; no_consultados: number; disponibilidad: string | null; caidas_por_dia: Record<string, number | null> };
type NodeRow = { node_id: number; nombre: string | null; area: string | null; grupo: string | null; estado: 'ok' | 'sin_datos' | 'error' | 'no_consultado'; motivo: string | null; texto_orion: string | null; disponibilidad: string | null; dias: Record<string, number | null> };
type CaptureItem = { id: number; origen: string; estado: string; valida: boolean; solicitada: string; inicio: string | null; fin: string | null; periodo_orion: string };
type Report = {
  mes: string; dias_mes: number; estado_mes: string; marca_parcial: boolean;
  captura: null | { id: number; origen: string; estado: string; valida: boolean; periodo_orion: string; inicio: string | null; fin: string | null; motivos_invalidez: string[]; advertencias: string[]; hash: string; integridad_verificada: boolean; seleccionada: boolean; seleccion: { fecha: string } | null; conteos: { total: number; ok: number; sin_datos: number; error: number; no_consultados: number } };
  dias: DayInfo[]; resumen: Summary[]; nodos: NodeRow[]; capturas: CaptureItem[]; selecciones: { id_seleccion: number; id_captura: number; id_captura_anterior: number | null; fecha: string; motivo: string }[];
};
type CaptureStatus = { id: number; estado: string; valida: boolean; avance: { consultados: number; total: number | null }; mensaje_error: string | null; motivos_invalidez: string[] };

const STATE_LABELS: Record<string, string> = {
  oficial: 'Oficial', vigente: 'Vigente', provisional: 'Provisional', parcial: 'Parcial', no_validada: 'No validada',
  no_seleccionada: 'Captura no seleccionada', no_disponible: 'No disponible',
};
const STATE_HELP: Record<string, string> = {
  oficial: 'Captura completa y validada; el periodo para reemplazarla terminó.',
  vigente: 'Última captura completa y validada. Puede sustituirla otra captura validada hasta que termine el mes siguiente.',
  provisional: 'Mes en curso: «This Month» de Orion. Cambiará hasta que termine el mes.',
  parcial: 'Solo hay capturas parciales de este mes; no es una cifra oficial.',
  no_validada: 'Hay una captura completa que no pasó la validación; no es una cifra oficial.',
  no_seleccionada: 'Esta captura no es la seleccionada para el mes.',
  no_disponible: 'No existe ninguna captura de este mes.',
};
const localTime = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
const BASE = '/monitoreo/disponibilidad/reporte-mensual';

function previousMonth(): string {
  // Orion's local time is UTC-6.
  const now = new Date(Date.now() - 6 * 3600 * 1000);
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
function errorText(reason: unknown, fallback: string): string {
  if (!(reason instanceof ApiError)) return reason instanceof Error ? reason.message : fallback;
  if (reason.status === 0) return 'No se pudo conectar con SIALU API.';
  if (reason.status === 401 || reason.status === 419) return 'Tu sesión de SIALU expiró. Vuelve a iniciar sesión.';
  if (reason.status === 403) return 'Solo un administrador puede solicitar capturas.';
  return reason.message || fallback;
}
const percent = (value: string | null) => value === null ? 'Sin datos' : `${value} %`;
const counts = (s: Summary) => [`${s.incluidos} de ${s.total_nodos} incluidos`, s.sin_datos ? `${s.sin_datos} sin datos` : '', s.con_error ? `${s.con_error} con error` : '', s.no_consultados ? `${s.no_consultados} no consultados` : ''].filter(Boolean).join(' · ');

function DayCell({ value, info }: { value: number | null | undefined; info: DayInfo | undefined }) {
  if (info?.cobertura === 'FUTURO') return <td className="omd-day is-future">–</td>;
  if (value === null || value === undefined) return <td className="omd-day is-sd" title={info?.motivo ?? 'Sin cobertura demostrada'}>s/d</td>;
  return <td className={`omd-day ${value ? 'is-hit' : 'is-zero'}`}>{value}</td>;
}

/** Orion → Reporte mensual: stored captures of «Availability Statistics» by area, group and node. */
export default function OrionMonthlyAvailability() {
  const { session } = useAuth();
  const isAdmin = session?.data.TipoUsuario.trim().toUpperCase() === 'ADMINISTRADOR';
  const [month, setMonth] = useState(previousMonth);
  const [captureId, setCaptureId] = useState<number | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState<CaptureStatus | null>(null);
  const [notice, setNotice] = useState('');
  const [exporting, setExporting] = useState(false);
  const poll = useRef<number | null>(null);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true); setError('');
    const query = captureId === null ? '' : `?captura=${captureId}`;
    request<{ data: Report }>(`${BASE}/meses/${month}${query}`, { signal })
      .then(data => setReport(data.data))
      .catch(reason => { if (!signal?.aborted) { setReport(null); setError(errorText(reason, 'No se pudo obtener el reporte.')); } })
      .finally(() => { if (!signal?.aborted) setLoading(false); });
  }, [month, captureId]);

  useEffect(() => { const c = new AbortController(); load(c.signal); return () => c.abort(); }, [load]);
  useEffect(() => () => { if (poll.current) window.clearInterval(poll.current); }, []);

  // A capture already pending or running (e.g. requested by the scheduler) is followed too.
  useEffect(() => {
    request<{ data: { en_curso: number | null } }>(`${BASE}/capturas?mes=${month}`)
      .then(data => { if (data.data.en_curso) follow(data.data.en_curso); })
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function follow(id: number) {
    if (poll.current) window.clearInterval(poll.current);
    const tick = () => request<{ data: CaptureStatus }>(`${BASE}/capturas/${id}`).then(data => {
      setRunning(data.data);
      if (!['pendiente', 'en_proceso'].includes(data.data.estado)) {
        if (poll.current) window.clearInterval(poll.current);
        poll.current = null;
        setNotice(`Captura ${id} terminada: ${data.data.estado}${data.data.valida ? ', validada' : ''}.`);
        load();
      }
    }).catch(() => undefined);
    tick();
    poll.current = window.setInterval(tick, 5000);
  }

  function requestCapture() {
    setNotice(''); setError('');
    request<{ data: CaptureStatus }>(`${BASE}/capturas`, { method: 'POST' })
      .then(data => follow(data.data.id))
      .catch(reason => {
        if (reason instanceof ApiError && reason.status === 409) { setNotice('Ya hay una captura pendiente o en proceso; se muestra su avance.'); request<{ data: { en_curso: number | null } }>(`${BASE}/capturas?mes=${month}`).then(d => { if (d.data.en_curso) follow(d.data.en_curso); }); return; }
        setError(errorText(reason, 'No se pudo solicitar la captura.'));
      });
  }

  // The PDF is produced only here, on demand, from the stored capture shown on screen (same month and capture).
  async function exportPdf() {
    if (!report?.captura || report.mes !== month || (captureId !== null && report.captura.id !== captureId)) return;
    const { mes } = report;
    const id = report.captura.id;
    setExporting(true); setError('');
    try {
      const response = await fetch(`/api/v1${BASE}/meses/${mes}/pdf?captura=${id}`, { credentials: 'same-origin', headers: { Accept: 'application/pdf' } });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || `Error HTTP ${response.status}`);
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `disponibilidad-orion-${mes}-captura-${id}.pdf`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (reason) {
      setError(reason instanceof Error ? `No se pudo exportar el PDF: ${reason.message}` : 'No se pudo exportar el PDF.');
    } finally { setExporting(false); }
  }

  const days = report ? Array.from({ length: report.dias_mes }, (_, i) => i + 1) : [];
  const info = new Map(report?.dias.map(d => [d.dia, d]) ?? []);
  const general = report?.resumen.find(s => s.nivel === 'GENERAL');
  const groupKey = (area: string | null, grupo: string | null) => `${area ?? '\0'}\u001f${grupo ?? '\0'}`;
  const nodesByGroup = new Map<string, NodeRow[]>();
  report?.nodos.forEach(n => { const k = groupKey(n.area, n.grupo); nodesByGroup.set(k, [...(nodesByGroup.get(k) ?? []), n]); });
  const running_ = running && ['pendiente', 'en_proceso'].includes(running.estado);

  return <section className="network-admin orion-monthly">
    <header>
      <h1>Reporte mensual de disponibilidad</h1>
      <p>Porcentajes oficiales de Orion «Availability Statistics» por área, grupo y nodo. El reporte se arma solo con capturas guardadas en SIALU; las columnas de días muestran las caídas iniciadas y no modifican el porcentaje.</p>
    </header>

    <div className="omd-toolbar">
      <label>Mes<input type="month" value={month} onChange={e => { setMonth(e.target.value); setCaptureId(null); setNotice(''); }} /></label>
      {report && report.capturas.length > 0 && <label>Captura
        <select value={captureId ?? ''} onChange={e => setCaptureId(e.target.value ? Number(e.target.value) : null)}>
          <option value="">La que corresponde al mes</option>
          {report.capturas.map(c => <option key={c.id} value={c.id}>#{c.id} · {c.estado.toLowerCase()}{c.valida ? ' · validada' : ''} · {c.periodo_orion === 'Last Month' ? 'mes anterior' : 'este mes'} · {c.inicio ? localTime.format(new Date(c.inicio)) : 'sin iniciar'}</option>)}
        </select>
      </label>}
      <button type="button" onClick={exportPdf} disabled={loading || exporting || !report?.captura || report.mes !== month || !report.captura.integridad_verificada}
        title={report?.captura ? `Exporta la captura #${report.captura.id} de ${report.mes}` : 'No hay una captura guardada de este mes'}>{exporting ? 'Exportando PDF…' : 'Exportar PDF'}</button>
      {isAdmin && <button type="button" onClick={requestCapture} disabled={!!running_}>{running_ ? 'Captura en curso…' : 'Solicitar captura'}</button>}
    </div>

    {running_ && <p role="status" className="omd-progress">Captura {running.id} {running.estado === 'pendiente' ? 'pendiente: el programador la iniciará en menos de un minuto' : `en proceso: ${running.avance.consultados} de ${running.avance.total ?? '…'} nodos consultados`}.</p>}
    {notice && <p role="status" className="omd-notice">{notice}</p>}
    {error && <p role="alert" className="omd-error">{error}</p>}
    {loading && <p role="status">Cargando…</p>}

    {report && <>
      <div className={`omd-state is-${report.estado_mes}`}>
        <strong>{STATE_LABELS[report.estado_mes] ?? report.estado_mes}</strong>
        {report.marca_parcial && <span className="omd-partial">PARCIAL — no oficial</span>}
        <span>{STATE_HELP[report.estado_mes]}</span>
      </div>
      {report.captura && <dl className="omd-meta">
        <div><dt>Captura</dt><dd>#{report.captura.id} ({report.captura.origen.toLowerCase()}) · {report.captura.inicio ? localTime.format(new Date(report.captura.inicio)) : '—'} · periodo de Orion «{report.captura.periodo_orion}»</dd></div>
        <div><dt>Nodos</dt><dd>{report.captura.conteos.total} · incluidos {report.captura.conteos.ok} · sin datos {report.captura.conteos.sin_datos} · con error {report.captura.conteos.error} · no consultados {report.captura.conteos.no_consultados}</dd></div>
        <div><dt>Disponibilidad general</dt><dd><strong>{general ? percent(general.disponibilidad) : '—'}</strong></dd></div>
        <div><dt>Integridad</dt><dd>{report.captura.integridad_verificada ? `Verificada · SHA-256 ${report.captura.hash.slice(0, 16)}…` : <span className="omd-error">El contenido no coincide con su hash</span>}</dd></div>
        {report.captura.seleccion && <div><dt>Selección</dt><dd>Seleccionada el {localTime.format(new Date(report.captura.seleccion.fecha))}</dd></div>}
        {report.captura.motivos_invalidez.length > 0 && <div><dt>No validada por</dt><dd>{report.captura.motivos_invalidez.join(' ')}</dd></div>}
      </dl>}

      {report.captura && <>
        <p className="omd-legend">Columnas 1–{report.dias_mes}: caídas iniciadas ese día (hora local de Orion, UTC-6). <b>0</b>: sin caídas, con cobertura de eventos demostrada. <i>s/d</i>: sin cobertura demostrada. «–»: el día aún no ocurría. Las filas de resumen suman las caídas iniciadas de sus nodos y promedian sus nodos incluidos.</p>
        <div className="omd-table-wrap"><table className="omd-table">
          <thead><tr><th className="omd-sticky omd-c1">Área</th><th className="omd-sticky omd-c2">Grupo</th><th className="omd-sticky omd-c3">Nodo</th>{days.map(d => <th key={d} className="omd-day" title={info.get(d)?.motivo ?? info.get(d)?.fuente ?? ''}>{d}</th>)}<th className="omd-pct">Disponibilidad mensual</th></tr></thead>
          <tbody>
            {report.resumen.filter(s => s.nivel !== 'GENERAL').map(s => <Fragment key={s.orden}>
              <tr className={s.nivel === 'AREA' ? 'omd-area' : 'omd-group'}>
                <td className="omd-sticky omd-c1">{s.area ?? 'Sin área'}</td>
                <td className="omd-sticky omd-c2">{s.nivel === 'AREA' ? '' : s.grupo ?? 'Sin grupo'}</td>
                <td className="omd-sticky omd-c3">{s.nivel === 'AREA' ? 'Resumen del área' : 'Resumen del grupo'} · caídas iniciadas<small>{counts(s)}</small></td>
                {days.map(d => <DayCell key={d} value={s.caidas_por_dia[String(d)]} info={info.get(d)} />)}
                <td className="omd-pct">{percent(s.disponibilidad)}</td>
              </tr>
              {s.nivel === 'GRUPO' && (nodesByGroup.get(groupKey(s.area, s.grupo)) ?? []).map(n => <tr key={n.node_id}>
                <td className="omd-sticky omd-c1">{n.area ?? 'Sin área'}</td>
                <td className="omd-sticky omd-c2">{n.grupo ?? 'Sin grupo'}</td>
                <td className="omd-sticky omd-c3" title={n.motivo ?? ''}>{n.nombre ?? 'Nodo sin nombre'} <small>#{n.node_id}</small></td>
                {days.map(d => <DayCell key={d} value={n.dias[String(d)]} info={info.get(d)} />)}
                <td className="omd-pct">{n.estado === 'ok' ? `${n.disponibilidad} %` : n.estado === 'sin_datos' ? <i>Sin datos</i> : <span className="omd-error" title={n.motivo ?? ''}>{n.estado === 'error' ? 'Error' : 'No consultado'}</span>}</td>
              </tr>)}
            </Fragment>)}
          </tbody>
        </table></div>
      </>}

      {report.selecciones.length > 0 && <details className="omd-history"><summary>Historial de selección ({report.selecciones.length})</summary>
        <ul>{report.selecciones.map(s => <li key={s.id_seleccion}>{localTime.format(new Date(s.fecha))}: captura #{s.id_captura}{s.id_captura_anterior ? ` (reemplaza a #${s.id_captura_anterior})` : ''}. {s.motivo}</li>)}</ul>
      </details>}
    </>}
  </section>;
}
