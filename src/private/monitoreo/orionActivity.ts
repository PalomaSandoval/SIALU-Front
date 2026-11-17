// Orion DOWN/UP events and polling, shared by the events history (Eventos Down/Up) and the dashboard summary.
// The API proves the Orion.Events read before presenting events as current; these helpers never add certainty it lacks.
import { useEffect, useState } from 'react';
import { request } from '../../services/api.ts';

export type ActivityEvent = {
  id: number; fecha: string; tipo: 'DOWN' | 'UP'; activo: { id: number; nombre: string | null }; nodo: string | null;
  abrio_caida: boolean | null; recuperado_en: string | null; recuperacion: boolean; caido_desde: string | null;
};
export type DeviceActivityData = {
  fecha: string | null; verificado: boolean; motivo: string | null; desde: string | null; hasta: string | null;
  eventos: ActivityEvent[] | null; truncado: boolean; caidas_abiertas: { activo_id: number; nodo: string; desde: string }[];
  leido_desde: string | null; leido_hasta: string | null; ultimo_intento: { estado: string; fecha: string } | null;
};
type StatusDevice = { id: number; estado: 'EN_LINEA' | 'CAIDO' | 'SIN_ESTADO'; nodos: { nodo: string }[] };
/** Current device state (GET /monitoreo/dispositivos/estado); `verificado` is false for failed, stale or incomplete polls. */
export type DeviceStatusData = { verificado: boolean; motivo: string | null; consultado_en: string | null; equipos: StatusDevice[] | null; fecha: string | null };

export const parse = (value: string) => new Date(value.replace(' ', 'T') + 'Z');
const localFormat = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const localTime = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit' });
const utcFormat = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'UTC' });
const sameLocalDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** Local time; the day is added only when it is not today. */
export function localStamp(value: string, now = new Date()) {
  const date = parse(value);
  return sameLocalDay(date, now) ? localTime.format(date) : localFormat.format(date);
}
export const utcStamp = (value: string) => `${utcFormat.format(parse(value))} UTC`;
export const fullLocal = (value: string) => localFormat.format(parse(value));

export function duration(from: string, to: string | Date) {
  const minutes = Math.max(0, Math.round(((to instanceof Date ? to : parse(to)).getTime() - parse(from).getTime()) / 60000));
  if (minutes < 1) return 'menos de 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h${minutes % 60 ? ` ${minutes % 60} min` : ''}`;
  return `${Math.floor(hours / 24)} d${hours % 24 ? ` ${hours % 24} h` : ''}`;
}

export const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;
export const assetName = (event: ActivityEvent) => event.activo.nombre ?? `Activo ${event.activo.id}`;

/**
 * Node/asset pairs whose open DOWN is confirmed as still down right now: the Orion.Events read is current
 * (the caller passes `eventsCurrent` only then) AND the latest verified status poll reports that asset Down on that node.
 * Without both, an open DOWN is only "Sin Up registrado".
 */
export function confirmedDown(eventsCurrent: boolean, status: DeviceStatusData | null) {
  const keys = new Set<string>();
  if (!eventsCurrent || !status?.verificado || status.fecha || !status.equipos) return keys;
  for (const device of status.equipos) {
    if (device.estado === 'CAIDO') device.nodos.forEach(node => keys.add(`${device.id}:${node.nodo}`));
  }
  return keys;
}

export type RowState = { tone: 'down' | 'recovery' | 'up' | 'repeat'; label: string; note: string | null; detail: string; stillDown?: true };

/** Short Spanish wording for one event; `detail` is the longer explanation for the history page. */
export function rowState(event: ActivityEvent, confirmed: Set<string>, now = new Date()): RowState {
  if (event.tipo === 'UP') {
    if (event.recuperacion && event.caido_desde) {
      return { tone: 'recovery', label: 'Se recuperó', note: `caído ${duration(event.caido_desde, event.fecha)}`,
        detail: `Cerró la caída registrada desde ${utcStamp(event.caido_desde)}.` };
    }
    return { tone: 'up', label: 'Orion registró Up', note: null,
      detail: 'SIALU no tiene un Down anterior relacionado con este nodo, así que no se cuenta como recuperación.' };
  }
  if (!event.abrio_caida) {
    return { tone: 'repeat', label: 'Caída repetida', note: null, detail: 'El nodo ya estaba caído en SIALU cuando Orion volvió a informar Down.' };
  }
  if (event.recuperado_en) {
    return { tone: 'down', label: 'Caída', note: `duró ${duration(event.fecha, event.recuperado_en)}`,
      detail: `Volvió a Up el ${utcStamp(event.recuperado_en)}.` };
  }
  if (event.nodo && confirmed.has(`${event.activo.id}:${event.nodo}`)) {
    return { tone: 'down', label: 'Caída', note: `sigue caído · ${duration(event.fecha, now)}`,
      detail: 'Sin Up posterior, y la última consulta de estado de Orion lo informa Down.', stillDown: true };
  }
  return { tone: 'down', label: 'Caída', note: 'sin Up registrado',
    detail: 'No hay Up posterior registrado, pero la lectura actual de Orion no permite confirmar que siga caído.' };
}

/** Why the current activity is not shown. Stale or failed reads are never shown as current. */
export function activityProblem(data: { motivo: string | null; leido_hasta: string | null; ultimo_intento: { estado: string; fecha: string } | null }) {
  const read = data.leido_hasta ? ` Última lectura válida: ${fullLocal(data.leido_hasta)} (hace ${duration(data.leido_hasta, new Date())}).` : '';
  switch (data.motivo) {
    case 'consulta_fallida':
      return { title: 'Falló la ingesta de Orion', text: `El último intento${data.ultimo_intento ? ` (${fullLocal(data.ultimo_intento.fecha)})` : ''} no se completó.${read}` };
    case 'lectura_desactualizada': return { title: 'Ingesta de Orion retrasada', text: `Los eventos no se han leído recientemente.${read}` };
    case 'sin_lectura_verificada': return { title: 'Sin lectura verificada', text: 'Todavía no hay una lectura completa y verificable de los eventos DOWN/UP de Orion.' };
    case 'sin_fuente': return { title: 'Orion no configurado', text: 'La fuente Orion no está configurada en el servidor.' };
    case 'fuente_inactiva': return { title: 'Orion inactivo', text: 'La fuente Orion no está vigente.' };
    default: return { title: 'Actividad no disponible', text: 'La actividad de Orion no está disponible.' };
  }
}

/** How often the card and the status used for "Siguen caídos" are re-read. */
export const REFRESH_MS = 60_000;
/** A response older than this on the client (e.g. a throttled background tab) is no longer shown as current. */
export const CLIENT_MAX_AGE_MS = 3 * REFRESH_MS;

/**
 * Re-reads `path` every REFRESH_MS and when the tab becomes visible again. Each response replaces the previous one,
 * so the API's own freshness verdict (`verificado`) always applies. A failed read drops the data instead of keeping
 * an older answer, and `current` turns false when the last answer is older than CLIENT_MAX_AGE_MS.
 */
export function usePolling<T>(path: string, failure: string) {
  const [state, setState] = useState<{ data: T | null; error: string; at: number | null }>({ data: null, error: '', at: null });
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const controller = new AbortController();
    request<{ data: T }>(path, { signal: controller.signal })
      .then(result => setState({ data: result.data, error: '', at: Date.now() }))
      .catch(reason => { if (!controller.signal.aborted) setState({ data: null, error: reason instanceof Error ? reason.message : failure, at: null }); });
    return () => controller.abort();
  }, [path, failure, tick]);
  useEffect(() => {
    const refresh = () => { setNow(Date.now()); setTick(value => value + 1); };
    const timer = window.setInterval(refresh, REFRESH_MS);
    const clock = window.setInterval(() => setNow(Date.now()), 15_000);
    const visible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', visible);
    return () => { window.clearInterval(timer); window.clearInterval(clock); document.removeEventListener('visibilitychange', visible); };
  }, []);
  const current = state.at !== null && now - state.at <= CLIENT_MAX_AGE_MS;
  return { data: current ? state.data : null, error: state.error, updatedAt: current ? state.at : null, now: new Date(now),
    loading: !state.error && !current, retry: () => setTick(value => value + 1) };
}

/** Current device state, used only to confirm "Sigue caído". Failures or late answers give `null` (nothing is confirmed). */
export function useCurrentStatus() {
  return usePolling<DeviceStatusData>('/monitoreo/dispositivos/estado', 'No se pudo consultar el estado de Orion.').data;
}
