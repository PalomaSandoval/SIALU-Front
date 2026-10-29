import useEditConfirmation from '../../../components/confirmation/useEditConfirmation.ts';
import { useEffect, useState } from 'react';
import type React from 'react';
import { request } from '../../../services/api.ts';
import { useConfirmation } from '../../../components/confirmation/ConfirmationProvider.tsx';
import type { AssetType } from './types.ts';

export default function useAssetTypes() {
  const confirmEdit = useEditConfirmation();
  const confirm = useConfirmation();
  const [items, setItems] = useState<AssetType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<AssetType | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    request<{ data: AssetType[] }>(`/catalogos/tipos-activo`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setItems(result.data.sort((a, b) => a.nombre.localeCompare(b.nombre))); })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'No se pudieron cargar los tipos de equipos y activos.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  function open(item?: AssetType) {
    setFormError(''); setActionError('');
    setDraft(item ? { ...item } : { id: 0, nombre: '', descripcion: '', vigente: true });
  }
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || busy) return;
    if (!draft.nombre.trim()) { setFormError('Escribe el nombre del tipo.'); return; }
    if (draft.id && !await confirmEdit(draft.nombre)) return;
    setBusy(true); setFormError('');
    try {
      const result = await request<{ data: AssetType }>(`/catalogos/tipos-activo${draft.id ? `/${draft.id}` : ''}`, {
        method: draft.id ? 'PUT' : 'POST', body: { nombre: draft.nombre.trim(), descripcion: draft.descripcion.trim() || null },
      });
      setItems(previous => (draft.id ? previous.map(item => item.id === draft.id ? result.data : item) : [...previous, result.data]).sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNotice(`${result.data.nombre}: ${draft.id ? 'cambios guardados' : 'tipo agregado'}.`); setDraft(null);
    } catch (error) { setFormError(error instanceof Error ? error.message : 'No se pudo guardar el tipo.'); }
    finally { setBusy(false); }
  }
  async function toggle(item: AssetType) {
    if (busy) return;
    if (item.vigente && !await confirm({ title: '¿Desactivar tipo?', description: `«${item.nombre}» dejará de estar disponible para nuevas asignaciones. Los equipos asociados conservarán su tipo.`, confirmLabel: 'Desactivar', tone: 'danger' })) return;
    setBusy(true); setActionError('');
    try {
      const result = await request<{ data: AssetType }>(`/catalogos/tipos-activo/${item.id}/${item.vigente ? 'desactivar' : 'activar'}`, { method: 'POST' });
      setItems(previous => previous.map(row => row.id === item.id ? result.data : row));
      setNotice(`${item.nombre}: tipo ${result.data.vigente ? 'activado' : 'desactivado'}.`);
    } catch (error) { setActionError(error instanceof Error ? error.message : 'No se pudo cambiar el estado.'); }
    finally { setBusy(false); }
  }
  return { items, loading, error, formError, actionError, notice, setNotice, busy, draft, setDraft, open, save, toggle, retry: () => setRevision(value => value + 1) };
}
