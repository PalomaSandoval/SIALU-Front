import useEditConfirmation from '../../../components/confirmation/useEditConfirmation.ts';
import { useEffect, useState } from 'react';
import type React from 'react';
import { request } from '../../../services/api.ts';
export interface Level {
  id: number;
  nombre: string;
  descripcion: string;
  nivel: number | string;
  vigente: boolean;
}

export default function useLevels() {
  const confirmEdit = useEditConfirmation();
  const [items, setItems] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Level | null>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    request<{ data: Level[] }>('/catalogos/severidad', { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setItems(result.data.sort((a, b) => Number(a.nivel) - Number(b.nivel))); })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'No se pudieron cargar los niveles.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);
  function open(item: Level) {
    setFormError('');
    setDraft({ ...item });
  }
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || busy) return;
    if (!draft.nombre.trim()) { setFormError('Escribe el nombre del nivel.'); return; }
    if (!await confirmEdit(draft.nombre)) return;
    setBusy(true); setFormError('');
    try {
      const result = await request<{ data: Level }>(`/catalogos/severidad/${draft.id}`, {
        method: 'PUT', body: { nombre: draft.nombre.trim(), descripcion: draft.descripcion.trim() || null },
      });
      setItems(previous => previous.map(item => item.id === draft.id ? result.data : item));
      setNotice(`${result.data.nombre}: cambios guardados.`); setDraft(null);
    } catch (error) { setFormError(error instanceof Error ? error.message : 'No se pudo guardar el nivel.'); }
    finally { setBusy(false); }
  }
  return { items, loading, error, formError, notice, setNotice, busy, draft, setDraft, open, save, retry: () => setRevision(value => value + 1) };
}
