import { useState } from 'react';
import CatalogFilters from './CatalogFilters.tsx';
import CatalogRows, { CatalogSkeleton } from './CatalogRows.tsx';
import type { CatalogLabels, CatalogListProps, CatalogStatus } from './types.ts';

const defaults: CatalogLabels = {
  title: 'Catálogo', singular: 'registro', plural: 'registros',
  all: 'Todos', active: 'Activos', inactive: 'Inactivos',
  activeState: 'Activo', inactiveState: 'Inactivo',
  empty: 'No hay registros que coincidan', search: 'Buscar registros',
};

export default function CatalogList<T>({ items, getKey, getTitle, getSubtitle, getImageUrl, getSearchText,
  isActive, details = [], actions = [], loading = false, busy = false, error = '', pageSize = 8,
  labels: customLabels, columnTitle, editLabel, onClearFilters, onRetry, onEdit, onToggle, canToggle }: CatalogListProps<T>) {
  const labels = { ...defaults, ...customLabels };
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CatalogStatus>('all');
  const [page, setPage] = useState(1);
  const size = Number.isFinite(pageSize) ? Math.max(1, Math.floor(pageSize)) : 8;
  const query = search.trim().toLocaleLowerCase();
  const searched = items.filter(item => (getSearchText?.(item) ?? `${getTitle(item)} ${getSubtitle?.(item) ?? ''}`).toLocaleLowerCase().includes(query));
  const activeCount = isActive ? searched.filter(isActive).length : 0;
  const counts = { all: searched.length, active: activeCount, inactive: searched.length - activeCount };
  const filtered = searched.filter(item => !isActive || status === 'all' || isActive(item) === (status === 'active'));
  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * size, current * size);
  const clear = () => { setSearch(''); setStatus('all'); setPage(1); onClearFilters?.(); };

  return <section className={`catalog-list${columnTitle ? ' catalog-list-columns' : ''}`} aria-label={labels.title} aria-busy={loading}>
    <style>{styles}</style>
    <CatalogFilters status={status} search={search} loading={loading} showStatus={!!isActive} counts={counts} labels={labels}
      onStatus={value => { setStatus(value); setPage(1); }} onSearch={value => { setSearch(value); setPage(1); }} />
    {error && <div className="catalog-error" role="alert"><p>{error}</p>
      {onRetry && <button disabled={busy || loading} onClick={onRetry}>Reintentar</button>}
    </div>}
    {loading ? <CatalogSkeleton /> : !error && <CatalogRows
      items={visible.map(item => ({ key: getKey(item), title: getTitle(item), subtitle: getSubtitle?.(item), imageUrl: getImageUrl?.(item), active: isActive?.(item),
        details: details.map(detail => ({ key: detail.key, label: detail.label, value: detail.value(item) })),
        actions: actions.map(action => ({ key: action.key, label: action.label, icon: action.icon, onClick: () => action.onClick(item) })),
        onEdit: onEdit ? () => onEdit(item) : undefined, onToggle: onToggle && (canToggle?.(item) ?? true) ? () => { void onToggle(item); } : undefined }))}
      columnTitle={columnTitle} columnLabels={details.map(detail => detail.label)} editLabel={editLabel}
      busy={busy} total={filtered.length} pages={pages} current={current} labels={labels} onPage={setPage} onClear={clear} />}
  </section>;
}

const styles = `
.catalog-list{
  --palette-primary:var(--palette-editorialPrimary);--palette-text:var(--palette-editorialText);
  --palette-muted:var(--palette-editorialMuted);--palette-legacyBorder:var(--palette-editorialControlBorder);
  --palette-noticeSurface:var(--palette-editorialTint);font-family:var(--font-body);color:var(--palette-text);font-size:13px;
}
.catalog-list *,.catalog-list *::before,.catalog-list *::after{box-sizing:border-box}
.catalog-list button,.catalog-list input{font-family:inherit}
.catalog-list button:focus-visible,.catalog-list a:focus-visible{outline:2px solid var(--palette-primary);outline-offset:4px}
.catalog-list button:disabled{opacity:.5;cursor:default}
.catalog-error{padding:32px 0;color:var(--palette-errorText);font-size:13px;line-height:1.6}
.catalog-error button{min-height:44px;padding:10px 20px;border:1px solid var(--palette-legacyBorder);border-radius:999px;background:var(--palette-white);color:var(--palette-text);font-size:13px;font-weight:600;cursor:pointer}
`;
