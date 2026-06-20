import { AuthSession } from '@/features/auth/domain/authSession';

const AUTH_SESSION_KEY = 'via.auth.session';

export function saveAuthSession(session: AuthSession): void {
  sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
}

export function readAuthSession(): AuthSession | null {
  const rawSession = sessionStorage.getItem(AUTH_SESSION_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    clearAuthSession();
    return null;
  }
}

export function clearAuthSession(): void {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
}
