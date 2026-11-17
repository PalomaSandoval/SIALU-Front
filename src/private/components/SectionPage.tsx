import React from 'react';

export default function SectionPage({ title, section }: { title: string; section: string }) {
  const description = section.includes('Orion')
    ? 'Supervisa los equipos, su disponibilidad y las alertas de infraestructura.'
    : section.includes('Palo Alto')
      ? 'Explora las detecciones, el tráfico y las amenazas de tu infraestructura.'
      : section === 'Administración'
        ? 'Administra la información de referencia y el estado de los registros.'
        : section === 'Consultas'
          ? 'Consulta la actividad y relaciona los eventos de tus fuentes.'
          : 'Una vista general de la seguridad y disponibilidad de tu infraestructura.';
  return <>
    <nav className="section-breadcrumb" aria-label="Ubicación">{section || 'Inicio'} / <span aria-current="page">{title}</span></nav>
    <header className="section-heading"><div><h1>{title}</h1><p>{description}</p></div></header>
    <section className="section-placeholder"><h2>{title === 'Monitoreo' ? 'Resumen general' : title}</h2><p>{title === 'Fuentes de datos' && section === 'Administración'
      ? 'Aquí se integrará el listado de fuentes y las acciones para agregar, editar, activar y desactivar.'
      : 'Sección preparada para integrar su contenido.'}</p></section>
  </>;
}
