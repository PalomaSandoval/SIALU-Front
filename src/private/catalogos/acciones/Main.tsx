import { useState } from 'react';
import { X } from 'lucide-react';
import CatalogList from '../../../components/catalogos/CatalogList.tsx';
import useTrafficActions from './useTrafficActions.ts';
import { results } from './types.ts';
import type { Result } from './types.ts';
import TrafficActionForm from './components/TrafficActionForm.tsx';
import MappingForm from './components/MappingForm.tsx';
export default function TrafficActionsMain() {
  const catalog = useTrafficActions();
  const [filter, setFilter] = useState<Result | 'all'>('all');
  const filters = [{value: 'all', label: 'Todas'}, {value: 'BLOQUEADO', label: 'Bloqueadas'}, {value: 'OBSERVADO', label: 'Observadas'}, {value: 'PERMITIDO', label: 'Permitidas'}, {value: 'DESCONOCIDO', label: 'Sin clasificar'}] as const;
  const filtered = catalog.mappings.filter(item => filter === 'all' || item.resultado === filter);
  return <div className="traffic-actions-page"><style>{styles}</style>
    <header className="traffic-actions-heading"><div><h1>Acciones del firewall</h1><p>Consulta qué hizo el firewall con el tráfico de la red: permitirlo, bloquearlo, interrumpir la conexión o generar una alerta.</p></div></header>
    {catalog.notice && <div className="traffic-actions-notice" role="status">{catalog.notice}<button aria-label="Cerrar aviso" onClick={() => catalog.setNotice('')}><X size={17} /></button></div>}
    <div className="traffic-result-filters" role="group" aria-label="Filtrar acciones">
      {filters.map(option => <button key={option.value} aria-pressed={filter === option.value} disabled={catalog.loading} onClick={() => setFilter(option.value)}>{option.label} <span>{catalog.loading ? '—' : catalog.mappings.filter(item => option.value === 'all' || item.resultado === option.value).length}</span></button>)}
    </div>
    <CatalogList columnTitle="Acción recibida" editLabel="Editar" onClearFilters={() => setFilter('all')} items={filtered} loading={catalog.loading} busy={catalog.busy} error={catalog.error} onRetry={catalog.retry}
      getKey={item => item.id} getTitle={item => item.valor} getSubtitle={item => item.fuente.replace(/ XML API$/i, '')}
      getSearchText={item => `${item.valor} ${item.fuente} ${item.accion} ${item.descripcion} ${results[item.resultado]}`}
      details={[{key: 'accion', label: 'Interpretación en SIALU', value: item => <><span className={`traffic-result result-${item.resultado.toLowerCase()}`}>{item.accion}</span>{item.descripcion && <p className="traffic-action-description">{item.descripcion}</p>}</>}]}
      onEdit={catalog.openMapping} labels={{title: 'Acciones recibidas', singular: 'acción', plural: 'acciones', empty: 'No hay acciones recibidas que coincidan', search: 'Buscar por acción, fuente o interpretación'}} />
    <TrafficActionForm draft={catalog.draft} busy={catalog.busy} error={catalog.formError} onChange={catalog.setDraft} onSave={catalog.save} />
    {catalog.mapping && <MappingForm draft={catalog.mapping} actions={catalog.items} onEditAction={action => { catalog.setMapping(null); catalog.open(action); }} busy={catalog.busy} error={catalog.formError} onChange={catalog.setMapping} onSave={catalog.save} />}
  </div>;
}
const styles = `
.traffic-action-description{margin:10px 0 0;color:var(--palette-muted);font-size:12px;font-weight:400;line-height:1.7;max-width:560px}

.traffic-actions-page .catalog-column-headings>div,.traffic-actions-page .catalog-list-columns .catalog-item-details{grid-template-columns:minmax(0,1fr)}

.traffic-result-filters{display:flex;flex-wrap:wrap;gap:8px 24px;margin:0 0 18px}
.traffic-result-filters button{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:10px 0;border:0;border-bottom:2px solid transparent;background:transparent;color:var(--palette-muted);font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.traffic-result-filters button[aria-pressed=true]{border-bottom-color:var(--palette-tabIndicator);color:var(--palette-editorialPrimary);font-weight:700}
.traffic-result-filters span{font-weight:500;font-size:12px}
.traffic-result{display:inline-flex;align-items:center;min-height:28px;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;line-height:1.5;white-space:normal}
.traffic-result.result-bloqueado{color:var(--palette-errorText);background:var(--palette-errorSurface)}
.traffic-result.result-permitido{color:var(--palette-editorialSuccessText);background:var(--palette-editorialSuccessSurface)}
.traffic-result.result-observado{color:var(--palette-editorialInfoText);background:var(--palette-editorialInfoSurface)}
.traffic-result.result-desconocido{color:var(--palette-muted);background:var(--palette-editorialBorder)}

.traffic-actions-page{--palette-primary:var(--palette-editorialPrimary);--palette-text:var(--palette-editorialText);--palette-muted:var(--palette-editorialMuted);width:100%;padding:48px;font-family:var(--font-body);font-size:13px;color:var(--palette-text);background:var(--palette-editorialSurface)}
.private-content:has(> .traffic-actions-page){padding:0;background:var(--palette-editorialSurface)}
.traffic-actions-page *{box-sizing:border-box}
.traffic-actions-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;margin-bottom:28px}
.private-content .traffic-actions-heading h1{font-size:24px;font-weight:600;line-height:1.3;letter-spacing:-.02em;margin:0 0 12px}
.traffic-actions-heading p{margin:0;font-size:13px;color:var(--palette-muted);line-height:1.7}
.traffic-action-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:10px 18px;border:1px solid var(--palette-editorialControlBorder);border-radius:9px;background:var(--palette-white);color:var(--palette-text);font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.traffic-action-button.primary{border-color:var(--palette-primary);background:var(--palette-primary);color:var(--palette-white)}
.traffic-action-button:hover{filter:brightness(.95)}
.traffic-actions-description{margin:0 0 28px;font-size:12px;color:var(--palette-muted);line-height:1.7}
.traffic-actions-notice{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px;font-size:13px;color:var(--palette-primary);line-height:1.7}
.traffic-actions-notice button{display:grid;place-items:center;min-width:40px;min-height:40px;border:0;border-radius:50%;background:transparent;color:var(--palette-muted);cursor:pointer}
.traffic-actions-error{padding:14px 0;font-size:13px;color:var(--palette-errorText);line-height:1.7}
.traffic-actions-page button:disabled{opacity:.5;cursor:default}
.traffic-actions-page button:focus-visible,.traffic-actions-page input:focus-visible,.traffic-actions-page select:focus-visible,.traffic-actions-page textarea:focus-visible{outline:2px solid var(--palette-muted);outline-offset:3px}
@media(max-width:800px){.traffic-actions-page{padding:28px 20px}}
`;
