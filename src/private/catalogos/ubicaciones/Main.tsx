import { useSearchParams } from 'react-router-dom';
import { Monitor, X } from 'lucide-react';
import CatalogList from '../../../components/catalogos/CatalogList.tsx';
import useLocations from './useLocations.ts';
import { locationDefinitions } from './types.ts';
import type { LocationKind } from './types.ts';
import LocationForm from './components/LocationForm.tsx';
import LocationsHeader from './components/LocationsHeader.tsx';
import AssetsDialog from './components/AssetsDialog.tsx';

export default function LocationsMain() {
  const [params, setParams] = useSearchParams();
  const candidate = params.get('seccion');
  const kind: LocationKind = candidate === 'campus' || candidate === 'unidades-institucionales' ? candidate : 'areas';
  const definition = locationDefinitions[kind];
  const locations = useLocations(kind);
  return <div className="locations-page"><style>{styles}</style>
    <LocationsHeader data={locations.data}
      onInspect={(title, filters) => locations.setInspection({ title, filters })} />
    <div className="location-sections" role="group" aria-label="Catálogo de ubicaciones">
      {(Object.keys(locationDefinitions) as LocationKind[]).map(value => <button key={value} disabled={locations.busy} aria-pressed={kind === value}
        onClick={() => { setParams({ seccion: value }); locations.setActionError(''); locations.setNotice(''); }}>{locationDefinitions[value].title}</button>)}
    </div>
    <button className="location-button primary" disabled={locations.loading || locations.busy || !!locations.error} onClick={() => locations.open()}>{definition.add}</button>
    <p className="location-description">{definition.description}</p>
    {locations.notice && <div className="location-notice" role="status">{locations.notice}<button aria-label="Cerrar aviso" onClick={() => locations.setNotice('')}><X size={17} /></button></div>}
    {locations.actionError && <p className="location-error" role="alert">{locations.actionError}</p>}
    <CatalogList key={kind} items={locations.data?.[kind] || []} loading={locations.loading} busy={locations.busy} error={locations.error} onRetry={locations.retry}
      getKey={item => item.id} getTitle={item => item.nombre} getSubtitle={item => item.descripcion} isActive={item => item.vigente}
      details={[
        { key: 'equipos', label: 'Equipos asociados', value: item => item.equipos },
        { key: 'activos', label: 'Equipos activos', value: item => item.equipos_activos },
      ]}
      actions={[{ key: 'equipos', label: 'Ver equipos', icon: <Monitor size={18} aria-hidden="true" />, onClick: locations.inspect }]}
      onEdit={locations.open} onToggle={locations.toggle}
      labels={{ title: definition.title, singular: definition.singular, plural: definition.title.toLocaleLowerCase(),
        all: definition.feminine ? 'Todas' : 'Todos', active: definition.feminine ? 'Activas' : 'Activos', inactive: definition.feminine ? 'Inactivas' : 'Inactivos',
        activeState: definition.feminine ? 'Activa' : 'Activo', inactiveState: definition.feminine ? 'Inactiva' : 'Inactivo',
        empty: 'No hay registros que coincidan', search: 'Buscar por nombre o descripción' }} />
    <LocationForm kind={kind} draft={locations.draft} busy={locations.busy} error={locations.formError} onChange={locations.setDraft} onSave={locations.save} />
    {locations.inspection && locations.data && <AssetsDialog key={JSON.stringify(locations.inspection)} inspection={locations.inspection} overview={locations.data} onClose={() => locations.setInspection(null)} />}
  </div>;
}
const styles = `
.locations-page{--palette-primary:var(--palette-editorialPrimary);--palette-text:var(--palette-editorialText);--palette-muted:var(--palette-editorialMuted);width:100%;padding:48px;font-family:var(--font-body);font-size:13px;background:var(--palette-editorialSurface);color:var(--palette-text)}
.private-content:has(> .locations-page){padding:0;background:var(--palette-editorialSurface)}
.locations-page *{box-sizing:border-box}
.location-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:10px 18px;border:1px solid var(--palette-editorialControlBorder);border-radius:9px;background:var(--palette-white);color:var(--palette-text);font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.location-button.primary{border-color:var(--palette-primary);background:var(--palette-primary);color:var(--palette-white)}
.location-button:hover{filter:brightness(.95)}
.location-sections{display:flex;gap:24px;flex-wrap:wrap;margin-bottom:16px}
.location-sections button{border:0;border-bottom:3px solid transparent;background:transparent;color:var(--palette-muted);padding:12px 0;font:inherit;font-weight:500;cursor:pointer}
.location-sections button[aria-pressed=true]{color:var(--palette-editorialPrimary);border-bottom-color:var(--palette-tabIndicator);font-weight:700}
.location-description{margin:0 0 28px;color:var(--palette-muted);font-size:12px;line-height:1.7}
.location-help{margin:24px 0 0;color:var(--palette-muted);font-size:12px;line-height:1.7}
.location-error{padding:14px 0;color:var(--palette-errorText);font-size:13px;line-height:1.7}
.location-notice{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px;color:var(--palette-primary);font-size:13px;line-height:1.7}
.location-notice button{display:grid;place-items:center;min-width:40px;min-height:40px;border:0;border-radius:50%;background:transparent;color:var(--palette-muted);cursor:pointer}
.locations-page button:disabled{opacity:.5;cursor:default}
.locations-page button:focus-visible,.locations-page input:focus-visible,.locations-page select:focus-visible,.locations-page textarea:focus-visible{outline:2px solid var(--palette-muted);outline-offset:3px}
@media(max-width:800px){.locations-page{padding:28px 20px}.location-sections{gap:16px}}
`;
