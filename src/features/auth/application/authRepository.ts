import { AuthSession, LoginCredentials } from '@/features/auth/domain/authSession';

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
}
