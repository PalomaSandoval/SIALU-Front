import React, { useState } from 'react';
import { useAuth } from './AuthProvider.tsx';
import { errorMessage } from '../services/errors.ts';

export default function LogoutButton() {
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await logout();
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return <div>
    <button type="button" onClick={handleLogout} disabled={busy} aria-busy={busy}>
      {busy ? 'Cerrando sesión' : 'Cerrar sesión'}
    </button>
    {error && <p role="alert">{error}</p>}
  </div>;
}
