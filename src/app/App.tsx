import { useState } from 'react';
import { initialScreen, screenRoutes } from '@/app/routes/screenRoutes';
import { NavigateFn, Screen } from '@/app/navigation/navigation';

export default function App() {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const navigate: NavigateFn = (s) => { setScreen(s); window.scrollTo(0, 0); };

  return (
    <div className="size-full min-h-screen" style={{ background: '#f8fafc' }}>
      {screenRoutes[screen](navigate)}
    </div>
  );
}
