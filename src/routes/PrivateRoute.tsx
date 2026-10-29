import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.tsx';

export default function PrivateRoute() {
  const { pathname } = useLocation();
  const { session, loading, error } = useAuth();
  if (loading) return null;
  if (!session) return <Navigate to="/login" replace />;
  if ((pathname.startsWith('/catalogos') || pathname === '/consultas/eventos') && session.data.TipoUsuario.trim().toUpperCase() !== 'ADMINISTRADOR') return <p role="alert">No tienes permisos para acceder a esta sección.</p>;
  return <>{error && <p role="alert">{error}</p>}<Outlet /></>;
}

