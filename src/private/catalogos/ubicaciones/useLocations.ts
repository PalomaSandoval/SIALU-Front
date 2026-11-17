import useEditConfirmation from '../../../components/confirmation/useEditConfirmation.ts';
import { useEffect, useState } from 'react';
import type React from 'react';
import { request } from '../../../services/api.ts';
import { useConfirmation } from '../../../components/confirmation/ConfirmationProvider.tsx';
import { locationDefinitions } from './types.ts';
import type { LocationEntry, LocationKind, LocationOverview, Inspection } from './types.ts';

export default function useLocations(kind: LocationKind) {
  const confirmEdit = useEditConfirmation();
  const confirm = useConfirmation();
  const [data, setData] = useState<LocationOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<LocationEntry | null>(null);
  const [formError, setFormError] = useState('');
  const [inspection, setInspection] = useState<Inspection | null>(null);
  useEffect(() => { setDraft(null); setFormError(''); setInspection(null); }, [kind]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    request<{ data: LocationOverview }>('/catalogos/ubicaciones', { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setData(result.data); })
      .catch(error => { if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'No se pudieron cargar las ubicaciones.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  function open(entry: LocationEntry) {
    setFormError('');
    setDraft({ ...entry });
  }
  function inspect(entry: LocationEntry) {
    const key = ({ areas: 'area', campus: 'campus' } as const)[kind];
    setInspection({ title: `Equipos de ${entry.nombre}`, filters: { [key]: String(entry.id) } });
  }
  async function save(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || busy) return;
    if (!draft.nombre.trim()) { setFormError('Escribe un nombre.'); return; }
    if (!await confirmEdit(draft.nombre)) return;
    setBusy(true); setFormError('');
    try {
      await request(`/catalogos/${kind}/${draft.id}`, {
        method: 'PUT', body: { nombre: draft.nombre.trim(), descripcion: draft.descripcion.trim() || null, vigente: draft.vigente },
      });
      setNotice(`${draft.nombre}: cambios guardados.`);
      setDraft(null); setRevision(value => value + 1);
    } catch (error) { setFormError(error instanceof Error ? error.message : 'No se pudo guardar el registro.'); }
    finally { setBusy(false); }
  }
  async function toggle(entry: LocationEntry) {
    if (busy) return;
    setActionError('');
    if (entry.vigente) {
      const reasons = [[entry.equipos_activos, 'equipos activos'], [entry.usuarios_activos, 'usuarios activos']]
        .filter(([count]) => Number(count) > 0).map(([count, label]) => `${count} ${label}`);
      if (reasons.length) { setActionError(`No se puede desactivar «${entry.nombre}»: tiene ${reasons.join(', ')}. `); return; }
      if (!await confirm({ title: `¿Desactivar ${locationDefinitions[kind].singular}?`, description: `«${entry.nombre}» dejará de estar disponible para nuevas asignaciones. Se conservará su historial.`, confirmLabel: 'Desactivar', tone: 'danger' })) return;
    }
    setBusy(true);
    try {
      await request(`/catalogos/${kind}/${entry.id}/${entry.vigente ? 'desactivar' : 'activar'}`, { method: 'POST' });
      setNotice(`${entry.nombre}: estado actualizado.`); setRevision(value => value + 1);
    } catch (error) { setActionError(error instanceof Error ? error.message : 'No se pudo cambiar el estado.'); }
    finally { setBusy(false); }
  }
  return { data, loading, error, actionError, setActionError, notice, setNotice, busy, draft, setDraft, formError,
    inspection, setInspection, open, inspect, save, toggle, retry: () => setRevision(value => value + 1) };
}
