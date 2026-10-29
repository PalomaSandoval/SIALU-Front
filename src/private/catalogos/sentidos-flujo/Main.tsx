const classifications = [
  { nombre: 'Hacia la UACH', origen: 'Fuera de la UACH', destino: 'Red UACH', descripcion: 'Una conexión desde fuera tiene como destino una IP de la UACH.' },
  { nombre: 'Desde la UACH', origen: 'Red UACH', destino: 'Fuera de la UACH', descripcion: 'Una conexión desde una IP de la UACH tiene como destino una red externa.' },
  { nombre: 'Dentro de la UACH', origen: 'Red UACH', destino: 'Red UACH', descripcion: 'Las IP de origen y destino pertenecen a la UACH.' },
];

export default function TrafficDirectionsMain() {
  return <section className="traffic-classification" aria-labelledby="traffic-classification-title">
    <style>{styles}</style>
    <header>
      <h1 id="traffic-classification-title">Origen y destino del tráfico</h1>
      <p>Identifica de dónde viene una conexión y hacia dónde va, tomando como referencia la red de la UACH.</p>
    </header>
    <div className="traffic-classification-note">
      <h2>¿Cómo lo identifica el sistema?</h2>
      <p>El sistema compara las IP de origen y destino recibidas de Palo Alto con los rangos institucionales de la UACH y aplica los siguientes criterios.</p>
    </div>
    <div className="traffic-classification-table">
      <table>
        <caption>Posibles conexiones según su origen y destino</caption>
        <thead><tr><th scope="col">Conexión</th><th scope="col">Desde dónde</th><th scope="col">Hacia dónde</th><th scope="col">Qué significa</th></tr></thead>
        <tbody>{classifications.map(item => <tr key={item.nombre}>
          <th scope="row">{item.nombre}</th><td>{item.origen}</td><td>{item.destino}</td><td>{item.descripcion}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <aside className="traffic-classification-pending" aria-labelledby="traffic-pending-title">
      <h2 id="traffic-pending-title">Cuando no se puede identificar</h2>
      <p>Si falta una IP, no es válida o no hay rangos institucionales registrados para su versión IP, el sistema deja la conexión pendiente de identificar.</p>
    </aside>
  </section>;
}

const styles = `
.traffic-classification{width:100%;padding:48px;color:var(--palette-editorialText);background:var(--palette-editorialSurface);font:13px var(--font-body)}
.traffic-classification *{box-sizing:border-box}
.private-content:has(> .traffic-classification){padding:0;background:var(--palette-editorialSurface)}
.private-content .traffic-classification h1{font-size:24px;font-weight:600;line-height:1.3;letter-spacing:-.02em;margin:0 0 12px}
.traffic-classification p{margin:0;line-height:1.8;color:var(--palette-editorialMuted);max-width:1000px}
.traffic-classification h2{font-size:14px;font-weight:600;margin:0 0 8px}
.traffic-classification-note{margin:28px 0;padding:20px 24px;border:1px solid var(--palette-editorialBorder);border-radius:12px;background:var(--palette-white)}
.traffic-classification-table{overflow-x:auto}
.traffic-classification table{width:100%;border-collapse:collapse;text-align:left;line-height:1.7}
.traffic-classification caption{text-align:left;color:var(--palette-editorialMuted);padding:0 0 16px;font-size:12px}
.traffic-classification th,.traffic-classification td{padding:20px 16px;border-bottom:1px solid var(--palette-editorialBorder);vertical-align:top}
.traffic-classification thead th{font-size:12px;font-weight:500;color:var(--palette-editorialMuted);white-space:nowrap}
.traffic-classification tbody th{font-weight:600;color:var(--palette-editorialPrimary)}
.traffic-classification td:nth-child(2),.traffic-classification td:nth-child(3){white-space:nowrap}
.traffic-classification td:last-child{min-width:250px;color:var(--palette-editorialMuted)}
.traffic-classification-pending{margin:28px 0 16px;padding:20px 24px;border-left:3px solid var(--palette-editorialControlBorder);background:var(--palette-white);border-radius:0 10px 10px 0}
@media(max-width:700px){.traffic-classification{padding:28px 20px}.traffic-classification th,.traffic-classification td{padding:16px 12px}}
`;
