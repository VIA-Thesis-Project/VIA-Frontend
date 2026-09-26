import { useEffect, useState } from 'react';
import { initialScreen, screenRoutes } from '@/app/routes/screenRoutes';
import { NavigateFn, Screen } from '@/app/navigation/navigation';
import { AuthApiRepository } from '@/features/auth/infrastructure/api/authApiRepository';
import { clearAuthSession, readAuthSession, saveAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';

const authRepository = new AuthApiRepository();

export default function App() {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [bootstrappingSession, setBootstrappingSession] = useState(true);
  const navigate: NavigateFn = (s) => { setScreen(s); window.scrollTo(0, 0); };

  useEffect(() => {
    const handleSessionExpired = () => {
      clearAuthSession();
      setScreen('login');
      window.scrollTo(0, 0);
    };
    window.addEventListener('via:session-expired', handleSessionExpired);
    return () => window.removeEventListener('via:session-expired', handleSessionExpired);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const storedSession = readAuthSession();
      if (!storedSession) {
        if (!cancelled) setBootstrappingSession(false);
        return;
      }

      try {
        const user = await authRepository.getCurrentUser(storedSession.accessToken);
        const refreshedSession = readAuthSession() ?? storedSession;
        saveAuthSession({ ...refreshedSession, user });
        if (!cancelled) setScreen('dashboard');
      } catch {
        clearAuthSession();
        if (!cancelled) setScreen('login');
      } finally {
        if (!cancelled) setBootstrappingSession(false);
      }
    };

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  if (bootstrappingSession) {
    return (
      <div className="size-full min-h-screen" style={{ background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: 14 }}>
        Restaurando sesion...
      </div>
    );
  }

  return (
    <div className="size-full min-h-screen" style={{ background: '#f8fafc' }}>
      {screenRoutes[screen](navigate)}
    </div>
  );
}
