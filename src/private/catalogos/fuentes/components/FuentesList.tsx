import CatalogList from '../../../../components/catalogos/CatalogList.tsx';
import type { Fuente } from '../types.ts';

interface Props {
  items: Fuente[]; loading: boolean; busy: boolean; error: string;
  onRetry: () => void; onEdit: (item: Fuente) => void; onToggle: (item: Fuente) => Promise<void>;
}
export default function FuentesList(props: Props) {
  return <CatalogList {...props}
    getKey={item => item.id} getTitle={item => item.nombre}
    getSubtitle={item => item.fabricante || 'Sin fabricante'}
    getImageUrl={item => item.icono_url}
    getSearchText={item => `${item.nombre} ${item.fabricante}`}
    isActive={item => item.vigente}
    canToggle={item => !item.integracion_configurada || !item.vigente}
    details={[
      { key: 'metodo', label: 'Integración', value: item => item.metodo },
      { key: 'zona', label: 'Zona horaria', value: item => item.zona },
    ]}
    labels={{ title: 'Fuentes de datos', singular: 'fuente', plural: 'fuentes',
      all: 'Todas', active: 'Activas', inactive: 'Inactivas', activeState: 'Activa', inactiveState: 'Inactiva',
      empty: 'No hay fuentes que coincidan', search: 'Buscar por nombre o fabricante' }} />;
}
