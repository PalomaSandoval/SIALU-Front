import { Search } from 'lucide-react';
import type { CatalogLabels, CatalogStatus } from './types.ts';

interface Props {
  status: CatalogStatus; search: string; loading: boolean; showStatus: boolean;
  counts: Record<CatalogStatus, number>; labels: CatalogLabels;
  onStatus: (value: CatalogStatus) => void; onSearch: (value: string) => void;
}
export default function CatalogFilters({ status, search, loading, showStatus, counts, labels, onStatus, onSearch }: Props) {
  return <><style>{styles}</style>
    <div className="catalog-toolbar">
      {showStatus && <div className="catalog-tabs" role="group" aria-label="Filtrar por estado">
        {(['all', 'active', 'inactive'] as const).map(value => <button key={value}
          aria-pressed={status === value} className={status === value ? 'selected' : ''} onClick={() => onStatus(value)}>
          {labels[value]} <span>{loading ? '—' : counts[value]}</span>
        </button>)}
      </div>}
      <label className="catalog-search"><Search size={18} aria-hidden="true" />
        <input type="search" aria-label={labels.search} placeholder="Buscar" value={search} onChange={event => onSearch(event.target.value)} />
      </label>
    </div>
  </>;
}
const styles = `

.catalog-toolbar{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;padding-bottom:20px;border-bottom:2px solid var(--palette-text)}
.catalog-tabs{display:flex;align-items:center;gap:26px;flex-wrap:wrap}
.catalog-tabs button{padding:10px 12px;border:0;border-bottom:3px solid transparent;border-radius:7px 7px 0 0;background:transparent;color:var(--palette-muted);font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.catalog-tabs button.selected{color:var(--palette-filterActive);background:transparent;border-bottom-color:var(--palette-filterActive);font-weight:700}
.catalog-tabs button span{font-weight:500;margin-left:5px}
.catalog-search{display:flex;align-items:center;gap:10px;color:var(--palette-muted);min-width:0;padding:0 14px;border:1px solid var(--palette-editorialControlBorder);border-radius:12px;background:var(--palette-white)}
.catalog-search input{width:130px;min-width:0;border:0;border-radius:0;background:transparent;padding:12px 0;color:var(--palette-text);font:inherit;font-size:13px;outline:none}
.catalog-search input::placeholder{color:var(--palette-muted);opacity:1}
.catalog-search:focus-within{border-color:var(--palette-muted);outline:2px solid var(--palette-muted);outline-offset:2px}
@media(max-width:800px){.catalog-toolbar{align-items:flex-start}.catalog-search{width:100%}.catalog-search input{width:100%}.catalog-tabs{gap:22px}}
.catalog-list .catalog-search input:focus-visible{outline:none}

`;
