import { AuthRepository } from '@/features/auth/application/authRepository';
import { AuthSession, LoginCredentials, RegisteredUser, RegisterCredentials } from '@/features/auth/domain/authSession';
import { apiRequest } from '@/shared/infrastructure/http/apiClient';

type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    role: string;
  };
};

type RegisterResponse = {
  user_id: string;
  email: string;
  role: string;
};

export class AuthApiRepository implements AuthRepository {
  async register(credentials: RegisterCredentials): Promise<RegisteredUser> {
    const response = await apiRequest<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: credentials,
    });

    return {
      userId: response.user_id,
      email: response.email,
      role: response.role,
    };
  }

  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const response = await apiRequest<LoginResponse>('/v1/auth/login', {
      method: 'POST',
      body: credentials,
    });

    return {
      accessToken: response.access_token,
      tokenType: response.token_type,
      expiresInSeconds: response.expires_in,
      expiresAt: new Date(Date.now() + response.expires_in * 1000).toISOString(),
      user: response.user,
    };
  }
}
