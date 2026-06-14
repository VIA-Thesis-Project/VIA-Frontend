import { useState } from 'react';
import Landing from './components/Landing';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import NewEvaluation from './components/NewEvaluation';
import Processing from './components/Processing';
import Results from './components/Results';
import CropDetail from './components/CropDetail';
import Recommendations from './components/Recommendations';
import Report from './components/Report';
import Admin from './components/Admin';

export type Screen =
  | 'landing'
  | 'login'
  | 'dashboard'
  | 'new-evaluation'
  | 'processing'
  | 'results'
  | 'crop-detail'
  | 'recommendations'
  | 'report'
  | 'admin';

export type NavigateFn = (screen: Screen) => void;

export default function App() {
  const [screen, setScreen] = useState<Screen>('landing');
  const navigate: NavigateFn = (s) => { setScreen(s); window.scrollTo(0, 0); };

  return (
    <div className="size-full min-h-screen" style={{ background: '#f8fafc' }}>
      {screen === 'landing' && <Landing navigate={navigate} />}
      {screen === 'login' && <Login navigate={navigate} />}
      {screen === 'dashboard' && <Dashboard navigate={navigate} />}
      {screen === 'new-evaluation' && <NewEvaluation navigate={navigate} />}
      {screen === 'processing' && <Processing navigate={navigate} />}
      {screen === 'results' && <Results navigate={navigate} />}
      {screen === 'crop-detail' && <CropDetail navigate={navigate} />}
      {screen === 'recommendations' && <Recommendations navigate={navigate} />}
      {screen === 'report' && <Report navigate={navigate} />}
      {screen === 'admin' && <Admin navigate={navigate} />}
    </div>
  );
}
