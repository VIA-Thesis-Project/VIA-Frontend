import { AuthenticatedUser } from '@/features/auth/domain/authSession';

type JwtPayload = {
  sub?: string;
  email?: string;
  role?: string;
};

export function readUserFromAccessToken(accessToken: string): AuthenticatedUser {
  const [, payload] = accessToken.split('.');
  if (!payload) {
    throw new Error('El token de autenticacion no tiene un formato valido.');
  }

  const decoded = JSON.parse(decodeBase64Url(payload)) as JwtPayload;
  if (!decoded.sub || !decoded.email || !decoded.role) {
    throw new Error('El token de autenticacion no contiene los datos del usuario.');
  }

  return {
    id: decoded.sub,
    email: decoded.email,
    role: decoded.role,
  };
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  return atob(padded);
}
