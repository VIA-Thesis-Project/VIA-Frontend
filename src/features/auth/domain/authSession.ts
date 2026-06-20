export type UserRole = 'ADMINISTRADOR' | 'ESPECIALISTA_TECNICO' | 'USUARIO_AGRICOLA' | string;

export type LoginCredentials = {
  email: string;
  password: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: UserRole;
};

export type AuthSession = {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  expiresAt: string;
  user: AuthenticatedUser;
};
