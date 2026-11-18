import React from 'react';
import AdministrationMain from '../private/catalogos/administracion/Main.tsx';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import PublicRoute from './PublicRoute.tsx';
import PrivateRoute from './PrivateRoute.tsx';
import LoginMain from '../public/login/Main.tsx';
import PrivateMain from '../private/Main.tsx';
import SectionPage from '../private/components/SectionPage.tsx';
import { menuPages } from '../private/sidebar/menu.ts';
import LocationsMain from '../private/catalogos/ubicaciones/Main.tsx';
import LevelsMain from '../private/catalogos/niveles/Main.tsx';
import FuentesMain from '../private/catalogos/fuentes/Main.tsx';
import IntegrationStatus from '../private/servicios/IntegrationStatus.tsx';
import OrionAlerts from '../private/servicios/OrionAlerts.tsx';
import OrionAvailability from '../private/servicios/OrionAvailability.tsx';
import OrionIncidents from '../private/servicios/OrionIncidents.tsx';
import OrionNodeAvailability from '../private/servicios/OrionNodeAvailability.tsx';
import OrionMonthlyAvailability from '../private/servicios/OrionMonthlyAvailability.tsx';

import TrafficActionsMain from '../private/catalogos/acciones/Main.tsx';

import EventQueriesMain from '../private/consultas/EventsMain.tsx';
import MonitoreoMain from '../private/monitoreo/Main.tsx';
import ThreatsBySeverity from '../private/monitoreo/ThreatsBySeverity.tsx';
import ThreatProfile from '../private/monitoreo/ThreatProfile.tsx';

const pages: Record<string, React.ReactNode> = {
  '/': <MonitoreoMain />,
  '/servicios/orion': <IntegrationStatus adapter="orion" title="Orion" />,
  '/servicios/orion/alertas': <OrionAlerts />,
  '/servicios/orion/eventos': <OrionAvailability />,
  '/servicios/orion/incidentes': <OrionIncidents />,
  '/servicios/orion/disponibilidad-nodos': <OrionNodeAvailability />,
  '/servicios/orion/reporte-mensual': <OrionMonthlyAvailability />,
  '/servicios/palo-alto': <IntegrationStatus adapter="paloalto" title="Palo Alto" />,
  '/consultas/eventos': <EventQueriesMain />,
  '/catalogos/fuentes': <FuentesMain />,
  '/catalogos/ubicaciones': <LocationsMain />,
  '/catalogos/niveles': <LevelsMain />,
  '/catalogos/acciones': <TrafficActionsMain />,
  '/catalogos/usuarios': <AdministrationMain key="usuarios" kind="usuarios" />,
  '/catalogos/tipos-usuarios': <AdministrationMain key="roles" kind="tipos-usuarios" />,
  '/catalogos/permisos': <AdministrationMain key="permisos" kind="permisos" />,
  '/catalogos/tipos-usuarios-permisos': <AdministrationMain key="asignaciones" kind="tipos-usuarios-permisos" />,
};
/** Old URL of «Eventos de Orion»: keeps its filters (query string). */
function OrionEventsRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/servicios/orion/eventos${search}`} replace />;
}

export default function AppRoutes() {
  return <Routes>
    <Route element={<PublicRoute />}><Route path="/login" element={<LoginMain />} /></Route>
    <Route element={<PrivateRoute />}><Route element={<PrivateMain />}>
      <Route path="/catalogos/tipos-usuario" element={<Navigate to="/catalogos/tipos-usuarios" replace />} />
      {menuPages().map(page => <Route key={page.path} path={page.path} element={pages[page.path] ?? <SectionPage title={page.title} section={page.section} />} />)}
      <Route path="/servicios/orion/disponibilidad" element={<OrionEventsRedirect />} />
      <Route path="/monitoreo/amenazas" element={<ThreatsBySeverity />} />
      <Route path="/monitoreo/amenazas/ficha" element={<ThreatProfile />} />
      <Route path="/catalogos/severidad" element={<Navigate to="/catalogos/niveles" replace />} />
      {['areas', 'campus'].map(section => <Route key={section} path={`/catalogos/${section}`} element={<Navigate to={`/catalogos/ubicaciones?seccion=${section}`} replace />} />)}
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
