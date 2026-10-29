import type { Key, ReactNode } from 'react';

export type CatalogStatus = 'all' | 'active' | 'inactive';
export interface CatalogLabels {
  title: string; singular: string; plural: string;
  all: string; active: string; inactive: string;
  activeState: string; inactiveState: string;
  empty: string; search: string;
}
export interface CatalogDetail<T> {
  key: string; label: string; value: (item: T) => ReactNode;
}
export interface CatalogAction<T> {
  key: string; label: string; icon: ReactNode; onClick: (item: T) => void;
}
export interface CatalogListProps<T> {
  items: readonly T[];
  getKey: (item: T) => Key;
  getTitle: (item: T) => string;
  getSubtitle?: (item: T) => string;
  getSearchText?: (item: T) => string;
  isActive?: (item: T) => boolean;
  details?: readonly CatalogDetail<T>[];
  actions?: readonly CatalogAction<T>[];
  loading?: boolean; busy?: boolean; error?: string; pageSize?: number;
  labels?: Partial<CatalogLabels>;
  columnTitle?: string;
  editLabel?: string;
  onClearFilters?: () => void;
  onRetry?: () => void;
  onEdit?: (item: T) => void;
  // Confirmation and persistence belong to the calling catalog.
  onToggle?: (item: T) => void | Promise<void>;
}
export interface CatalogRowView {
  key: Key; title: string; subtitle?: string; active?: boolean;
  details: { key: string; label: string; value: ReactNode }[];
  onEdit?: () => void; onToggle?: () => void;
  actions?: { key: string; label: string; icon: ReactNode; onClick: () => void }[];
}
