import { useId } from 'react';
import { Pencil, Power, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CatalogLabels, CatalogRowView } from './types.ts';

interface Props {
  items: CatalogRowView[]; busy: boolean; total: number; pages: number; current: number;
  labels: CatalogLabels; onPage: (page: number) => void; onClear: () => void;
  columnTitle?: string; columnLabels?: string[]; editLabel?: string;
}
export function CatalogSkeleton() {
  return <><style>{styles}</style><div role="status">
    <span className="catalog-sr-only">Cargando registros</span>
    {[0, 1].map(index => <div className="catalog-row" aria-hidden="true" key={index}>
      <div className="catalog-item-name"><span className="catalog-skeleton catalog-skeleton-title" /><span className="catalog-skeleton catalog-skeleton-short" /></div>
      <div className="catalog-item-details">{[0, 1].map(item => <span className="catalog-skeleton catalog-skeleton-field" key={item} />)}</div>
      <span className="catalog-skeleton catalog-skeleton-short" />
    </div>)}
  </div></>;
}
export default function CatalogRows({ items, busy, total, pages, current, labels, onPage, onClear, columnTitle, columnLabels, editLabel }: Props) {
  const id = useId();
  return <><style>{styles}</style>
    {columnTitle && <div className="catalog-column-headings" aria-hidden="true"><span>{columnTitle}</span><div>{columnLabels?.map(label => <span key={label}>{label}</span>)}</div><span /></div>}
    <div>{items.map((item, index) => <article className="catalog-row" key={item.key} aria-labelledby={`${id}-${index}`}>
      <div className={`catalog-item-name${item.imageUrl ? ' catalog-item-name-with-image' : ''}`}>
        {item.imageUrl && <img className="catalog-item-image" src={item.imageUrl} alt="" loading="lazy" />}
        <div><h2 id={`${id}-${index}`}>{item.title}</h2>{item.subtitle && <p>{item.subtitle}</p>}</div>
      </div>
      {item.details.length > 0 && <dl className="catalog-item-details">{item.details.map(detail => <div key={detail.key}><dt>{detail.label}</dt><dd>{detail.value}</dd></div>)}</dl>}
      {(item.active !== undefined || item.onEdit || item.onToggle || !!item.actions?.length) && <div className="catalog-row-end">
        {item.active !== undefined && <span className={`catalog-state ${item.active ? 'active' : ''}`}><span aria-hidden="true" />{item.active ? labels.activeState : labels.inactiveState}</span>}
        {(item.onEdit || item.onToggle || !!item.actions?.length) && <div className="catalog-actions">
          {item.actions?.map(action => <button key={action.key} className="catalog-icon-button" disabled={busy} onClick={action.onClick} aria-label={`${action.label}: ${item.title}`} title={action.label}>{action.icon}</button>)}
          {item.onEdit && <button className={`catalog-icon-button${editLabel ? ' catalog-edit-text' : ''}`} disabled={busy} onClick={item.onEdit} aria-label={`Editar ${labels.singular}${editLabel ? `: ${item.title}` : ''}`} title={`Editar ${item.title}`}><Pencil size={18} aria-hidden="true" />{editLabel}</button>}
          {item.onToggle && item.active !== undefined && <button className={`catalog-icon-button catalog-power-button ${item.active ? 'deactivate' : 'activate'}`} disabled={busy} onClick={item.onToggle}
            aria-label={`${item.active ? 'Desactivar' : 'Activar'} ${labels.singular}`} title={`${item.active ? 'Desactivar' : 'Activar'} ${item.title}`}><Power size={18} aria-hidden="true" /></button>}
        </div>}
      </div>}
    </article>)}</div>
    {!items.length && <div className="catalog-empty"><p>{labels.empty}</p><button className="catalog-text-button" onClick={onClear}>Limpiar filtros</button></div>}
    <footer className="catalog-footer"><span>Mostrando {items.length} de {total} {labels.plural}</span>
      {pages > 1 && <nav aria-label={`Paginación de ${labels.plural}`}>
        <button className="catalog-icon-button" aria-label="Página anterior" disabled={current === 1} onClick={() => onPage(current - 1)}><ChevronLeft size={18} aria-hidden="true" /></button>
        <span>Página {current} de {pages}</span>
        <button className="catalog-icon-button" aria-label="Página siguiente" disabled={current === pages} onClick={() => onPage(current + 1)}><ChevronRight size={18} aria-hidden="true" /></button>
      </nav>}
    </footer>
  </>;
}
const styles = `

.catalog-button:hover,.catalog-icon-button:hover{background:var(--palette-noticeSurface)}
.catalog-row{display:flex;flex-wrap:wrap;align-items:flex-start;gap:20px 32px;padding:24px 0;border-bottom:1px solid var(--palette-editorialBorder)}
.catalog-item-name{flex:1 1 280px;min-width:0}
.catalog-item-name-with-image{display:flex;align-items:center;gap:18px}
.catalog-item-name-with-image>div{min-width:0}
.catalog-item-image{display:block;width:68px;height:68px;flex:none;object-fit:contain;border:1px solid var(--palette-editorialBorder);border-radius:20px;background:var(--palette-white)}
.catalog-item-name h2{font-size:17px;font-weight:700;letter-spacing:-.015em;line-height:1.25;margin:0 0 12px;overflow-wrap:anywhere}
.catalog-item-name p{font-size:12px;line-height:1.6;color:var(--palette-muted);margin:0;overflow-wrap:anywhere}
.catalog-item-details{flex:1 1 280px;min-width:0;display:grid;grid-template-columns:minmax(80px,.65fr) minmax(0,1.35fr);gap:24px;margin:0}
.catalog-item-details dt{text-transform:uppercase;font-size:11px;font-weight:600;letter-spacing:.06em;color:var(--palette-muted);line-height:1.5;margin-bottom:7px}
.catalog-item-details dd{font-size:12px;font-weight:600;line-height:1.5;margin:0;overflow-wrap:anywhere}
.catalog-row-end{display:flex;flex-direction:row;gap:16px;align-items:center;flex-wrap:wrap}
.catalog-state{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:88px;padding:6px 12px;border:1px solid var(--palette-editorialControlBorder);border-radius:999px;background:var(--palette-editorialBorder);color:var(--palette-muted);font-size:12px;font-weight:600;line-height:1.6}
.catalog-state>span{width:9px;height:9px;border-radius:50%;background:currentColor;flex-shrink:0}
.catalog-state.active{color:var(--palette-editorialSuccessText);background:var(--palette-editorialSuccessSurface);border-color:var(--palette-editorialSuccessBorder)}
.catalog-state.active>span{background:var(--palette-editorialSuccessDot)}
.catalog-actions{display:flex;gap:10px}
.catalog-icon-button{display:inline-flex;justify-content:center;align-items:center;width:44px;height:44px;flex-shrink:0;padding:0;border:1px solid var(--palette-legacyBorder);border-radius:50%;background:var(--palette-white);color:var(--palette-text);cursor:pointer}
.catalog-footer{display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;padding:22px 0;font-size:12px;color:var(--palette-muted)}
.catalog-footer nav{display:flex;align-items:center;gap:14px}
.catalog-empty{text-align:center;padding:64px 0;color:var(--palette-muted)}
.catalog-empty p{font-size:18px;line-height:1.5;margin:0 0 18px}
.catalog-text-button{border:0;background:transparent;color:var(--palette-primary);font:inherit;font-weight:600;text-decoration:underline;text-underline-offset:4px;min-height:44px;cursor:pointer}
.catalog-sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.catalog-skeleton{display:block;background:var(--palette-editorialBorder);animation:catalog-pulse 1.4s ease-in-out infinite}
.catalog-skeleton-title{width:85%;height:30px;margin-bottom:15px}
.catalog-skeleton-short{width:96px;height:18px}
.catalog-skeleton-field{width:140px;height:42px}
@keyframes catalog-pulse{50%{opacity:.4}}
@media(prefers-reduced-motion:reduce){.catalog-skeleton{animation:none}}
@media(max-width:1100px){.catalog-row-end{flex-direction:row;align-items:center;justify-content:space-between;width:100%}}
@media(max-width:800px){.catalog-row{flex-direction:column}.catalog-item-name,.catalog-item-details{flex:0 1 auto;width:100%}.catalog-row-end{width:100%}}
.catalog-power-button.deactivate{color:var(--palette-errorText);border-color:var(--palette-errorBorder);background:var(--palette-errorSurface)}
.catalog-power-button.activate{color:var(--palette-editorialSuccessText);border-color:var(--palette-editorialSuccessBorder);background:var(--palette-editorialSuccessSurface)}
.catalog-power-button:hover:not(:disabled){border-color:currentColor;box-shadow:inset 0 0 0 1px currentColor}
.catalog-column-headings{display:grid;grid-template-columns:minmax(180px,1fr) minmax(280px,1.3fr) 100px;gap:32px;padding:18px 0;border-bottom:1px solid var(--palette-editorialBorder);font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--palette-muted)}
.catalog-column-headings>div{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.catalog-list-columns .catalog-row{display:grid;grid-template-columns:minmax(180px,1fr) minmax(280px,1.3fr) 100px;align-items:center;gap:32px}
.catalog-list-columns .catalog-item-details{grid-template-columns:1fr 1fr}
.catalog-list-columns .catalog-item-details dt{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.catalog-list-columns .catalog-row-end{width:auto;justify-content:flex-end}
.catalog-edit-text{width:auto;min-width:96px;gap:8px;padding:0 14px;border-radius:10px;font:inherit;font-size:12px;font-weight:600}
@media(max-width:800px){.catalog-column-headings{display:none}.catalog-list-columns .catalog-row{display:flex;gap:20px}.catalog-list-columns .catalog-item-details dt{position:static;width:auto;height:auto;overflow:visible;clip-path:none;white-space:normal}.catalog-list-columns .catalog-row-end{width:100%;justify-content:flex-end}}

`;
