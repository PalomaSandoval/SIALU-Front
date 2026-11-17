import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { createServer } from 'vite';

// Render the Orion incidents views and the dashboard summary with API-shaped data; no API or database calls.
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { OpenOutagesView, IntermittenceView } = await server.ssrLoadModule('/src/private/servicios/OrionIncidents.tsx');
  const { OrionSummaryBody } = await server.ssrLoadModule('/src/private/monitoreo/OrionSummaryCard.tsx');
  const { menuPages } = await server.ssrLoadModule('/src/private/sidebar/menu.ts');
  const render = (Component, props) => renderToStaticMarkup(createElement(MemoryRouter, null, createElement(Component, props)));
  const now = new Date();
  const stamp = date => date.toISOString().replace('T', ' ').replace('Z', '');
  const ago = minutes => stamp(new Date(now.getTime() - minutes * 60_000));
  const read = { motivo: null, leido_desde: ago(3 * 1440), leido_hasta: ago(1), ultimo_intento: null };
  const status = { verificado: true, motivo: null, consultado_en: ago(2), ultimo_intento: { estado: 'COMPLETADO', fecha: ago(2) } };
  const common = { now, searching: false, loading: false, onPage() {}, from: '/servicios/orion/incidentes' };

  // Navigation: unambiguous names under Servicios / Orion.
  const titles = menuPages().filter(page => page.section === 'Servicios / Orion').map(page => page.title);
  assert.deepEqual(titles, ['Resumen', 'Equipos', 'Incidentes', 'Eventos Down/Up', 'Alertas']);

  const open = {
    disponible: true, generado_en: ago(0), estado: status, lectura_eventos: read, total: 3, page: 1, last_page: 1,
    resumen: { nodos_caidos: 3, activos_afectados: 1, nodos_sin_activo: 1, nodos_ambiguos: 1, con_inicio: 1, nodos_sin_estado: 2, nodos_consultados: 40 },
    nodos: [
      { nodo: '10', correspondencia: 'UNICA', activos: [{ id: 1, nombre: 'Router Norte' }], status: 2, status_nombre: 'Down', caido_desde: ago(125), motivo_inicio: null },
      { nodo: '50', correspondencia: 'AMBIGUA', activos: [{ id: 4, nombre: 'Dup A' }, { id: 5, nombre: 'Dup B' }], status: 2, status_nombre: 'Down', caido_desde: null, motivo_inicio: 'correspondencia_ambigua' },
      { nodo: '70', correspondencia: 'SIN_ACTIVO', activos: [], status: 2, status_nombre: 'Down', caido_desde: null, motivo_inicio: 'sin_activo' },
    ],
  };
  let html = render(OpenOutagesView, { ...common, data: open });
  assert.match(html, /Nodos de Orion caídos<\/dt><dd>3/);
  assert.match(html, /Activos de SIALU afectados<\/dt><dd>1/);
  assert.match(html, /NodeID 70/);
  assert.match(html, /Sin activo en SIALU/);
  assert.match(html, /2 h 5 min/, 'elapsed time of the known start');
  assert.equal((html.match(/Inicio no registrado/g) ?? []).length, 2);
  assert.match(html, /2 caídas no tienen inicio registrado: su duración es desconocida/);
  assert.match(html, /2 nodos tienen un estado que SIALU no interpreta/);
  assert.match(html, /href="\/servicios\/orion\/eventos\?q=10&amp;desde=\d{4}-\d{2}-\d{2}&amp;hasta=/);
  assert.doesNotMatch(html, /Ver eventos del NodeID 70/, 'no events link for a node whose events are never stored');
  assert.doesNotMatch(html, /y \d+ más/);

  // Stale snapshot: reason, no figure presented as current.
  html = render(OpenOutagesView, { ...common, data: { ...open, estado: { ...status, verificado: false, motivo: 'instantanea_desactualizada' }, resumen: null, nodos: null } });
  assert.match(html, /Estado de Orion desactualizado/);
  assert.match(html, /No se muestra ninguna cifra como actual/);
  assert.doesNotMatch(html, /Nodos de Orion caídos/);

  // Events read not current: starts are not offered and the reason is given.
  html = render(OpenOutagesView, { ...common, data: { ...open, lectura_eventos: { ...read, motivo: 'lectura_desactualizada' } } });
  assert.match(html, /Inicios no disponibles/);

  html = render(OpenOutagesView, { ...common, data: { ...open, resumen: { ...open.resumen, nodos_caidos: 0, activos_afectados: 0, nodos_sin_activo: 0, nodos_ambiguos: 0, con_inicio: 0 }, nodos: [], total: 0 } });
  assert.match(html, /Ningún nodo está caído en la última consulta de estado/);
  html = render(OpenOutagesView, { ...common, searching: true, data: { ...open, nodos: [], total: 0 } });
  assert.match(html, /Ningún nodo caído coincide con la búsqueda/);

  const episodes = Array.from({ length: 7 }, (_, index) => ({ id: index + 1, activo_id: 3, caida: ago(60 * (index + 1)), recuperacion: ago(60 * (index + 1) - 2), duracion_segundos: 120, en_curso: false }));
  const flaps = {
    disponible: true, horas: 24, desde: ago(1440), hasta: ago(0), generado_en: ago(0), inicio_periodo: ago(1440),
    cobertura: { desde: ago(1440), hasta: ago(1), completa: true }, estado: status, lectura_eventos: read,
    resumen: { nodos_intermitentes: 2, episodios: 9 }, total: 2, page: 1, last_page: 1,
    nodos: [
      { nodo: '30', activos: [{ id: 3, nombre: 'AP Biblioteca' }], episodios: 7, estado_actual: 'EN_LINEA', episodios_detalle: episodes },
      { nodo: '10', activos: [{ id: 1, nombre: 'Router Norte' }], episodios: 2, estado_actual: 'CAIDO', episodios_detalle: [
        { id: 20, activo_id: 1, caida: ago(125), recuperacion: null, duracion_segundos: null, en_curso: true },
        { id: 21, activo_id: 1, caida: ago(360), recuperacion: null, duracion_segundos: null, en_curso: false },
      ] },
    ],
  };
  html = render(IntermittenceView, { ...common, data: flaps });
  assert.match(html, /Nodos intermitentes<\/dt><dd>2/);
  assert.match(html, /duró 2 min/);
  assert.match(html, /Ver 2 más/);
  assert.match(html, /sigue caído/);
  assert.match(html, /sin Up registrado/);
  assert.match(html, /En línea/);
  assert.match(html, /La lectura de eventos de Orion cubre todo el periodo/);

  html = render(IntermittenceView, { ...common, data: { ...flaps, cobertura: { desde: ago(600), hasta: ago(1), completa: false }, estado: { ...status, verificado: false, motivo: 'consulta_fallida' } } });
  assert.match(html, /≥ 2/);
  assert.match(html, /las cifras pueden ser mayores/);
  assert.match(html, /Estado actual no disponible/);

  html = render(IntermittenceView, { ...common, data: { ...flaps, horas: 168, nodos: [], total: 0, resumen: { nodos_intermitentes: 0, episodios: 0 } } });
  assert.match(html, /Ningún nodo tuvo dos o más caídas en los últimos 7 días/);

  // Dashboard: the compact response identifies affected nodes without loading episode histories.
  html = render(OrionSummaryBody, { open: { ...open, vista_previa: open.nodos, nodos: null }, intermittent: { ...flaps, vista_previa: flaps.nodos, nodos: null } });
  assert.match(html, /Nodos caídos ahora<\/dt><dd>3/);
  assert.match(html, /Intermitentes \(24 horas\)<\/dt><dd>2/);
  assert.match(html, /1 nodo caído no tiene activo en SIALU/);
  assert.match(html, /Router Norte/);
  assert.match(html, /AP Biblioteca/);
  assert.match(html, /NodeID 70/);
  assert.match(html, /Asociación ambigua: Dup A, Dup B/);
  assert.match(html, /7 caídas/);
  html = render(OrionSummaryBody, { open: { ...open, estado: { ...status, verificado: false, motivo: 'consulta_fallida' }, resumen: null, nodos: null }, intermittent: null });
  assert.match(html, /Falló la consulta de estado de Orion/);
  assert.doesNotMatch(html, /Nodos caídos ahora/);
  console.log('PASS: Orion incidents views, dashboard summary and navigation render as expected.');
} finally {
  await server.close();
}
