import { AlertTriangle, CircleCheck, CircleX, Repeat } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  activityProblem, confirmedDown, duration, fullLocal, parse, useCurrentStatus, usePolling,
  type ActivityEvent, type DeviceActivityData,
} from './orionActivity.ts';

const HISTORY_PATH = '/servicios/orion/disponibilidad';
const WINDOW_MS = 24 * 3600_000;
/** Past this age the last valid ingest is flagged as late (the API stops verifying it later, at its own limit). */
const LATE_MS = 5 * 60_000;
const OPEN_VISIBLE = 2;
const INTERMITTENT_VISIBLE = 4;
const LOG_VISIBLE = 8;
/** A DOWN closed by its UP in less than this is one row ("se cayó y volvió en menos de 1 min"). */
const BLIP_MS = 60_000;
/** Names longer than this lose their domain suffix in the card (the full name stays in the tooltip). */
const LONG_NAME = 24;

/** A device that is down right now (open interval with no recovery), earliest start across its nodes. */
type OpenDevice = { deviceId: number; name: string; start: Date; confirmed: boolean };
type LogKind = 'down' | 'blip' | 'recovered' | 'up';
/** One log row: events of the same device, kind and minute, merged (e.g. several nodes of one device). */
type LogRow = { key: string; deviceId: number; name: string; kind: LogKind; at: Date; downFor: number; ordinal: number };

const ms = (value: string) => parse(value).getTime();
const iso = (date: Date) => date.toISOString();
const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
/** "2:10 p.m.", 12-hour local clock. */
const clock = (date: Date) =>
  `${date.getHours() % 12 || 12}:${String(date.getMinutes()).padStart(2, '0')} ${date.getHours() < 12 ? 'a.m.' : 'p.m.'}`;
/** "hoy", "ayer" or "9 nov", by local calendar day. */
function dayLabel(date: Date, now: Date) {
  const days = Math.round((new Date(now).setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86_400_000);
  return days === 0 ? 'hoy' : days === 1 ? 'ayer' : `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}
/** "2:10 p.m." today, "ayer 5:00 p.m." or "9 nov 5:00 p.m." otherwise. */
function when(date: Date, now: Date) {
  const day = dayLabel(date, now);
  return day === 'hoy' ? clock(date) : `${day} ${clock(date)}`;
}
/** "21 h", "1 d 3 h", "menos de 1 min". */
const elapsed = (millis: number) => duration('1970-01-01 00:00:00.000', new Date(Math.max(0, millis)));
/** "a", "a y b", "a, b y c". */
const joinNames = (items: string[]) => items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
/** Drops the domain suffix ("dsidr1.corp.local" → "dsidr1") only when the full name is too long for the row. */
const shortName = (name: string) => name.length > LONG_NAME && name.includes('.') ? name.slice(0, name.indexOf('.')) : name;

function deviceNames(events: ActivityEvent[]) {
  const names = new Map<number, string>();
  for (const event of events) if (event.activo.nombre && !names.has(event.activo.id)) names.set(event.activo.id, event.activo.nombre);
  return (id: number) => names.get(id) ?? `Activo ${id}`;
}

function openDevices(data: DeviceActivityData, confirmed: Set<string>, name: (id: number) => string): OpenDevice[] {
  const byDevice = new Map<number, OpenDevice>();
  for (const open of data.caidas_abiertas) {
    const start = parse(open.desde);
    const isConfirmed = confirmed.has(`${open.activo_id}:${open.nodo}`);
    const current = byDevice.get(open.activo_id);
    if (!current) byDevice.set(open.activo_id, { deviceId: open.activo_id, name: name(open.activo_id), start, confirmed: isConfirmed });
    else byDevice.set(open.activo_id, { ...current, start: start < current.start ? start : current.start, confirmed: current.confirmed || isConfirmed });
  }
  return [...byDevice.values()].sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Orion events of the window as log rows, newest first. Only DOWNs that opened an interval are outages (a repeated DOWN
 * of a node already down is not shown). A DOWN closed in under BLIP_MS becomes one "blip" row and its UP is hidden.
 * `ordinal` numbers each device's outages (down and blip rows) in the window, oldest first.
 */
function logRows(events: ActivityEvent[], windowStart: number, name: (id: number) => string): LogRow[] {
  const groups = new Map<string, LogRow>();
  for (const event of events) {
    const at = ms(event.fecha);
    if (at < windowStart) continue;
    let kind: LogKind;
    let downFor = 0;
    if (event.tipo === 'DOWN') {
      if (!event.abrio_caida) continue;
      kind = event.recuperado_en && ms(event.recuperado_en) - at < BLIP_MS ? 'blip' : 'down';
    } else if (event.recuperacion && event.caido_desde) {
      downFor = at - ms(event.caido_desde);
      if (downFor < BLIP_MS) continue;
      kind = 'recovered';
    } else kind = 'up';
    const key = `${event.activo.id}:${kind}:${Math.floor(at / 60_000)}`;
    const current = groups.get(key);
    if (!current) groups.set(key, { key, deviceId: event.activo.id, name: name(event.activo.id), kind, at: new Date(at), downFor, ordinal: 0 });
    else groups.set(key, { ...current, at: at > current.at.getTime() ? new Date(at) : current.at, downFor: Math.max(current.downFor, downFor) });
  }
  const rows = [...groups.values()].sort((a, b) => a.at.getTime() - b.at.getTime());
  const outagesSoFar = new Map<number, number>();
  for (const row of rows) {
    if (row.kind !== 'down' && row.kind !== 'blip') continue;
    row.ordinal = (outagesSoFar.get(row.deviceId) ?? 0) + 1;
    outagesSoFar.set(row.deviceId, row.ordinal);
  }
  return rows.reverse();
}

function LogText({ row }: { row: LogRow }) {
  const device = <strong className="orion-log-name" title={row.name}>{shortName(row.name)}</strong>;
  const repeat = row.ordinal > 1 && <span className="orion-log-repeat"> ({row.ordinal}.ª vez en 24 h)</span>;
  switch (row.kind) {
    case 'down': return <>{device} se cayó.{repeat}</>;
    case 'blip': return <>{device} se cayó y volvió en menos de 1 min.{repeat}</>;
    case 'recovered': return <>{device} se recuperó después de {elapsed(row.downFor)} caído.</>;
    case 'up': return <>Orion reportó {device} arriba.</>;
  }
}

function LogIcon({ kind }: { kind: LogKind }) {
  return kind === 'recovered' || kind === 'up'
    ? <CircleCheck className="orion-log-icon is-ok" size={16} aria-label="Normal" />
    : <CircleX className="orion-log-icon is-down" size={16} aria-label="Caída" />;
}

/** "3 intermitentes en 24 h: A, B y C se cayeron 2 veces cada uno." or "…: A (3 veces), B (2) y 1 más." */
function intermittentText(list: { name: string; count: number }[], atLeast: string) {
  const shown = list.slice(0, INTERMITTENT_VISIBLE);
  const rest = list.length - shown.length;
  const head = `${atLeast}${list.length} ${list.length === 1 ? 'intermitente' : 'intermitentes'} en 24 h: `;
  const sameCount = shown.every(item => item.count === shown[0].count);
  if (sameCount) {
    const names = shown.map(item => shortName(item.name));
    const subject = rest ? `${names.join(', ')} y ${rest} más` : joinNames(names);
    if (list.length === 1) return `${head}${subject} se cayó ${atLeast}${shown[0].count} veces.`;
    return `${head}${subject} se cayeron ${atLeast}${shown[0].count} veces cada uno.`;
  }
  const names = shown.map((item, index) => `${shortName(item.name)} (${atLeast}${item.count}${index === 0 ? ' veces' : ''})`);
  return `${head}${rest ? `${names.join(', ')} y ${rest} más` : joinNames(names)}.`;
}

/**
 * Orion activity of the last 24 h as an event log: who is still down, which devices are intermittent, then the latest
 * events in plain Spanish. Events appear only when the API proves the Orion.Events read is current; otherwise the card
 * says why. Open intervals not confirmed by a recent verified status poll are marked as such.
 */
export default function OrionActivityCard({ eventsOnly = false }: { eventsOnly?: boolean }) {
  const activity = usePolling<DeviceActivityData>('/monitoreo/dispositivos/actividad', 'No se pudo consultar la actividad de Orion.');
  const { data, error, now } = activity;
  const status = useCurrentStatus();

  const verified = data?.verificado ? data : null;
  const events = verified?.eventos ?? [];
  const name = deviceNames(events);
  const rows = logRows(events, now.getTime() - WINDOW_MS, name);
  const confirmed = confirmedDown(!!verified, status);
  const open = verified ? openDevices(verified, confirmed, name) : [];

  const outageCount = new Map<number, { name: string; count: number; last: number }>();
  for (const row of rows) {
    if (row.kind !== 'down' && row.kind !== 'blip') continue;
    const current = outageCount.get(row.deviceId);
    outageCount.set(row.deviceId, { name: row.name, count: (current?.count ?? 0) + 1, last: Math.max(current?.last ?? 0, row.at.getTime()) });
  }
  const intermittent = [...outageCount.values()].filter(item => item.count >= 2).sort((a, b) => b.count - a.count || b.last - a.last);

  const atLeast = verified?.truncado ? '≥' : '';
  const shortWindow = verified?.desde && ms(verified.desde) > now.getTime() - WINDOW_MS + 30 * 60_000;
  const problem = data && !data.verificado ? activityProblem(data) : null;
  const readUntil = data?.leido_hasta ? parse(data.leido_hasta) : null;
  const late = readUntil && now.getTime() - readUntil.getTime() > LATE_MS;

  return <section className="orion-card" aria-labelledby={eventsOnly ? "orion-events-title" : "orion-card-title"} aria-busy={activity.loading}>
    <header className="orion-card-header">
      <div>
        <h2 id={eventsOnly ? "orion-events-title" : "orion-card-title"}>{eventsOnly ? "Eventos recientes de Orion" : "Actividad de Orion"}</h2>
        <p className={`orion-card-scope${late ? ' is-late' : ''}`} role="status">
          Últimas 24 horas{readUntil && <> · {late ? 'datos con retraso, de' : 'datos de'} <time dateTime={iso(readUntil)}>{when(readUntil, now)}</time></>}
        </p>
      </div>
      <Link to={HISTORY_PATH}>Ver historial <span aria-hidden="true">→</span></Link>
    </header>

    {error ? <div className="orion-card-alert is-error" role="alert">
      <p><strong>No se pudo consultar Orion.</strong> {error}</p>
      <button type="button" onClick={activity.retry}>Reintentar</button>
    </div>
      : !data ? <p className="orion-card-note" role="status">Consultando los eventos de Orion…</p>
      : problem ? <div className="orion-card-alert is-warning" role="status">
        <p><strong>{problem.title}.</strong> {problem.text} No se muestran eventos como actuales; el historial conserva lo registrado.</p>
      </div>
      : <>
        {!eventsOnly && (open.length > 0
          ? <section className="orion-down" aria-labelledby="orion-down-title">
            <h3 id="orion-down-title">
              <AlertTriangle size={14} aria-hidden="true" />
              {open.length === 1 ? '1 equipo sigue caído' : `${open.length} equipos siguen caídos`}
            </h3>
            <ul>
              {open.slice(0, OPEN_VISIBLE).map(device => <li key={device.deviceId}>
                <span className="orion-down-name" title={device.name}>{shortName(device.name)}</span>
                <span className="orion-down-since">
                  caído desde <time dateTime={iso(device.start)}>{when(device.start, now)}</time> ({elapsed(now.getTime() - device.start.getTime())})
                  {!device.confirmed && <small title="La última consulta de estado de Orion no confirma que siga caído"> · sin confirmar</small>}
                </span>
              </li>)}
            </ul>
            {open.length > OPEN_VISIBLE && <p className="orion-down-more">y {open.length - OPEN_VISIBLE} más</p>}
          </section>
          : <p className="orion-card-note orion-all-up">Todos los equipos están arriba</p>)}

        {!eventsOnly && intermittent.length > 0 && <p className="orion-intermittent">
          <Repeat size={14} aria-hidden="true" />
          <span>{intermittentText(intermittent, atLeast)}</span>
        </p>}

        <section className="orion-log" aria-labelledby={eventsOnly ? "orion-events-title" : "orion-log-title"}>
          {!eventsOnly && <h3 id="orion-log-title">Últimos eventos</h3>}
          {rows.length
            ? <ol>
              {rows.slice(0, LOG_VISIBLE).map(row => <li key={row.key}>
                <time dateTime={iso(row.at)}>{when(row.at, now)}</time>
                <LogIcon kind={row.kind} />
                <span className="orion-log-text"><LogText row={row} /></span>
              </li>)}
            </ol>
            : <p className="orion-card-note">Sin eventos de Orion en las últimas 24 horas.</p>}
        </section>

        {verified!.truncado && <p className="orion-card-note">Hubo más eventos de los que se pueden mostrar: las cifras son mínimas; el historial tiene el detalle.</p>}
        {shortWindow && <p className="orion-card-note">Actividad comprobada solo desde {fullLocal(verified!.desde!)}.</p>}
      </>}
  </section>;
}
