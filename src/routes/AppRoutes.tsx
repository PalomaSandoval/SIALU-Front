import React from 'react';
import AdministrationMain from '../private/catalogos/administracion/Main.tsx';
import { Navigate, Route, Routes } from 'react-router-dom';
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

import AssetTypesMain from '../private/catalogos/tipos-activo/Main.tsx';

import TrafficActionsMain from '../private/catalogos/acciones/Main.tsx';

import TrafficDirectionsMain from '../private/catalogos/sentidos-flujo/Main.tsx';

import EventQueriesMain from '../private/consultas/EventsMain.tsx';

import InstitutionalNetworksMain from '../private/catalogos/redes-institucionales/Main.tsx';

const pages: Record<string, React.ReactNode> = {
  '/servicios/orion': <IntegrationStatus adapter="orion" title="Orion" />,
  '/servicios/palo-alto': <IntegrationStatus adapter="paloalto" title="Palo Alto" />,
  '/catalogos/redes-institucionales': <InstitutionalNetworksMain />,
  '/consultas/eventos': <EventQueriesMain />,
  '/catalogos/fuentes': <FuentesMain />,
  '/catalogos/ubicaciones': <LocationsMain />,
  '/catalogos/niveles': <LevelsMain />,
  '/catalogos/tipos-activo': <AssetTypesMain />,
  '/catalogos/acciones': <TrafficActionsMain />,
  '/catalogos/sentidos-flujo': <TrafficDirectionsMain />,
  '/catalogos/identificadores-activo': <AdministrationMain key="identificadores-activo" kind="identificadores-activo" />,
  '/catalogos/interfaces': <AdministrationMain key="interfaces" kind="interfaces" />,
  '/catalogos/identificadores-interfaz': <AdministrationMain key="identificadores-interfaz" kind="identificadores-interfaz" />,
  '/catalogos/grupos-infraestructura': <AdministrationMain key="grupos" kind="grupos-infraestructura" />,
  '/catalogos/grupos-activos': <AdministrationMain key="grupos-activos" kind="grupos-activos" />,
  '/catalogos/contextos-red': <AdministrationMain key="contextos" kind="contextos-red" />,
  '/catalogos/contextos-fuente': <AdministrationMain key="bindings" kind="contextos-fuente" />,
  '/catalogos/asignaciones-ip': <AdministrationMain key="ips" kind="asignaciones-ip" />,
  '/catalogos/usuarios': <AdministrationMain key="usuarios" kind="usuarios" />,
  '/catalogos/tipos-usuarios': <AdministrationMain key="roles" kind="tipos-usuarios" />,
  '/catalogos/permisos': <AdministrationMain key="permisos" kind="permisos" />,
  '/catalogos/tipos-usuarios-permisos': <AdministrationMain key="asignaciones" kind="tipos-usuarios-permisos" />,
};
export default function AppRoutes() {
  return <Routes>
    <Route element={<PublicRoute />}><Route path="/login" element={<LoginMain />} /></Route>
    <Route element={<PrivateRoute />}><Route element={<PrivateMain />}>
      <Route path="/catalogos/tipos-usuario" element={<Navigate to="/catalogos/tipos-usuarios" replace />} />
      {menuPages().map(page => <Route key={page.path} path={page.path} element={pages[page.path] ?? <SectionPage title={page.title} section={page.section} />} />)}
      {['criticidad', 'severidad'].map(section => <Route key={section} path={`/catalogos/${section}`} element={<Navigate to={`/catalogos/niveles?seccion=${section}`} replace />} />)}
      {['areas', 'campus', 'unidades-institucionales'].map(section => <Route key={section} path={`/catalogos/${section}`} element={<Navigate to={`/catalogos/ubicaciones?seccion=${section}`} replace />} />)}
    </Route></Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>;
}
