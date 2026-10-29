import useEditConfirmation from '../../../components/confirmation/useEditConfirmation.ts';
import { useEffect, useState } from 'react';
import type React from 'react';
import { request } from '../../../services/api.ts';
import { useConfirmation } from '../../../components/confirmation/ConfirmationProvider.tsx';
import type { Level, LevelKind } from './types.ts';

export function getNextLevel(items: readonly Pick<Level, 'nivel'>[]): number {
  const values = items.map(item => Number(item.nivel)).filter(value => Number.isInteger(value) && value >= 0 && value <= 255);
  return values.length ? Math.max(...values) + 1 : 0;
}

export default function useLevels(kind: LevelKind) {
  const confirmEdit = useEditConfirmation();
  const confirm = useConfirmation();
  const [items, setItems] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Level | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    request<{ data: Level[] }>(`/catalogos/${kind}`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setItems(result.data.sort((a, b) => Number(a.nivel) - Number(b.nivel))); })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'No se pudieron cargar los niveles.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [kind, revision]);
  function open(item?: Level) {
    setFormError(''); setActionError('');
    const next = getNextLevel(items);
    if (!item && next > 255) { setActionError('No se pueden agregar más niveles: se alcanzó el máximo de 255.'); return; }
    setDraft(item ? { ...item } : { id: 0, nombre: '', descripcion: '', nivel: String(next), vigente: true });
  }
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || busy) return;
    if (!draft.nombre.trim()) { setFormError('Escribe el nombre del nivel.'); return; }
    const value = Number(draft.nivel);
    if (String(draft.nivel).trim() === '' || !Number.isInteger(value) || value < 0 || value > 255) { setFormError('El nivel debe ser un entero entre 0 y 255.'); return; }
    if (draft.id && !await confirmEdit(draft.nombre)) return;
    setBusy(true); setFormError('');
    try {
      const result = await request<{ data: Level }>(`/catalogos/${kind}${draft.id ? `/${draft.id}` : ''}`, {
        method: draft.id ? 'PUT' : 'POST', body: { nombre: draft.nombre.trim(), descripcion: draft.descripcion.trim() || null, nivel: value },
      });
      setItems(previous => (draft.id ? previous.map(item => item.id === draft.id ? result.data : item) : [...previous, result.data]).sort((a, b) => Number(a.nivel) - Number(b.nivel)));
      setNotice(`${result.data.nombre}: ${draft.id ? 'cambios guardados' : 'nivel agregado'}.`); setDraft(null);
    } catch (error) { setFormError(error instanceof Error ? error.message : 'No se pudo guardar el nivel.'); }
    finally { setBusy(false); }
  }
  async function toggle(item: Level) {
    if (busy) return;
    if (item.vigente && !await confirm({ title: '¿Desactivar nivel?', description: `«${item.nombre}» dejará de estar disponible para nuevas clasificaciones. Se conservarán los registros históricos.`, confirmLabel: 'Desactivar', tone: 'danger' })) return;
    setBusy(true); setActionError('');
    try {
      const result = await request<{ data: Level }>(`/catalogos/${kind}/${item.id}/${item.vigente ? 'desactivar' : 'activar'}`, { method: 'POST' });
      setItems(previous => previous.map(row => row.id === item.id ? result.data : row));
      setNotice(`${item.nombre}: nivel ${result.data.vigente ? 'activado' : 'desactivado'}.`);
    } catch (error) { setActionError(error instanceof Error ? error.message : 'No se pudo cambiar el estado.'); }
    finally { setBusy(false); }
  }
  return { items, loading, error, formError, actionError, notice, setNotice, busy, draft, setDraft, open, save, toggle, retry: () => setRevision(value => value + 1) };
}
