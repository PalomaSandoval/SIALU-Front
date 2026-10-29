import useEditConfirmation from '../../../components/confirmation/useEditConfirmation.ts';
import { useEffect, useState } from 'react';
import type React from 'react';
import { request } from '../../../services/api.ts';
import { useConfirmation } from '../../../components/confirmation/ConfirmationProvider.tsx';
import { blank } from './types.ts';
import type { Fuente } from './types.ts';

export default function useFuentes() {
  const confirmEdit = useEditConfirmation();
  const confirm = useConfirmation();
  function confirmState(nombre: string, active: boolean) {
    if (active) return Promise.resolve(true);
    return confirm({
      title: active ? '¿Activar fuente?' : '¿Desactivar fuente?',
      description: active
        ? `La fuente «${nombre}» volverá a estar activa.`
        : `La fuente «${nombre}» quedará inactiva. Puedes volver a activarla cuando lo necesites.`,
      confirmLabel: active ? 'Activar' : 'Desactivar',
      tone: active ? 'default' : 'danger',
    });
  }
  const [rows, setRows] = useState<Fuente[]>([]);
  const [draft, setDraft] = useState<Fuente | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setLoadError('');
    request<{ data: Fuente[] }>('/catalogos/fuentes', { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setRows(result.data); })
      .catch(error => { if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'No se pudieron cargar las fuentes.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [reload]);
  function open(row?: Fuente) { setError(''); setDraft(row ? { ...row } : { ...blank, id: 0 }); }
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || busy) return;
    if (!draft.nombre.trim()) { setError('Escribe el nombre de la fuente.'); return; }
    if (rows.some(row => row.id !== draft.id && row.nombre.trim().toLocaleLowerCase() === draft.nombre.trim().toLocaleLowerCase())) { setError('Ya existe una fuente con ese nombre.'); return; }
    try { new Intl.DateTimeFormat('es', { timeZone: draft.zona }); } catch { setError('Escribe una zona horaria válida, por ejemplo UTC o America/Mexico_City.'); return; }
    if (draft.parametros.trim()) { try { JSON.parse(draft.parametros); } catch { setError('Los parámetros deben contener JSON válido.'); return; } }
    if (draft.id && !await confirmEdit(draft.nombre)) return;
    setBusy(true); setError('');
    try {
      const result = await request<{ data: Fuente }>(draft.id ? `/catalogos/fuentes/${draft.id}` : '/catalogos/fuentes', { method: draft.id ? 'PUT' : 'POST', body: { ...draft, raw: draft.raw === '' ? null : Number(draft.raw), eventos: draft.eventos === '' ? null : Number(draft.eventos), parametros: draft.parametros.trim() || null } });
      const saved = result.data;
      setRows(previous => draft.id ? previous.map(row => row.id === draft.id ? saved : row) : [...previous, saved]);
      setNotice(`${saved.nombre}: ${draft.id ? 'cambios guardados' : 'fuente agregada'}.`);
      setDraft(null);
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo guardar la fuente.'); }
    finally { setBusy(false); }
  }
  async function toggle(row: Fuente) {
    if (!await confirmState(row.nombre, !row.vigente)) return;
    setBusy(true); setLoadError('');
    try {
      const result = await request<{ data: Fuente }>(`/catalogos/fuentes/${row.id}/${row.vigente ? 'desactivar' : 'activar'}`, { method: 'POST' });
      setRows(previous => previous.map(item => item.id === row.id ? result.data : item));
      setNotice(`${row.nombre}: fuente ${result.data.vigente ? 'activada' : 'desactivada'}.`);
    } catch (error) { setLoadError(error instanceof Error ? error.message : 'No se pudo cambiar el estado.'); }
    finally { setBusy(false); }
  }

  return { rows, draft, setDraft, error, notice, setNotice,
    loading, busy, loadError, retry: () => setReload(value => value + 1), open, save, toggle };
}
