import { useEffect, useState } from 'react';
import { request } from '../../services/api.ts';
import { FreshnessPanel, type Freshness } from './freshness.tsx';
import IngestionCoverage from './IngestionCoverage.tsx';

type Status = {
  registro: string; nombre?: string | null; ultimo_exito: string | null;
  ultimo_intento: { estado: string; inicio: string; fin: string | null } | null; flujos: Freshness[];
};

export default function IntegrationStatus({ adapter, title }: { adapter: 'orion' | 'paloalto'; title: string }) {
  const [data, setData] = useState<Status | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError('');
    request<{ data: Status }>(`/integraciones/${adapter}/estado`, { signal: controller.signal })
      .then(result => setData(result.data))
      .catch(reason => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'No se pudo consultar el estado.'); });
    return () => controller.abort();
  }, [adapter, reload]);
  const registration: Record<string, string> = { activa: 'Fuente registrada y activa', inactiva: 'Fuente registrada e inactiva', no_registrada: 'Fuente configurada no registrada', sin_configurar: 'Identificador de fuente sin configurar o inválido' };
  return <section>
    <h1>{title}</h1>
    <p>Estado de la fuente y de cada flujo de ingesta. El último intento y la última consulta exitosa se muestran por separado: un intento fallido no actualiza los datos. Fechas en UTC.</p>
    {error ? <div role="alert"><p>{error}</p><button onClick={() => setReload(value => value + 1)}>Reintentar</button></div> : !data ? <p>Cargando estado…</p> : <>
      <dl>
        <dt>Registro</dt><dd>{registration[data.registro] || 'Desconocido'}{data.nombre ? `: ${data.nombre}` : ''}</dd>
      </dl>
      {data.flujos.map(f => <FreshnessPanel key={f.flujo} freshness={f} />)}
      <p className="ingestion-note">Estos datos no prueban la conexión actual. Los fallos de conexión que ocurren antes de procesar un lote no quedan registrados como intento.</p>
      <button onClick={() => setReload(value => value + 1)}>Actualizar</button>
    </>}
    <IngestionCoverage key={reload} adapter={adapter} />
  </section>;
}
