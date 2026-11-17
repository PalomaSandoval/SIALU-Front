import { X } from 'lucide-react';
import useLevels from './useLevels.ts';
import LevelForm from './components/LevelForm.tsx';
import LevelsList from './components/LevelsList.tsx';

export default function LevelsMain() {
  const levels = useLevels();
  return <div className="levels-page"><style>{styles}</style>
    <header className="levels-heading"><div><h1>Niveles de severidad</h1><p>Gravedad de los eventos que recibe SIALU.</p></div></header>
    {levels.notice && <div className="levels-notice" role="status">{levels.notice}<button aria-label="Cerrar aviso" onClick={() => levels.setNotice('')}><X size={17} /></button></div>}
    <LevelsList items={levels.items} loading={levels.loading} busy={levels.busy} error={levels.error} title="Niveles de severidad"
      onRetry={levels.retry} onEdit={levels.open} />
    <LevelForm draft={levels.draft} busy={levels.busy} error={levels.formError} onChange={levels.setDraft} onSave={levels.save} />
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
.levels-notice{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:20px;font-size:13px;color:var(--palette-primary);line-height:1.7}
.levels-notice button{display:grid;place-items:center;min-width:40px;min-height:40px;border:0;border-radius:50%;background:transparent;color:var(--palette-muted);cursor:pointer}
.levels-page button:disabled{opacity:.5;cursor:default}
.levels-page button:focus-visible,.levels-page input:focus-visible,.levels-page textarea:focus-visible{outline:2px solid var(--palette-muted);outline-offset:3px}
.levels-page .severity-level{display:inline-flex;align-items:center;justify-content:center;min-width:28px;min-height:28px;padding:3px 8px;border:1px solid #cbd5e1;border-radius:7px;background:#f1f5f9;color:#475569;font-size:13px;font-weight:700;line-height:1}
.levels-page .severity-level--1{border-color:#bfdbfe;background:#eff6ff;color:#1d4ed8}
.levels-page .severity-level--2{border-color:#bbf7d0;background:#f0fdf4;color:#166534}
.levels-page .severity-level--3{border-color:#fde68a;background:#fffbeb;color:#92400e}
.levels-page .severity-level--4{border-color:#fed7aa;background:#fff7ed;color:#9a3412}
.levels-page .severity-level--5{border-color:#fecaca;background:#fef2f2;color:#b91c1c}
@media(max-width:800px){.levels-page{padding:28px 20px}}
`;
