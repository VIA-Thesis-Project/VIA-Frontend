import { AuthRepository } from '@/features/auth/application/authRepository';
import { LoginCredentials } from '@/features/auth/domain/authSession';

export async function authenticateUser(authRepository: AuthRepository, credentials: LoginCredentials) {
  const email = credentials.email.trim();
  const password = credentials.password.trim();

  if (!email || !password) {
    throw new Error('Ingresa tu correo y contrasena.');
  }

  return authRepository.login({ email, password });
}
