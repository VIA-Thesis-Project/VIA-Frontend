import { useEffect, useState } from 'react';
import { initialScreen, screenRoutes } from '@/app/routes/screenRoutes';
import { NavigateFn, Screen } from '@/app/navigation/navigation';
import { clearAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';

export default function App() {
  const [screen, setScreen] = useState<Screen>(initialScreen);
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

  return (
    <div className="size-full min-h-screen" style={{ background: '#f8fafc' }}>
      {screenRoutes[screen](navigate)}
    </div>
  );
}
