import { Fragment, useCallback, useEffect, useState } from 'react';
import { ApiError, request } from '../../services/api.ts';
import '../catalogos/catalog-admin.css';
import './orion-monthly-availability.css';

type DayInfo = { dia: number; cobertura: 'COMPLETA' | 'SD' | 'FUTURO'; fuente: string | null; captura_origen: number | null; motivo: string | null };
type Summary = { orden: number; nivel: 'GENERAL' | 'AREA' | 'GRUPO'; area: string | null; grupo: string | null; total_nodos: number; incluidos: number; sin_datos: number; con_error: number; no_consultados: number; disponibilidad: string | null; caidas_por_dia: Record<string, number | null> };
type NodeRow = { node_id: number; nombre: string | null; area: string | null; grupo: string | null; estado: 'ok' | 'sin_datos' | 'error' | 'no_consultado'; motivo: string | null; texto_orion: string | null; disponibilidad: string | null; dias: Record<string, number | null> };
type Auto = {
  estado: 'en_curso' | 'programado' | 'listo' | 'en_proceso' | 'reintento' | 'completo' | 'no_recuperable';
  ventana: { desde: string; hasta: string }; intentos_fallidos: number; proximo_intento: string | null; en_riesgo: boolean;
  ultimo_intento: { estado: string; fin: string | null; motivo: string | null } | null;
};
type Report = {
  mes: string; dias_mes: number; estado_mes: 'validado' | 'pendiente' | 'no_recuperable' | 'en_curso'; marca_parcial: boolean; automatico: Auto;
  captura: null | { id: number; estado: string; inicio: string | null; periodo_orion: string; motivos_invalidez: string[]; hash: string; integridad_verificada: boolean; conteos: { total: number; ok: number; sin_datos: number; error: number; no_consultados: number } };
  dias: DayInfo[]; resumen: Summary[]; nodos: NodeRow[];
};
const STATE_LABELS: Record<Report['estado_mes'], string> = {
  validado: 'Completo y validado', pendiente: 'Pendiente', no_recuperable: 'No recuperable', en_curso: 'Mes en curso',
};
const localTime = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
const localDate = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long' });
const when = (iso: string | null) => iso ? localTime.format(new Date(iso)) : '—';
const BASE = '/monitoreo/disponibilidad/reporte-mensual';

// Orion's local time is UTC-6.
function orionMonth(offset: number): string {
  const now = new Date(Date.now() - 6 * 3600 * 1000);
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
function errorText(reason: unknown, fallback: string): string {
  if (!(reason instanceof ApiError)) return reason instanceof Error ? reason.message : fallback;
  if (reason.status === 0) return 'No se pudo conectar con SIALU API.';
  if (reason.status === 401 || reason.status === 419) return 'Tu sesión de SIALU expiró. Vuelve a iniciar sesión.';
  return reason.message || fallback;
}
const percent = (value: string | null) => value === null ? 'Sin datos' : `${value} %`;
const counts = (s: Summary) => [`${s.incluidos} de ${s.total_nodos} incluidos`, s.sin_datos ? `${s.sin_datos} sin datos` : '', s.con_error ? `${s.con_error} con error` : '', s.no_consultados ? `${s.no_consultados} no consultados` : ''].filter(Boolean).join(' · ');

/** What the automatic process is doing for this month, in plain words. */
function stateText(r: Report): string {
  const a = r.automatico;
  // The window closes at the first instant of the month after next; its last day is the day before.
  const lastDay = localDate.format(new Date(new Date(a.ventana.hasta).getTime() - 6 * 3600 * 1000 - 1));
  switch (r.estado_mes) {
    case 'validado':
      return r.captura?.inicio ? `Consultado el ${when(r.captura.inicio)}.` : 'Fecha de consulta no disponible.';
    case 'en_curso':
      return r.captura?.inicio
        ? `Consultado el ${when(r.captura.inicio)}.`
        : 'La consulta de este mes está pendiente.';
    case 'no_recuperable':
      return 'No se obtuvo un resultado completo y validado mientras Orion ofrecía este mes. Orion solo entrega el mes en curso y el anterior, así que ya no se puede recuperar.'
        + (r.captura ? ' Se muestra el mejor resultado parcial guardado; no es una cifra oficial.' : '');
    default: {
      const next = a.estado === 'en_proceso' ? 'La consulta a Orion está en curso.'
        : a.estado === 'listo' ? 'La siguiente consulta empezará en unos minutos.'
        : a.estado === 'programado' ? `La primera consulta será el ${when(a.proximo_intento)}.`
        : `Próximo intento: ${when(a.proximo_intento)}.`;
      return `SIALU todavía no obtiene un resultado completo y validado de este mes y lo reintenta automáticamente. ${next} Orion ofrece este mes hasta el ${lastDay}.`
        + (r.captura ? ' Mientras tanto se muestra el último resultado parcial; no es una cifra oficial.' : '');
    }
  }
}

function DayCell({ value, info }: { value: number | null | undefined; info: DayInfo | undefined }) {
  if (info?.cobertura === 'FUTURO') return <td className="omd-day is-sd">s/d</td>;
  if (value === null || value === undefined) return <td className="omd-day is-sd" title={info?.motivo ?? 'Sin cobertura demostrada'}>s/d</td>;
  return <td className={`omd-day ${value ? 'is-hit' : 'is-zero'}`}>{value}</td>;
}

/** Orion → Reporte mensual: one report per month from Orion «Availability Statistics», by area, group and node. */
export default function OrionMonthlyAvailability() {
  const [month, setMonth] = useState(() => orionMonth(-1));
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const load = useCallback((signal?: AbortSignal, quiet = false) => {
    if (!quiet) { setLoading(true); setError(''); }
    request<{ data: Report }>(`${BASE}/meses/${month}`, { signal })
      .then(data => setReport(data.data))
      .catch(reason => { if (!signal?.aborted && !quiet) { setReport(null); setError(errorText(reason, 'No se pudo obtener el reporte.')); } })
      .finally(() => { if (!signal?.aborted && !quiet) setLoading(false); });
  }, [month]);

  useEffect(() => { const c = new AbortController(); load(c.signal); return () => c.abort(); }, [load]);
  const refresh = useCallback(() => load(undefined, true), [load]);

  // While SIALU is querying Orion for this month, refresh quietly so the report appears when it is ready.
  const working = report?.mes === month && (report.estado_mes === 'en_curso' || ['listo', 'en_proceso'].includes(report.automatico.estado));
  useEffect(() => {
    if (!working) return;
    const id = window.setInterval(refresh, 30000);
    return () => window.clearInterval(id);
  }, [working, refresh]);

  // The PDF is produced only here, on demand, from the stored report shown on screen.
  async function exportPdf() {
    if (!report?.captura || report.mes !== month) return;
    const { mes } = report;
    setExporting(true); setError('');
    try {
      const response = await fetch(`/api/v1${BASE}/meses/${mes}/pdf?captura=${report.captura.id}`, { credentials: 'same-origin', headers: { Accept: 'application/pdf' } });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        if (response.status === 409) load();
        throw new Error(body.message || `Error HTTP ${response.status}`);
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = `disponibilidad-orion-${mes}.pdf`;
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
  const canExport = !!report?.captura && report.mes === month && report.captura.integridad_verificada;

  return <section className="network-admin orion-monthly">
    <header>
      <h1>Reporte mensual de disponibilidad</h1>
    </header>

    <div className="omd-toolbar">
      <label>Mes<input type="month" value={month} max={orionMonth(0)} onChange={e => { if (e.target.value) setMonth(e.target.value); }} /></label>
      <button type="button" onClick={exportPdf} disabled={loading || exporting || !canExport}
        title={canExport ? `Descarga el reporte de ${report?.mes} en PDF` : 'Todavía no hay un reporte de este mes'}>{exporting ? 'Exportando PDF…' : 'Exportar PDF'}</button>
    </div>

    {error && <p role="alert" className="omd-error">{error}</p>}
    {loading && <p role="status">Cargando…</p>}

    {report && report.mes === month && <>
      {report.estado_mes === 'validado' ? <p className="omd-consulted">{stateText(report)}</p> :
        <div className={`omd-state is-${report.estado_mes}${report.automatico.en_riesgo ? ' is-risk' : ''}`} role={report.estado_mes === 'no_recuperable' || report.automatico.en_riesgo ? 'alert' : undefined}>
          <strong>{STATE_LABELS[report.estado_mes]}</strong>
          {report.marca_parcial && <span className="omd-partial">PARCIAL — no oficial</span>}
          <span>{stateText(report)}</span>
          {report.automatico.en_riesgo && <span className="omd-error">Quedan pocos días para obtenerlo: si no se logra antes del cierre, el mes ya no se podrá recuperar.</span>}
        </div>}

      {report.captura && <>
        <dl className="omd-meta">
          <div><dt>Disponibilidad general</dt><dd><strong>{general ? percent(general.disponibilidad) : '—'}</strong></dd></div>
          <div><dt>Periodo de Orion</dt><dd>{report.captura.periodo_orion}</dd></div>
          {!report.captura.integridad_verificada && <div><dt>Integridad</dt><dd className="omd-error">El contenido guardado no coincide con su huella; no se puede exportar.</dd></div>}
        </dl>
        <p className="omd-legend">Cada columna de día muestra las caídas iniciadas en esa fecha (hora local de Orion, UTC-6). <b>0</b>: sin caídas. <i>s/d</i>: datos no disponibles.</p>
        <div className="omd-table-wrap"><table className="omd-table">
          <thead><tr><th className="omd-sticky omd-c1">Área</th><th className="omd-sticky omd-c2">Grupo</th><th className="omd-sticky omd-c3">Nodo</th>{days.map(d => <th key={d} className="omd-day" title={info.get(d)?.motivo ?? ''}>{d}</th>)}<th className="omd-pct">Disponibilidad mensual</th></tr></thead>
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
                <td className="omd-sticky omd-c1" aria-label={`Área: ${n.area ?? 'Sin área'}`} />
                <td className="omd-sticky omd-c2" aria-label={`Grupo: ${n.grupo ?? 'Sin grupo'}`} />
                <td className="omd-sticky omd-c3" title={n.motivo ?? ''}>{n.nombre ?? 'Nodo sin nombre'} <small>#{n.node_id}</small></td>
                {days.map(d => <DayCell key={d} value={n.dias[String(d)]} info={info.get(d)} />)}
                <td className="omd-pct">{n.estado === 'ok' ? `${n.disponibilidad} %` : n.estado === 'sin_datos' ? <i>Sin datos</i> : <span className="omd-error" title={n.motivo ?? ''}>{n.estado === 'error' ? 'Error' : 'No consultado'}</span>}</td>
              </tr>)}
            </Fragment>)}
          </tbody>
        </table></div>
      </>}

    </>}
  </section>;
}
