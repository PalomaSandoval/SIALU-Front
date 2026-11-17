// Orion → Incidentes (GET /monitoreo/orion/incidentes/*): types, Spanish wording and links shared by the incidents page
// and the dashboard summary. The API decides what is current; these helpers never add certainty it lacks.
import { duration, fullLocal } from '../monitoreo/orionActivity.ts';

export const INCIDENTS_PATH = '/servicios/orion/incidentes';
export const EVENTS_PATH = '/servicios/orion/eventos';
export const PERIOD_HOURS = [6, 12, 24, 48, 72, 168] as const;
export const DEFAULT_HOURS = 24;

type Attempt = { estado: string; fecha: string } | null;
/** Latest Orion.Nodes.Status snapshot: `verificado` only when it is recent, complete and no later poll failed. */
export type StatusContext = { verificado: boolean; motivo: string | null; consultado_en: string | null; ultimo_intento: Attempt };
/** Orion.Events (DOWN/UP) read: `motivo` null only when it is current. */
export type ReadContext = { motivo: string | null; leido_desde: string | null; leido_hasta: string | null; ultimo_intento: Attempt };
type Asset = { id: number; nombre: string | null };

export type OpenNode = {
  nodo: string; correspondencia: 'UNICA' | 'SIN_ACTIVO' | 'AMBIGUA'; activos: Asset[];
  status: number | null; status_nombre: string | null; caido_desde: string | null; motivo_inicio: string | null;
};
export type OpenSummary = {
  nodos_caidos: number; activos_afectados: number; nodos_sin_activo: number; nodos_ambiguos: number;
  con_inicio: number; nodos_sin_estado: number; nodos_consultados: number;
};
export type OpenData =
  | { disponible: false; motivo: string }
  | { disponible: true; generado_en: string; estado: StatusContext; lectura_eventos: ReadContext;
    resumen: OpenSummary | null; vista_previa?: OpenNode[]; nodos: OpenNode[] | null; total: number; page: number; last_page: number };

export type Episode = { id: number; activo_id: number; caida: string; recuperacion: string | null; duracion_segundos: number | null; en_curso: boolean };
export type IntermittentNode = {
  nodo: string; activos: Asset[]; episodios: number; estado_actual: 'EN_LINEA' | 'CAIDO' | 'SIN_ESTADO' | 'NO_EN_ORION' | null;
  episodios_detalle: Episode[];
};
export type IntermittentData =
  | { disponible: false; motivo: string; horas: number; desde: string; hasta: string }
  | { disponible: true; horas: number; desde: string; hasta: string; generado_en: string; inicio_periodo: string;
    cobertura: { desde: string | null; hasta: string | null; completa: boolean };
    estado: StatusContext; lectura_eventos: ReadContext; resumen: { nodos_intermitentes: number; episodios: number };
    vista_previa?: Pick<IntermittentNode, 'nodo' | 'activos' | 'episodios'>[];
    nodos: IntermittentNode[] | null; total: number; page: number; last_page: number };

export const periodLabel = (hours: number) => hours % 24 === 0 && hours > 24 ? `${hours / 24} días` : `${hours} horas`;
/** "las últimas 24 horas", "los últimos 7 días". */
export const lastPeriod = (hours: number) => hours % 24 === 0 && hours > 24 ? `los últimos ${hours / 24} días` : `las últimas ${hours} horas`;
export const parseHours = (value: string | null) => {
  const hours = Number(value);
  return (PERIOD_HOURS as readonly number[]).includes(hours) ? hours : DEFAULT_HOURS;
};

const ago = (value: string) => `${fullLocal(value)} (hace ${duration(value, new Date())})`;

/** Why the current node state is not shown. No count is presented as current in these cases. */
export function statusProblem(status: StatusContext) {
  const last = status.consultado_en ? ` Última consulta válida: ${ago(status.consultado_en)}.` : '';
  switch (status.motivo) {
    case 'consulta_fallida':
      return { title: 'Falló la consulta de estado de Orion', text: `El último intento${status.ultimo_intento ? ` (${fullLocal(status.ultimo_intento.fecha)})` : ''} no se completó.${last}` };
    case 'instantanea_desactualizada': return { title: 'Estado de Orion desactualizado', text: `No hay una consulta de estado reciente.${last}` };
    case 'instantanea_incompleta': return { title: 'Consulta de estado incompleta', text: 'La última consulta no contiene todos los nodos que declara.' };
    case 'sin_instantanea': return { title: 'Sin consulta de estado', text: 'Todavía no hay ninguna consulta del estado de los nodos de Orion.' };
    case 'sin_esquema': return { title: 'Estado de nodos no instalado', text: 'Falta instalar el registro del estado de los nodos de Orion.' };
    case 'fuente_inactiva': return { title: 'Orion inactivo', text: 'La fuente Orion no está vigente.' };
    default: return { title: 'Estado no disponible', text: 'El estado actual de los nodos de Orion no está disponible.' };
  }
}

/** Why the Orion.Events read is not current; null when it is. */
export function readProblem(read: ReadContext) {
  const last = read.leido_hasta ? ` Última lectura válida: ${ago(read.leido_hasta)}.` : '';
  switch (read.motivo) {
    case null: return null;
    case 'consulta_fallida': return `Falló la última lectura de eventos de Orion.${last}`;
    case 'lectura_desactualizada': return `Los eventos Down/Up de Orion no se han leído recientemente.${last}`;
    default: return 'Todavía no hay una lectura verificable de los eventos Down/Up de Orion.';
  }
}

/** Why an outage has no known start ("Inicio no registrado"). */
export const startReasons: Record<string, string> = {
  sin_activo: 'El nodo no tiene activo en SIALU y sus eventos Down/Up no se registran.',
  correspondencia_ambigua: 'El NodeID está asociado a varios activos de SIALU.',
  sin_down_registrado: 'SIALU no tiene un Down abierto registrado para este nodo.',
  lectura_eventos_no_actual: 'La lectura de eventos de Orion no está al día; podría faltar una recuperación posterior.',
  lectura_no_continua: 'La lectura de eventos no es continua desde el Down registrado; podría faltar una recuperación.',
};

export function assetLabel(assets: Asset[]) {
  if (!assets.length) return 'Sin activo en SIALU';
  return assets.map(asset => asset.nombre ?? `Activo ${asset.id}`).join(', ');
}

/** "18 min", "2 h 5 min"… from seconds. */
export const seconds = (value: number) => duration('1970-01-01 00:00:00.000', new Date(value * 1000));

/** UTC day (YYYY-MM-DD) of an API timestamp. */
export const utcDay = (value: string | Date) => (value instanceof Date ? value : new Date(value.replace(' ', 'T') + 'Z')).toISOString().slice(0, 10);

/** Events history (whole UTC days) of one node from `from` to today. */
export function eventsLink(node: string, from: string | Date) {
  const params = new URLSearchParams({ q: node, desde: utcDay(from), hasta: utcDay(new Date()) });
  return `${EVENTS_PATH}?${params}`;
}
