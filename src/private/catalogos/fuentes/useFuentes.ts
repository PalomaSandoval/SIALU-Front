import useEditConfirmation from '../../../components/confirmation/useEditConfirmation.ts';
import { useEffect, useState } from 'react';
import type React from 'react';
import { request } from '../../../services/api.ts';
import { useConfirmation } from '../../../components/confirmation/ConfirmationProvider.tsx';
import { blank } from './types.ts';
import type { Fuente, FuenteDependencias } from './types.ts';
import { SOURCE_ICONS_UPDATED } from '../../sidebar/Main.tsx';

export default function useFuentes() {
  const confirmEdit = useEditConfirmation();
  const confirm = useConfirmation();
  // Asks the API what deactivating would block or keep; resolves to blocker text or the confirmation detail.
  async function deactivationCheck(row: Fuente): Promise<{ blocked: string } | { detail: string }> {
    const { data } = await request<{ data: FuenteDependencias }>(`/catalogos/fuentes/${row.id}/dependencias`);
    if (data.bloqueos.length) return { blocked: `«${row.nombre}» no se puede desactivar: ${data.bloqueos.join(' ')}` };
    const kept = data.conservados.map(item => `${item.descripcion}: ${item.total.toLocaleString('es-MX')}`).join('; ');
    return { detail: kept
      ? `Se conservarán sus registros relacionados (${kept}) y se recuperarán al reactivarla.`
      : 'No tiene registros relacionados.' };
  }
  function confirmDeactivation(nombre: string, detail: string) {
    return confirm({
      title: '¿Desactivar fuente?',
      description: `La fuente «${nombre}» quedará inactiva y no podrá recibir datos. ${detail} Puedes volver a activarla cuando lo necesites.`,
      confirmLabel: 'Desactivar',
      tone: 'danger',
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
  async function uploadIcon(file: File) {
    if (!draft?.id || busy) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { setError('Elige una imagen PNG, JPG o WebP.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('La imagen no debe superar 2 MB.'); return; }
    const body = new FormData();
    body.append('icono', file);
    setBusy(true); setError('');
    try {
      const result = await request<{ data: Fuente }>(`/catalogos/fuentes/${draft.id}/icono`, { method: 'POST', body });
      const saved = { ...result.data, icono_url: result.data.icono_url ? `${result.data.icono_url}&updated=${Date.now()}` : null };
      setRows(previous => previous.map(row => row.id === saved.id ? saved : row));
      setDraft(previous => previous?.id === saved.id ? { ...previous, icono_url: saved.icono_url } : previous);
      setNotice(`${saved.nombre}: ícono actualizado.`);
      window.dispatchEvent(new Event(SOURCE_ICONS_UPDATED));
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo subir la imagen.'); }
    finally { setBusy(false); }
  }
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || busy) return;
    if (!draft.nombre.trim()) { setError('Escribe el nombre de la fuente.'); return; }
    if (rows.some(row => row.id !== draft.id && row.nombre.trim().toLocaleLowerCase() === draft.nombre.trim().toLocaleLowerCase())) { setError('Ya existe una fuente con ese nombre.'); return; }
    if (!draft.id) {
      try { new Intl.DateTimeFormat('es', { timeZone: draft.zona }); } catch { setError('Escribe una zona horaria válida, por ejemplo UTC o America/Mexico_City.'); return; }
      if (draft.parametros.trim()) { try { JSON.parse(draft.parametros); } catch { setError('Los parámetros deben contener JSON válido.'); return; } }
    }
    const deactivating = rows.find(row => row.id === draft.id)?.vigente === true && !draft.vigente;
    let check: Awaited<ReturnType<typeof deactivationCheck>> | null = null;
    if (deactivating) {
      setBusy(true); setError('');
      try { check = await deactivationCheck(draft); }
      catch (error) { setError(error instanceof Error ? error.message : 'No se pudieron revisar las dependencias de la fuente.'); return; }
      finally { setBusy(false); }
      if ('blocked' in check) { setError(check.blocked); return; }
    }
    if (draft.id && !await confirmEdit(draft.nombre, check ? `Al guardar, «${draft.nombre}» quedará inactiva y no podrá recibir datos. ${check.detail}` : undefined)) return;
    setBusy(true); setError('');
    try {
      // Edits send only the editable fields; the API keeps every stored value that is omitted.
      const body = draft.id
        ? { nombre: draft.nombre, fabricante: draft.fabricante, vigente: draft.vigente }
        : { ...draft, raw: draft.raw === '' ? null : Number(draft.raw), eventos: draft.eventos === '' ? null : Number(draft.eventos), parametros: draft.parametros.trim() || null };
      const result = await request<{ data: Fuente }>(draft.id ? `/catalogos/fuentes/${draft.id}` : '/catalogos/fuentes', { method: draft.id ? 'PUT' : 'POST', body });
      const saved = result.data;
      setRows(previous => draft.id ? previous.map(row => row.id === draft.id ? saved : row) : [...previous, saved]);
      setNotice(`${saved.nombre}: ${draft.id ? 'cambios guardados' : 'fuente agregada'}.`);
      setDraft(null);
      window.dispatchEvent(new Event(SOURCE_ICONS_UPDATED));
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo guardar la fuente.'); }
    finally { setBusy(false); }
  }
  async function toggle(row: Fuente) {
    if (row.vigente) {
      setBusy(true); setNotice('');
      let check: Awaited<ReturnType<typeof deactivationCheck>>;
      try { check = await deactivationCheck(row); }
      catch (error) { setLoadError(error instanceof Error ? error.message : 'No se pudieron revisar las dependencias de la fuente.'); return; }
      finally { setBusy(false); }
      if ('blocked' in check) { setNotice(check.blocked); return; }
      if (!await confirmDeactivation(row.nombre, check.detail)) return;
    }
    setBusy(true); setLoadError('');
    try {
      const result = await request<{ data: Fuente }>(`/catalogos/fuentes/${row.id}/${row.vigente ? 'desactivar' : 'activar'}`, { method: 'POST' });
      setRows(previous => previous.map(item => item.id === row.id ? result.data : item));
      setNotice(`${row.nombre}: fuente ${result.data.vigente ? 'activada' : 'desactivada'}.`);
      window.dispatchEvent(new Event(SOURCE_ICONS_UPDATED));
    } catch (error) { setLoadError(error instanceof Error ? error.message : 'No se pudo cambiar el estado.'); }
    finally { setBusy(false); }
  }

  return { rows, draft, setDraft, error, notice, setNotice,
    loading, busy, loadError, retry: () => setReload(value => value + 1), open, save, toggle, uploadIcon };
}
