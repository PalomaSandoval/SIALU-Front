import { useEffect, useState } from 'react';
import { request } from '../../services/api.ts';

type Status = { registro: string; nombre?: string | null; ultimo_exito: string | null; ultimo_intento: { estado: string; inicio: string; fin: string | null } | null };
const date = (value: string | null) => value ? `${value} UTC` : 'Sin registros';

export default function IntegrationStatus({ adapter, title }: { adapter: string; title: string }) {
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
    <p>Estado de la fuente y de los lotes procesados. Las credenciales se configuran en el servidor.</p>
    {error ? <div role="alert"><p>{error}</p><button onClick={() => setReload(value => value + 1)}>Reintentar</button></div> : !data ? <p>Cargando estado…</p> : <>
      <dl>
        <dt>Registro</dt><dd>{registration[data.registro] || 'Desconocido'}{data.nombre ? `: ${data.nombre}` : ''}</dd>
        <dt>Último intento de procesamiento</dt><dd>{data.ultimo_intento ? `${data.ultimo_intento.estado} — ${date(data.ultimo_intento.fin || data.ultimo_intento.inicio)}` : 'Sin registros'}</dd>
        <dt>Último lote procesado correctamente</dt><dd>{date(data.ultimo_exito)}</dd>
        <dt>Error del último intento</dt><dd>{data.ultimo_intento?.estado === 'FALLIDO' ? 'El procesamiento del lote falló. Consulte el registro del servidor para obtener detalles.' : 'Sin error registrado en el último intento'}</dd>
      </dl>
      <p>Estos datos no prueban la conexión actual. Las consultas sin eventos y los errores anteriores al procesamiento de un lote pueden no aparecer aquí.</p>
      <button onClick={() => setReload(value => value + 1)}>Actualizar</button>
    </>}
  </section>;
}
