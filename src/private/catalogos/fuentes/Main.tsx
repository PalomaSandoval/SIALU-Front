import { X } from 'lucide-react';
import useFuentes from './useFuentes.ts';
import FuentesHeader from './components/FuentesHeader.tsx';
import FuentesList from './components/FuentesList.tsx';
import FuenteForm from './components/FuenteForm.tsx';

export default function FuentesMain() {
  const fuentes = useFuentes();
  return <div className="fu-page">
    <style>{styles}</style>
    <FuentesHeader />
    {fuentes.notice && <div className="fu-notice" role="status">
      {fuentes.notice}<button aria-label="Cerrar aviso" onClick={() => fuentes.setNotice('')}><X size={18} aria-hidden="true" /></button>
    </div>}
    <FuentesList items={fuentes.rows} loading={fuentes.loading} busy={fuentes.busy} error={fuentes.loadError}
      onRetry={fuentes.retry} onEdit={fuentes.open} onToggle={fuentes.toggle} />
    <FuenteForm draft={fuentes.draft} busy={fuentes.busy} error={fuentes.error} setDraft={fuentes.setDraft} onSave={fuentes.save} onUploadIcon={fuentes.uploadIcon} />
  </div>;
}

const styles = `
.fu-page{
  --palette-primary: var(--palette-editorialPrimary);
  --palette-text: var(--palette-editorialText);
  --palette-muted: var(--palette-editorialMuted);
  --palette-legacyMuted: var(--palette-editorialMuted);
  --palette-legacyBorder: var(--palette-editorialControlBorder);
  --palette-neutralSurface: var(--palette-editorialBorder);
  --palette-noticeSurface: var(--palette-editorialTint);
  --fu-surface: var(--palette-editorialSurface);
  width:100%;max-width:none;margin:0;padding:56px 48px;
  background:var(--fu-surface);color:var(--palette-text);font-family:var(--font-body);font-size:13px;
}
.private-content:has(> .fu-page){padding:0;background:var(--palette-editorialSurface)}
.fu-page *, .fu-page *::before, .fu-page *::after{box-sizing:border-box}
.fu-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px 20px;border:1px solid var(--palette-legacyBorder);border-radius:999px;background:var(--palette-white);color:var(--palette-text);font:inherit;font-weight:600;cursor:pointer}
.fu-button.fu-primary{min-height:48px;background:var(--palette-primary);border-color:var(--palette-primary);color:var(--palette-white);font-size:13px;flex-shrink:0}
.fu-button.fu-primary:hover{background:var(--palette-text);border-color:var(--palette-text)}
.fu-notice{display:flex;align-items:center;justify-content:space-between;gap:16px;color:var(--palette-primary);font-size:12px;line-height:1.6;margin-bottom:24px}
.fu-load-error{padding:32px 0;color:var(--palette-errorText);font-size:13px;line-height:1.6}
.fu-page button:focus-visible,.fu-page a:focus-visible,.fu-page input:focus-visible,.fu-page summary:focus-visible{outline:2px solid var(--palette-primary);outline-offset:4px}
.fu-page button:disabled{opacity:.5;cursor:default}
.fu-page fieldset:disabled{opacity:.7}
@media(max-width:800px){.fu-page{padding:72px 24px}.private-content .fu-heading h1{font-size:24px}}
@media(max-width:600px){.fu-heading>div{flex-basis:100%}.private-content .fu-heading h1{font-size:24px}}
`;
