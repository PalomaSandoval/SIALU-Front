import { useState } from 'react';
import { Plus, X, Monitor } from 'lucide-react';
import CatalogList from '../../../components/catalogos/CatalogList.tsx';
import useAssetTypes from './useAssetTypes.ts';
import AssetTypeForm from './components/AssetTypeForm.tsx';

import TypeAssetsDialog from './components/TypeAssetsDialog.tsx';
import type { AssetType } from './types.ts';

export default function AssetTypesMain() {
  const catalog = useAssetTypes();
  const [inspection, setInspection] = useState<AssetType | null>(null);
  return <div className="asset-types-page"><style>{styles}</style>
    <header className="asset-types-heading"><div><h1>Tipos de equipos y activos</h1><p>Define las categorías para clasificar tus equipos y activos.</p></div>
      <button className="asset-type-button primary" disabled={catalog.loading || catalog.busy || !!catalog.error} onClick={() => catalog.open()}><Plus size={17} />Agregar tipo</button>
    </header>
    {catalog.notice && <div className="asset-types-notice" role="status">{catalog.notice}<button aria-label="Cerrar aviso" onClick={() => catalog.setNotice('')}><X size={17} /></button></div>}
    {catalog.actionError && <p className="asset-types-error" role="alert">{catalog.actionError}</p>}
    <CatalogList items={catalog.items} loading={catalog.loading} busy={catalog.busy} error={catalog.error} onRetry={catalog.retry}
      getKey={item => item.id} getTitle={item => item.nombre} getSubtitle={item => item.descripcion} isActive={item => item.vigente}
      getSearchText={item => `${item.nombre} ${item.descripcion}`}
      actions={[{ key: 'activos', label: 'Ver activos asociados', icon: <Monitor size={18} aria-hidden="true" />, onClick: setInspection }]}
      onEdit={catalog.open} onToggle={catalog.toggle}
      labels={{ title: 'Tipos de equipos y activos', singular: 'tipo', plural: 'tipos', all: 'Todos', active: 'Activos', inactive: 'Inactivos', activeState: 'Activo', inactiveState: 'Inactivo', empty: 'No hay tipos que coincidan', search: 'Buscar por nombre o descripción' }} />
    {inspection && <TypeAssetsDialog key={inspection.id} type={inspection} onClose={() => setInspection(null)} />}
    <AssetTypeForm draft={catalog.draft} busy={catalog.busy} error={catalog.formError} onChange={catalog.setDraft} onSave={catalog.save} />
  </div>;
}
const styles = `
.asset-types-page{--palette-primary:var(--palette-editorialPrimary);--palette-text:var(--palette-editorialText);--palette-muted:var(--palette-editorialMuted);width:100%;padding:48px;font-family:var(--font-body);font-size:13px;color:var(--palette-text);background:var(--palette-editorialSurface)}
.private-content:has(> .asset-types-page){padding:0;background:var(--palette-editorialSurface)}
.asset-types-page *{box-sizing:border-box}
.asset-types-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;margin-bottom:28px}
.private-content .asset-types-heading h1{font-size:24px;font-weight:600;line-height:1.3;letter-spacing:-.02em;margin:0 0 12px}
.asset-types-heading p{margin:0;font-size:13px;color:var(--palette-muted);line-height:1.7}
.asset-type-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:10px 18px;border:1px solid var(--palette-editorialControlBorder);border-radius:9px;background:var(--palette-white);color:var(--palette-text);font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.asset-type-button.primary{border-color:var(--palette-primary);background:var(--palette-primary);color:var(--palette-white)}
.asset-type-button:hover{filter:brightness(.95)}
.asset-types-tabs{display:flex;gap:24px;flex-wrap:wrap;margin-bottom:16px}
.asset-types-tabs button{border:0;border-bottom:3px solid transparent;background:transparent;color:var(--palette-muted);padding:12px 0;font:inherit;font-weight:500;cursor:pointer}
.asset-types-tabs button[aria-pressed=true]{color:var(--palette-editorialPrimary);border-bottom-color:var(--palette-tabIndicator);font-weight:700}
.asset-types-description{margin:0 0 28px;font-size:12px;color:var(--palette-muted);line-height:1.7}
.asset-types-notice{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px;font-size:13px;color:var(--palette-primary);line-height:1.7}
.asset-types-notice button{display:grid;place-items:center;min-width:40px;min-height:40px;border:0;border-radius:50%;background:transparent;color:var(--palette-muted);cursor:pointer}
.asset-types-error{padding:14px 0;font-size:13px;color:var(--palette-errorText);line-height:1.7}
.asset-types-page button:disabled{opacity:.5;cursor:default}
.asset-types-page button:focus-visible,.asset-types-page input:focus-visible,.asset-types-page textarea:focus-visible{outline:2px solid var(--palette-muted);outline-offset:3px}
@media(max-width:800px){.asset-types-page{padding:28px 20px}.asset-types-tabs{gap:16px}}
`;
