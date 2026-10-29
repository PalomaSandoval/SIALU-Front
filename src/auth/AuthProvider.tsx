import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { SessionResponse } from '../types/api.ts';
import { errorMessage } from '../services/errors.ts';
import { api, ApiError } from '../services/api.ts';

interface AuthContextValue {
  session: SessionResponse | null;
  loading: boolean;
  error: string;
  login: (uid: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api.me({ signal: controller.signal }).then(setSession).catch(error => {
      if (!controller.signal.aborted && (!(error instanceof ApiError) || error.status !== 401)) setError(errorMessage(error));
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  async function login(uid: string, password: string) {
    setError('');
    await api.login(uid, password);
    setSession(await api.me());
  }
  async function logout() {
    try { await api.logout(); }
    catch (error) { if ((!(error instanceof ApiError) || error.status !== 401)) throw error; }
    setSession(null);
    setError('');
  }
  return <AuthContext.Provider value={{ session, loading, error, login, logout }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth requiere AuthProvider.');
  return context;
}

