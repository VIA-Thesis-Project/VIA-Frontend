import { AuthRepository } from '@/features/auth/application/authRepository';
import { RegisterCredentials } from '@/features/auth/domain/authSession';

export async function registerUser(authRepository: AuthRepository, credentials: RegisterCredentials) {
  const email = credentials.email.trim();
  const password = credentials.password;

  if (!email || !password) {
    throw new Error('Ingresa correo y contrasena para registrarte.');
  }

  if (password.length < 12) {
    throw new Error('La contrasena debe tener al menos 12 caracteres.');
  }

  return authRepository.register({ email, password });
}
