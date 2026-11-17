import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, FileDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ThreatSeverityPanel from './ThreatSeverityPanel.tsx';
import './monitoreo.css';

const periods = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: '7d', label: '7 días' },
  { value: '30d', label: '30 días' },
  { value: '90d', label: '90 días' },
  { value: 'custom', label: 'Personalizado' },
] as const;

// Threat periods are whole UTC days (same bounds as the API).
const PERIOD_DAYS: Partial<Record<typeof periods[number]['value'], number>> = { '7d': 6, '30d': 29, '90d': 89 };
const utcDay = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);
const shortDate = (value: string) => new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
const range = (from: string, to: string) => from === to ? shortDate(from) : `${shortDate(from)} – ${shortDate(to)}`;

export default function MonitoreoMain() {
  const [params, setParams] = useSearchParams();
  const [periodOpen, setPeriodOpen] = useState(false);
  const periodContainer = useRef<HTMLDivElement>(null);
  const periodTrigger = useRef<HTMLButtonElement>(null);
  const period = periods.find(item => item.value === params.get('periodo')) ?? periods[0];
  const todayUtc = utcDay(0);
  const threatPeriod = { periodo: period.value, desde: params.get('desde'), hasta: params.get('hasta') };
  // The exact UTC days the threat panel counts, so the card never says "hoy" for a different calendar day.
  const from = params.get('desde'), to = params.get('hasta');
  const threatDays = period.value === 'today' ? `hoy, ${shortDate(todayUtc)}`
    : period.value === 'yesterday' ? `ayer, ${shortDate(utcDay(-1))}`
    : period.value === 'custom' ? (from && to ? range(from, to) : 'elige las fechas')
    : range(utcDay(-PERIOD_DAYS[period.value]!), todayUtc);
  const generated = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());

  useEffect(() => {
    if (!periodOpen) return;
    function closeOutside(event: PointerEvent) {
      if (!periodContainer.current?.contains(event.target as Node)) setPeriodOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') { setPeriodOpen(false); periodTrigger.current?.focus(); }
    }
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [periodOpen]);

  function selectPeriod(value: typeof periods[number]['value']) {
    setPeriodOpen(false);
    const next = new URLSearchParams(params);
    if (value === 'today') next.delete('periodo');
    else next.set('periodo', value);
    next.delete('desde');
    next.delete('hasta');
    next.delete('fecha');
    setParams(next);
  }

  function setDate(key: 'desde' | 'hasta', value: string) {
    const next = new URLSearchParams(params);
    next.set('periodo', 'custom');
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next);
  }

  const periodControls = <div className="monitoring-period-controls">
    <div className="monitoring-period-container" ref={periodContainer}>
      <button ref={periodTrigger} type="button" className={`monitoring-period${period.value === 'custom' ? ' is-custom' : ''}`}
        aria-label={`Periodo de Palo Alto: ${period.label}`} aria-expanded={periodOpen} aria-controls="monitoring-period-options"
        onClick={() => setPeriodOpen(value => !value)}>
        <CalendarDays size={17} aria-hidden="true" />
        <span>{period.label}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      {periodOpen && <div className="monitoring-period-options" id="monitoring-period-options" aria-label="Elegir periodo">
        {periods.map(item => <button key={item.value} type="button" className={period.value === item.value ? 'is-selected' : ''}
          aria-pressed={period.value === item.value} onClick={() => selectPeriod(item.value)}>{item.label}</button>)}
      </div>}
    </div>
    {period.value === 'custom' && <div className="monitoring-custom-dates" role="group" aria-label="Fechas del periodo personalizado">
      <label>Desde<input type="date" value={params.get('desde') ?? ''} max={params.get('hasta') ?? undefined} onChange={event => setDate('desde', event.target.value)} /></label>
      <label>Hasta<input type="date" value={params.get('hasta') ?? ''} min={params.get('desde') ?? undefined} onChange={event => setDate('hasta', event.target.value)} /></label>
    </div>}
  </div>;

  return <section className="monitoring-page" aria-labelledby="monitoring-title">
    <header className="monitoring-header">
      <div className="monitoring-heading">
        <h1 id="monitoring-title">Resumen</h1>
        <p className="monitoring-print-only">Generado el {generated} (hora local).</p>
      </div>
      <div className="monitoring-header-actions">
        <button className="monitoring-export" type="button" onClick={() => window.print()}>
          <FileDown size={17} aria-hidden="true" /> Exportar PDF
        </button>
      </div>
    </header>
    <ThreatSeverityPanel period={threatPeriod} scope={threatDays} controls={periodControls} />
  </section>;
}
