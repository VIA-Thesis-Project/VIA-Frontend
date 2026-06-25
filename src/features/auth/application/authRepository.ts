import { AuthSession, LoginCredentials, RegisteredUser, RegisterCredentials } from '@/features/auth/domain/authSession';

export interface AuthRepository {
  login(credentials: LoginCredentials): Promise<AuthSession>;
  register(credentials: RegisterCredentials): Promise<RegisteredUser>;
}
