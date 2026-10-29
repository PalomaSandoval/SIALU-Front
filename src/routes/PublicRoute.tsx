import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.tsx';

export default function PublicRoute() {
  const { session, loading } = useAuth();
  if (loading) return null;
  return session ? <Navigate to="/" replace /> : <Outlet />;
}

