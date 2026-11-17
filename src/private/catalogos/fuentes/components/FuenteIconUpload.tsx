import { useRef } from 'react';
import type { Fuente } from '../types.ts';

export default function FuenteIconUpload({ fuente, busy, onUpload }: { fuente: Fuente; busy: boolean; onUpload: (file: File) => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null);
  return <section className="fu-icon-section" aria-label="Ícono de la fuente">
    <div className="fu-icon-preview">
      {fuente.icono_url ? <img src={fuente.icono_url} alt={`Ícono de ${fuente.nombre}`} /> : <span>Sin imagen</span>}
    </div>
    <div>
      <strong>Ícono de la fuente</strong>
      <p>PNG, JPG o WebP de hasta 2 MB. Se guarda al seleccionarla.</p>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="fu-file-input" aria-label="Seleccionar ícono de la fuente" disabled={busy} onChange={event => {
        const file = event.currentTarget.files?.[0];
        event.currentTarget.value = '';
        if (file) void onUpload(file);
      }} />
      <button type="button" className="fu-button fu-icon-upload" disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Subiendo…' : fuente.icono_url ? 'Cambiar imagen' : 'Agregar imagen'}</button>
    </div>
  </section>;
}
