import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import CatalogList from '../../../../components/catalogos/CatalogList.tsx';
import { request } from '../../../../services/api.ts';
import type { Asset } from '../../ubicaciones/types.ts';
import type { AssetType } from '../types.ts';

interface Props { type: AssetType; onClose: () => void }
export default function TypeAssetsDialog({ type, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => { dialog.current?.showModal(); }, []);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    request<{ data: Asset[] }>(`/catalogos/tipos-activo/${type.id}/activos`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setItems(result.data); })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'No se pudieron cargar los equipos.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [type.id, revision]);
  return <><style>{styles}</style><dialog ref={dialog} className="type-assets" aria-labelledby="type-assets-title" onCancel={onClose}>
    <header><div><h2 id="type-assets-title">Activos de {type.nombre}</h2><p>Equipos relacionados con este tipo en la base de datos.</p></div>
      <button type="button" aria-label="Cerrar equipos asociados" onClick={onClose}><X size={19} /></button></header>
    <div className="type-assets-body">
      <CatalogList items={items} loading={loading} error={error} onRetry={() => setRevision(value => value + 1)}
        getKey={item => item.id} getTitle={item => item.nombre} getSubtitle={item => item.hostname && item.hostname !== item.nombre ? item.hostname : ''}
        getSearchText={item => `${item.nombre} ${item.hostname} ${item.grupo || ''} ${item.campus || ''}`}
        isActive={item => item.vigente} details={[
          { key: 'grupo', label: 'Grupo', value: item => item.grupo || 'Sin asignar' },
          { key: 'campus', label: 'Ubicación', value: item => item.campus || 'Sin asignar' },
        ]} labels={{ title: 'Equipos asociados', singular: 'equipo', plural: 'equipos', empty: 'No hay equipos que coincidan', search: 'Buscar equipos' }} />
    </div>
  </dialog></>;
}
const styles = `
.type-assets{width:1100px;max-width:calc(100vw - 32px);max-height:90svh;padding:0;border:1px solid var(--palette-editorialControlBorder);border-radius:16px;background:var(--palette-white);color:var(--palette-text);font:inherit}
.type-assets::backdrop{background:rgba(27,19,32,.32)}
.type-assets>header{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:22px 28px;border-bottom:1px solid var(--palette-editorialBorder)}
.type-assets h2{margin:0 0 8px;font-size:19px;font-weight:600}
.type-assets header p{margin:0;color:var(--palette-muted);font-size:12px;line-height:1.6}
.type-assets header button{display:grid;place-items:center;width:40px;height:40px;flex-shrink:0;border:0;background:transparent;color:var(--palette-muted);cursor:pointer;border-radius:50%}
.type-assets-body{padding:24px 28px}
@media(max-width:600px){.type-assets>header,.type-assets-body{padding:20px}}
`;
