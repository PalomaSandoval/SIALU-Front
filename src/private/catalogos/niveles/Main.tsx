import { useSearchParams } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import useLevels from './useLevels.ts';
import { definitions } from './types.ts';
import type { LevelKind } from './types.ts';
import LevelForm from './components/LevelForm.tsx';
import LevelsList from './components/LevelsList.tsx';

export default function LevelsMain() {
  const [params, setParams] = useSearchParams();
  const kind: LevelKind = params.get('seccion') === 'severidad' ? 'severidad' : 'criticidad';
  return <LevelsContent key={kind} kind={kind} onTab={value => setParams({ seccion: value })} />;
}
function LevelsContent({ kind, onTab }: { kind: LevelKind; onTab: (kind: LevelKind) => void }) {
  const levels = useLevels(kind);
  return <div className="levels-page"><style>{styles}</style>
    <header className="levels-heading"><div><h1>Niveles de clasificación</h1><p>Define la criticidad de los activos y la severidad de los eventos.</p></div>
      <button className="level-button primary" disabled={levels.loading || levels.busy || !!levels.error} onClick={() => levels.open()}><Plus size={17} />Agregar nivel de {kind}</button>
    </header>
    <div className="levels-tabs" role="group" aria-label="Tipo de clasificación">
      {(['criticidad', 'severidad'] as const).map(value => <button key={value} aria-pressed={kind === value} disabled={levels.busy} onClick={() => onTab(value)}>{definitions[value].title}</button>)}
    </div>
    <p className="levels-description">{definitions[kind].description}</p>
    {levels.notice && <div className="levels-notice" role="status">{levels.notice}<button aria-label="Cerrar aviso" onClick={() => levels.setNotice('')}><X size={17} /></button></div>}
    {levels.actionError && <p className="levels-error" role="alert">{levels.actionError}</p>}
    <LevelsList items={levels.items} loading={levels.loading} busy={levels.busy} error={levels.error} title={definitions[kind].title}
      onRetry={levels.retry} onEdit={levels.open} onToggle={levels.toggle} />
    <LevelForm kind={kind} draft={levels.draft} busy={levels.busy} error={levels.formError} onChange={levels.setDraft} onSave={levels.save} />
  </div>;
}
const styles = `
.levels-page{--palette-primary:var(--palette-editorialPrimary);--palette-text:var(--palette-editorialText);--palette-muted:var(--palette-editorialMuted);width:100%;padding:48px;font-family:var(--font-body);font-size:13px;color:var(--palette-text);background:var(--palette-editorialSurface)}
.private-content:has(> .levels-page){padding:0;background:var(--palette-editorialSurface)}
.levels-page *{box-sizing:border-box}
.levels-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;flex-wrap:wrap;margin-bottom:28px}
.private-content .levels-heading h1{font-size:24px;font-weight:600;line-height:1.3;letter-spacing:-.02em;margin:0 0 12px}
.levels-heading p{margin:0;font-size:13px;color:var(--palette-muted);line-height:1.7}
.level-button{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:10px 18px;border:1px solid var(--palette-editorialControlBorder);border-radius:9px;background:var(--palette-white);color:var(--palette-text);font:inherit;font-size:13px;font-weight:600;cursor:pointer}
.level-button.primary{border-color:var(--palette-primary);background:var(--palette-primary);color:var(--palette-white)}
.level-button:hover{filter:brightness(.95)}
.levels-tabs{display:flex;gap:24px;flex-wrap:wrap;margin-bottom:16px}
.levels-tabs button{border:0;border-bottom:3px solid transparent;background:transparent;color:var(--palette-muted);padding:12px 0;font:inherit;font-weight:500;cursor:pointer}
.levels-tabs button[aria-pressed=true]{color:var(--palette-editorialPrimary);border-bottom-color:var(--palette-tabIndicator);font-weight:700}
.levels-description{margin:0 0 28px;font-size:12px;color:var(--palette-muted);line-height:1.7}
.levels-notice{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px;font-size:13px;color:var(--palette-primary);line-height:1.7}
.levels-notice button{display:grid;place-items:center;min-width:40px;min-height:40px;border:0;border-radius:50%;background:transparent;color:var(--palette-muted);cursor:pointer}
.levels-error{padding:14px 0;font-size:13px;color:var(--palette-errorText);line-height:1.7}
.levels-page button:disabled{opacity:.5;cursor:default}
.levels-page button:focus-visible,.levels-page input:focus-visible,.levels-page textarea:focus-visible{outline:2px solid var(--palette-muted);outline-offset:3px}
@media(max-width:800px){.levels-page{padding:28px 20px}.levels-tabs{gap:16px}}
`;
