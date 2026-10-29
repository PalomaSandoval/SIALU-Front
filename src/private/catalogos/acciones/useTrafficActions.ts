import useEditConfirmation from '../../../components/confirmation/useEditConfirmation.ts';
import { useEffect, useState } from 'react';
import type React from 'react';
import { request } from '../../../services/api.ts';
import type { TrafficAction, ActionMapping } from './types.ts';
export default function useTrafficActions() {
  const confirmEdit = useEditConfirmation();
  const [items, setItems] = useState<TrafficAction[]>([]);
  const [mappings, setMappings] = useState<ActionMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState<TrafficAction | null>(null);
  const [mapping, setMapping] = useState<ActionMapping | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    Promise.all([request<{data: TrafficAction[]}>('/catalogos/acciones', {signal: controller.signal}), request<{data: ActionMapping[]}>('/catalogos/equivalencias-acciones', {signal: controller.signal})])
      .then(([actions, maps]) => { if (!controller.signal.aborted) { setItems(actions.data); setMappings(maps.data); } })
      .catch(e => { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudieron cargar las acciones.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || (!draft && !mapping)) return;
    if (draft && !draft.nombre.trim()) { setFormError('Escribe el nombre de la acción.'); return; }
    const name = draft?.nombre || mapping?.valor || 'la acción';
    const description = mapping
      ? `¿Estás seguro de cambiar la interpretación de «${mapping.valor}»? Se aplicará a los próximos eventos.`
      : `¿Estás seguro de guardar los cambios en «${name}»? El nombre, la descripción y la clasificación se comparten con los registros asociados a esta acción.`;
    if (!await confirmEdit(name, description)) return;
    setBusy(true); setFormError('');
    try {
      if (draft) await request(`/catalogos/acciones/${draft.id}`, {method: 'PUT', body: {nombre: draft.nombre.trim(), descripcion: draft.descripcion.trim() || null, resultado: draft.resultado}});
      else if (mapping) await request(`/catalogos/equivalencias-acciones/${mapping.id}`, {method: 'PUT', body: {accion_id: mapping.accion_id}});
      setDraft(null); setMapping(null); setNotice('Cambios guardados. Las equivalencias se aplican a los próximos eventos.'); setRevision(n => n + 1);
    } catch(e) { setFormError(e instanceof Error ? e.message : 'No se pudieron guardar los cambios.'); }
    finally { setBusy(false); }
  }
  return {items, mappings, loading, busy, error, formError, notice, setNotice, draft, setDraft, mapping, setMapping, save,
    open: (item: TrafficAction) => {setFormError(''); setDraft({...item});},
    openMapping: (item: ActionMapping) => {setFormError(''); setMapping({...item});},
    retry: () => setRevision(n => n + 1)};
}
