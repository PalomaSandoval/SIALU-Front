export default function FuentesHeader() {
  return <><style>{styles}</style><header className="fu-heading">
    <div><h1>Fuentes de datos</h1><p>Fuentes que administra SIALU</p></div>
  </header></>;
}

const styles = `
.fu-heading{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:24px;margin-bottom:32px}
.fu-heading>div{flex:1 1 390px;min-width:0}
.private-content .fu-heading h1{font-size:24px;font-weight:700;letter-spacing:-.03em;line-height:1.04;color:var(--palette-text);margin:0 0 20px}
.fu-heading p{font-size:13px;line-height:1.65;color:var(--palette-muted);max-width:560px;margin:0}
`;
