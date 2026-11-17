import './ingestion.css';

export type FreshnessState = 'aun_sin_datos' | 'sin_lotes' | 'ultimo_intento_fallido' | 'retrasada' | 'al_dia';
export interface Freshness {
  flujo: string; nombre: string; estado: FreshnessState; retrasada: boolean; ultimo_intento_fallido: boolean;
  ultimo_intento: { estado: string; fecha: string } | null; ultima_consulta_exitosa: string | null; ultimo_evento: string | null;
  antiguedad_minutos: number | null; umbral_minutos: number; instalado: boolean; intento_compartido: boolean; cursor: 'ausente' | 'presente' | 'invalido';
  /** Start of SIALU's history after a data reset; nothing earlier is considered. */
  inicio_historial: string | null;
}

export const utc = (value: string | null | undefined) => value ? `${value} UTC` : null;

export function duration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 48 * 60) return `${Math.round(minutes / 60)} h`;
  return `${Math.round(minutes / 1440)} días`;
}

const labels: Record<FreshnessState, string> = {
  aun_sin_datos: 'Aún sin datos', al_dia: 'Al día', retrasada: 'Ingesta retrasada', ultimo_intento_fallido: 'Último intento fallido', sin_lotes: 'Sin intentos registrados',
};

/** Message that never presents a failed attempt as current data. */
export function freshnessMessage(f: Freshness): string {
  const success = f.ultima_consulta_exitosa
    ? `Última consulta exitosa: ${utc(f.ultima_consulta_exitosa)}${f.antiguedad_minutos !== null ? ` (hace ${duration(f.antiguedad_minutos)})` : ''}.`
    : f.inicio_historial ? `No hay ninguna consulta exitosa desde el inicio del historial (${utc(f.inicio_historial)}).` : 'No hay ninguna consulta exitosa registrada.';
  switch (f.estado) {
    case 'aun_sin_datos':
      return `Aún sin datos. El historial de SIALU comienza el ${utc(f.inicio_historial)} y todavía no hay ninguna ingesta desde esa fecha.`;
    case 'sin_lotes':
      return f.ultimo_evento
        ? `SIALU no tiene intentos de ingesta registrados para este flujo. Los eventos guardados (el último del ${utc(f.ultimo_evento)}) se cargaron sin lote asociado, así que no indican si la fuente se sigue consultando.`
        : 'SIALU no tiene intentos de ingesta registrados ni eventos guardados para este flujo.';
    case 'ultimo_intento_fallido':
      return `El último intento (${utc(f.ultimo_intento?.fecha)}) falló y es posterior a la última consulta exitosa. Los datos mostrados no están actualizados por ese intento. ${success}`;
    case 'retrasada':
      return `${success} Supera el umbral de ${duration(f.umbral_minutos)}; lo ocurrido después puede faltar.`;
    default:
      return `${success} Dentro del umbral de ${duration(f.umbral_minutos)}.`;
  }
}

export function FreshnessBadge({ state }: { state: FreshnessState }) {
  return <span className={`ingestion-badge ${state}`}>{labels[state]}</span>;
}

export function FreshnessPanel({ freshness }: { freshness: Freshness }) {
  const f = freshness;
  return <div className={`ingestion-freshness ${f.estado}`} role={f.estado === 'al_dia' ? undefined : 'status'}>
    <div className="ingestion-freshness-head"><strong>{f.nombre}</strong><FreshnessBadge state={f.estado} /></div>
    <p>{freshnessMessage(f)}</p>
    <dl>
      <dt>Último intento</dt><dd>{f.ultimo_intento ? `${f.ultimo_intento.estado} · ${utc(f.ultimo_intento.fecha)}` : 'Sin registros'}</dd>
      <dt>Última consulta exitosa</dt><dd>{utc(f.ultima_consulta_exitosa) ?? 'Sin registros'}</dd>
      <dt>Último evento guardado</dt><dd>{utc(f.ultimo_evento) ?? 'Ninguno'}</dd>
      {f.inicio_historial && <><dt>Inicio del historial</dt><dd>{utc(f.inicio_historial)}</dd></>}
    </dl>
    {f.intento_compartido && f.ultimo_intento && <small>Palo Alto registra un solo intento para THREAT y TRAFFIC; el intento no indica cuál de los dos flujos falló.</small>}
    {f.cursor === 'invalido' && <small>El archivo de avance de este flujo no se pudo interpretar; no se usa como evidencia.</small>}
  </div>;
}
