import { AuthRepository } from '@/features/auth/application/authRepository';
import { AuthSession, LoginCredentials, RegisteredUser, RegisterCredentials } from '@/features/auth/domain/authSession';
import { readUserFromAccessToken } from '@/features/auth/infrastructure/api/jwtPayload';
import { apiRequest } from '@/shared/infrastructure/http/apiClient';

type LoginResponse = {
  access_token: string;
  token_type: string;
  expires_in_seconds: number;
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
    const response = await apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: credentials,
    });

    return {
      accessToken: response.access_token,
      tokenType: response.token_type,
      expiresInSeconds: response.expires_in_seconds,
      expiresAt: new Date(Date.now() + response.expires_in_seconds * 1000).toISOString(),
      user: readUserFromAccessToken(response.access_token),
    };
  }
}
