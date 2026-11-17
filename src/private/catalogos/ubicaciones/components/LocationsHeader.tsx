import { Monitor } from 'lucide-react';
import type { AssetFilters, LocationOverview } from '../types.ts';

interface Props {
  data: LocationOverview | null;
  onInspect: (title: string, filters: AssetFilters) => void;
}
export default function LocationsHeader({ data, onInspect }: Props) {
  return <><style>{styles}</style>
    <header className="location-heading"><div><h1>Ubicaciones y dependencias</h1><p>Consulta áreas organizativas y agrupaciones de origen asociadas a los equipos.</p></div></header>
    <div className="location-summary" aria-label="Clasificación de equipos">
      <button disabled={!data} onClick={() => onInspect('Todos los equipos', {})}><Monitor size={17} /><strong>{data?.resumen.equipos ?? '—'}</strong> equipos</button>
      <button disabled={!data} onClick={() => onInspect('Equipos sin ubicación', { pendiente: 'campus' })}><strong>{data?.resumen.sin_campus ?? '—'}</strong> sin ubicación</button>
      <button disabled={!data} onClick={() => onInspect('Equipos sin área', { pendiente: 'grupo' })}><strong>{data?.resumen.sin_grupo ?? '—'}</strong> sin área</button>
    </div>
  </>;
}
const styles = `
.location-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;margin-bottom:28px}
.private-content .location-heading h1{font-size:24px;font-weight:600;line-height:1.3;letter-spacing:-.02em;margin:0 0 12px}
.location-heading p{margin:0;font-size:13px;line-height:1.7;color:var(--palette-muted)}
.location-summary{display:flex;gap:12px 28px;flex-wrap:wrap;padding:0 0 28px;margin-bottom:24px;border-bottom:1px solid var(--palette-editorialBorder)}
.location-summary button{display:inline-flex;align-items:center;gap:7px;border:0;padding:8px 0;background:transparent;color:var(--palette-muted);font:inherit;font-size:12px;cursor:pointer;text-underline-offset:4px}
.location-summary button:hover{text-decoration:underline}.location-summary strong{color:var(--palette-text);font-size:15px;font-weight:600}
`;
