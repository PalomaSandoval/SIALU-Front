import type { HealthResponse, LoginResponse, SessionResponse } from '../types/api.ts';
const BASE_URL = '/api/v1';
let csrfToken = '';
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
  body?: unknown;
  signal?: AbortSignal;
}
interface ErrorResponse { message?: string; errors?: Record<string, string[]> }
export class ApiError extends Error {
  constructor(message: string, public status: number, public errors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
  }
}
export async function request<T = unknown>(path: string, { method = 'GET', body, signal }: RequestOptions = {}): Promise<T> {
  if (!path.startsWith('/') || path.startsWith('//')) throw new Error('Use una ruta relativa de la API.');
  const writes = !['GET', 'HEAD'].includes(method);
  if (writes && !csrfToken) await refreshCsrf();
  let response: Response;
  try {
    response = await fetch(BASE_URL + path, {
      method, signal, credentials: 'same-origin',
      headers: { Accept: 'application/json', ...(body !== undefined && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(writes ? { 'X-CSRF-TOKEN': csrfToken } : {}) },
      ...(body !== undefined ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    throw new ApiError('No se pudo conectar con SIALU API.', 0);
  }
  const text = await response.text();
  let data: unknown = {};
  if (text) {
    try { data = JSON.parse(text); }
    catch { throw new ApiError('SIALU API no devolvió JSON. ', response.status); }
  }
  if (!response.ok) {
    if ([401, 419].includes(response.status)) csrfToken = '';
    const details = (data && typeof data === 'object' ? data : {}) as ErrorResponse;
    throw new ApiError(Object.values(details.errors || {}).flat().join(' ') || details.message || `Error HTTP ${response.status}`, response.status, details.errors);
  }
  return data as T;
}
export async function refreshCsrf(): Promise<void> {
  csrfToken = (await request<{ csrf_token: string }>('/csrf-token')).csrf_token;
  if (!csrfToken) throw new ApiError('La API no devolvió un token CSRF.', 0);
}
export const api = {
  health: (options?: RequestOptions) => request<HealthResponse>('/health', options),
  me: (options?: RequestOptions) => request<SessionResponse>('/me', options),
  dashboard: () => request<{ data: Record<string, unknown> }>('/dashboard'),
  async login(uid: string, password: string): Promise<LoginResponse> {
    await refreshCsrf();
    const result = await request<LoginResponse>('/login', { method: 'POST', body: { uid, password } });
    csrfToken = '';
    await refreshCsrf();
    return result;
  },
  async logout(): Promise<void> {
    await request('/logout', { method: 'POST' });
    csrfToken = '';
  },
};
