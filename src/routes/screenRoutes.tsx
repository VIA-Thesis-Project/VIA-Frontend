import { JSX } from 'react/jsx-runtime';
import Admin from '../pages/Admin';
import CropDetail from '../pages/CropDetail';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import NewEvaluation from '../pages/NewEvaluation';
import Processing from '../pages/Processing';
import Recommendations from '../pages/Recommendations';
import Report from '../pages/Report';
import Results from '../pages/Results';
import { NavigateFn, Screen } from '../types/navigation';

export const initialScreen: Screen = 'login';

export const screenRoutes: Record<Screen, (navigate: NavigateFn) => JSX.Element> = {
  login: (navigate) => <Login navigate={navigate} />,
  dashboard: (navigate) => <Dashboard navigate={navigate} />,
  'new-evaluation': (navigate) => <NewEvaluation navigate={navigate} />,
  processing: (navigate) => <Processing navigate={navigate} />,
  results: (navigate) => <Results navigate={navigate} />,
  'crop-detail': (navigate) => <CropDetail navigate={navigate} />,
  recommendations: (navigate) => <Recommendations navigate={navigate} />,
  report: (navigate) => <Report navigate={navigate} />,
  admin: (navigate) => <Admin navigate={navigate} />,
};
