export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(message: string, status: number, details: unknown = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
};

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api').replace(/\/$/, '');
let refreshPromise: Promise<string | null> | null = null;

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return requestWithRefresh<T>(path, options, false);
}

async function requestWithRefresh<T>(
  path: string,
  options: ApiRequestOptions,
  retriedAfterRefresh: boolean,
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    credentials: 'include',
  });

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401) {
      const isAuthenticationRoute = path.startsWith('/v1/auth/');
      if (!retriedAfterRefresh && !isAuthenticationRoute && options.token) {
        const replacementToken = await refreshAccessToken();
        if (replacementToken) {
          return requestWithRefresh(
            path,
            { ...options, token: replacementToken },
            true,
          );
        }
      }
      window.dispatchEvent(new CustomEvent('via:session-expired'));
      throw new ApiError('Tu sesion ha expirado. Inicia sesion nuevamente.', 401, payload);
    }
    const message = typeof payload === 'object' && payload && 'detail' in payload
      ? String((payload as { detail: unknown }).detail)
      : 'No se pudo completar la solicitud.';
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/auth/refresh`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) return null;

      const payload = await response.json() as {
        access_token: string;
        token_type: string;
        expires_in: number;
        user: { id: string; email: string; role: string };
      };
      const { readAuthSession, saveAuthSession } = await import('@/features/auth/infrastructure/session/authSessionStorage');
      const current = readAuthSession();
      saveAuthSession({
        accessToken: payload.access_token,
        tokenType: payload.token_type,
        expiresInSeconds: payload.expires_in,
        expiresAt: new Date(Date.now() + payload.expires_in * 1000).toISOString(),
        user: payload.user,
      });
      return current ? payload.access_token : null;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
