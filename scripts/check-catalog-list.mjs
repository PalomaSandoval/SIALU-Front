import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

// Render real components with two unrelated data shapes; no API or database calls.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { default: CatalogList } = await server.ssrLoadModule('/src/components/catalogos/CatalogList.tsx');
  const { default: FuentesList } = await server.ssrLoadModule('/src/private/catalogos/fuentes/components/FuentesList.tsx');
  const render = (Component, props) => renderToStaticMarkup(createElement(Component, props));
  const base = {
    items: [
      { IdArea: 11, Nombre: 'Soporte', Vigente: true },
      { IdArea: 12, Nombre: 'Archivo', Vigente: false },
      { IdArea: 13, Nombre: 'Redes', Vigente: true },
    ],
    getKey: item => item.IdArea, getTitle: item => item.Nombre,
    isActive: item => item.Vigente, pageSize: 2,
  };
  const readonly = render(CatalogList, base);
  assert.match(readonly, /Soporte/);
  assert.match(readonly, /Archivo/);
  assert.doesNotMatch(readonly, />Redes</);
  assert.match(readonly, /Mostrando 2 de 3 registros/);
  assert.match(readonly, /Página 1 de 2/);
  assert.doesNotMatch(readonly, /aria-label="Editar registro"/);
  const editable = render(CatalogList, { ...base, onEdit() {}, onToggle() {} });
  assert.match(editable, /aria-label="Editar registro"/);
  assert.match(editable, /aria-label="Desactivar registro"/);
  assert.match(editable, /aria-label="Activar registro"/);
  const noState = render(CatalogList, { ...base, isActive: undefined });
  assert.doesNotMatch(noState, /aria-label="Filtrar por estado"/);
  assert.match(render(CatalogList, { ...base, items: [] }), /No hay registros que coincidan/);
  const loading = render(CatalogList, { ...base, loading: true });
  assert.match(loading, /Cargando registros/);
  assert.doesNotMatch(loading, />Soporte</);
  const error = render(CatalogList, { ...base, error: 'No disponible', onRetry() {} });
  assert.match(error, /role="alert"/);
  assert.match(error, /Reintentar/);
  assert.doesNotMatch(error, />Soporte</);
  const sources = render(FuentesList, {
    items: [{ id: 8, nombre: 'Palo Alto', fabricante: 'Palo Alto Networks', metodo: 'API', zona: 'UTC', vigente: true }],
    loading: false, busy: false, error: '', onRetry() {}, onEdit() {}, async onToggle() {},
  });
  assert.match(sources, /Palo Alto Networks/);
  assert.match(sources, /Integración/);
  assert.match(sources, /Zona horaria/);
  assert.doesNotMatch(sources, />Responsable</);
  assert.match(sources, /Mostrando 1 de 1 fuentes/);
  const withInspection = render(CatalogList, { ...base, actions: [{ key: 'usage', label: 'Ver equipos', icon: createElement('span', null, 'Ver'), onClick() {} }] });
  assert.match(withInspection, /aria-label="Ver equipos: Soporte"/);
  assert.doesNotMatch(withInspection, /aria-label="Editar registro"/);
  const { MemoryRouter } = await import('react-router-dom');
  const { ConfirmationProvider } = await server.ssrLoadModule('/src/components/confirmation/ConfirmationProvider.tsx');
  const { default: LocationsMain } = await server.ssrLoadModule('/src/private/catalogos/ubicaciones/Main.tsx');
  const locationsPage = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ['/catalogos/ubicaciones?seccion=campus'] },
    createElement(ConfirmationProvider, null, createElement(LocationsMain))));
  assert.match(locationsPage, /Ubicaciones y dependencias/);
  assert.doesNotMatch(locationsPage, /Agregar ubicación/);
  const areasPage = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ['/catalogos/ubicaciones?seccion=areas'] },
    createElement(ConfirmationProvider, null, createElement(LocationsMain))));
  assert.doesNotMatch(areasPage, /Agregar área/);
  assert.match(locationsPage, /sin área/);
  assert.doesNotMatch(locationsPage, /Unidades institucionales/);
  assert.doesNotMatch(locationsPage, /sin unidad/);
  assert.match(locationsPage, /Cargando registros/);
  assert.doesNotMatch(locationsPage, /Usuarios activos/);
  assert.doesNotMatch(locationsPage, /Los grupos, campus y unidades se relacionan mediante los equipos/);
  const { default: LevelsMain } = await server.ssrLoadModule('/src/private/catalogos/niveles/Main.tsx');
  const { default: LevelForm } = await server.ssrLoadModule('/src/private/catalogos/niveles/components/LevelForm.tsx');
  const editLevelForm = render(LevelForm, { draft: { id: 1, nombre: 'Alta', descripcion: 'Gravedad alta', nivel: 5, vigente: true }, busy: false, error: '', onChange() {}, async onSave() {} });
  assert.match(editLevelForm, /Editar nivel de severidad/);
  assert.match(editLevelForm, /<input[^>]*type="number"[^>]*readOnly=""[^>]*value="5"/i);
  const { default: LevelsList } = await server.ssrLoadModule('/src/private/catalogos/niveles/components/LevelsList.tsx');
  const severityList = render(LevelsList, { title: 'Niveles de severidad', items: [{ id: 1, nombre: 'Alta', descripcion: 'Gravedad alta', nivel: 5, vigente: true }], loading: false, busy: false, error: '', onRetry() {}, onEdit() {} });
  assert.match(severityList, /aria-label="Editar nivel"/);
  assert.doesNotMatch(severityList, /aria-label="(?:Desactivar|Activar) nivel"/);
  const levelsPage = renderToStaticMarkup(createElement(MemoryRouter, { initialEntries: ['/catalogos/niveles'] },
    createElement(ConfirmationProvider, null, createElement(LevelsMain))));
  assert.match(levelsPage, /Niveles de severidad/);
  assert.doesNotMatch(levelsPage, /Agregar nivel de severidad/);
  assert.doesNotMatch(levelsPage, /Criticidad de activos|Tipo de clasificación/);
  assert.match(levelsPage, /Cargando registros/);
  console.log('PASS: shared catalog rendering, optional actions, pagination, loading, error and Fuentes adapter.');
} finally {
  await server.close();
}
