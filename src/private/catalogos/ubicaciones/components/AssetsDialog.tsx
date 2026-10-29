import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import CatalogList from '../../../../components/catalogos/CatalogList.tsx';
import { request } from '../../../../services/api.ts';
import type { Asset, AssetFilters, Inspection, LocationOverview } from '../types.ts';

interface Props { inspection: Inspection; overview: LocationOverview; onClose: () => void }
export default function AssetsDialog({ inspection, overview, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [filters, setFilters] = useState<AssetFilters>(inspection.filters);
  const [items, setItems] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => !!value) as [string, string][]).toString();
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    request<{ data: Asset[] }>(`/catalogos/ubicaciones/activos?${query}`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setItems(result.data); })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'No se pudieron cargar los equipos.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, revision]);
  return <><style>{styles}</style><dialog ref={dialog} className="location-assets" aria-labelledby="location-assets-title" onCancel={onClose}>
    <header><div><h2 id="location-assets-title">{inspection.title}</h2><p>Clasificaciones asignadas a cada equipo. Esta vista es de consulta.</p></div>
      <button type="button" aria-label="Cerrar equipos asociados" onClick={onClose}><X size={19} /></button></header>
    <div className="location-assets-body">
      <div className="location-asset-filters">
        {([{ key: 'area', label: 'Área', catalog: 'areas', missing: 'grupo' }, { key: 'campus', label: 'Ubicación', catalog: 'campus', missing: 'campus' }] as const).map(field =>
          <label key={field.key}>{field.label}<select disabled={filters.pendiente === field.missing || !!inspection.filters[field.key]} value={filters[field.key] || ''} onChange={event => setFilters(value => ({ ...value, [field.key]: event.target.value }))}>
            <option value="">{filters.pendiente === field.missing ? 'Sin asignar' : 'Todos'}</option>
            {overview[field.catalog].map(item => <option key={item.id} value={item.id}>{item.nombre}{item.vigente ? '' : ' (inactivo)'}</option>)}
          </select></label>)}
      </div>
      <CatalogList key={query} items={items} loading={loading} error={error} onRetry={() => setRevision(value => value + 1)}
        getKey={item => item.id} getTitle={item => item.nombre} getSubtitle={item => item.hostname && item.hostname !== item.nombre ? item.hostname : ''}
        getSearchText={item => `${item.nombre} ${item.hostname} ${item.grupo || ''} ${item.campus || ''}`}
        isActive={item => item.vigente} details={[
          { key: 'grupo', label: 'Área', value: item => item.grupo || 'Sin asignar' },
          { key: 'campus', label: 'Ubicación', value: item => item.campus || 'Sin asignar' },
        ]} labels={{ title: 'Equipos asociados', singular: 'equipo', plural: 'equipos', empty: 'No hay equipos que coincidan', search: 'Buscar equipos' }} />
    </div>
  </dialog></>;
}
const styles = `
.location-assets{width:1100px;max-width:calc(100vw - 32px);max-height:90svh;padding:0;border:1px solid var(--palette-editorialControlBorder);border-radius:16px;background:var(--palette-white);color:var(--palette-text);font:inherit}
.location-assets::backdrop{background:rgba(27,19,32,.32)}
.location-assets>header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:22px 28px;border-bottom:1px solid var(--palette-editorialBorder)}
.location-assets h2{margin:0 0 8px;font-size:19px;font-weight:600}
.location-assets header p{margin:0;color:var(--palette-muted);font-size:12px;line-height:1.6}
.location-assets header button{display:grid;place-items:center;width:40px;height:40px;flex-shrink:0;border:0;background:transparent;color:var(--palette-muted);cursor:pointer;border-radius:50%}
.location-assets-body{padding:24px 28px}
.location-asset-filters{display:flex;gap:18px;flex-wrap:wrap;margin-bottom:24px}
.location-asset-filters label{flex:1 1 180px;font-size:12px;color:var(--palette-muted)}
.location-asset-filters select{display:block;width:100%;padding:10px;margin-top:7px;background:var(--palette-white);border:1px solid var(--palette-editorialControlBorder);border-radius:8px;color:var(--palette-text);font:inherit}
.location-asset-filters select:disabled{background:var(--palette-editorialSurface)}
@media(max-width:600px){.location-assets>header,.location-assets-body{padding:20px}}
`;
