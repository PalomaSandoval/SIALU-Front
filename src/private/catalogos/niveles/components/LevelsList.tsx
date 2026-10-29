import CatalogList from '../../../../components/catalogos/CatalogList.tsx';
import type { Level } from '../types.ts';

interface Props {
  items: Level[]; loading: boolean; busy: boolean; error: string; title: string;
  onRetry: () => void; onEdit: (item: Level) => void; onToggle: (item: Level) => Promise<void>;
}
export default function LevelsList({ title, ...props }: Props) {
  return <CatalogList {...props} getKey={item => item.id} getTitle={item => item.nombre}
    getSubtitle={item => item.descripcion} isActive={item => item.vigente}
    details={[{ key: 'nivel', label: 'Nivel', value: item => item.nivel }]}
    labels={{ title, singular: 'nivel', plural: 'niveles', empty: 'No hay niveles que coincidan', search: 'Buscar por nombre o descripción' }} />;
}
