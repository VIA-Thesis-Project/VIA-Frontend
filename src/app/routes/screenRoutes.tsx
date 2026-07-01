import { JSX } from 'react/jsx-runtime';
import CropDetail from '@/features/evaluations/presentation/pages/CropDetail';
import Dashboard from '@/features/dashboard/presentation/pages/Dashboard';
import Login from '@/features/auth/presentation/pages/Login';
import NewEvaluation from '@/features/evaluations/presentation/pages/NewEvaluation';
import Parcels from '@/features/parcels/presentation/pages/Parcels';
import Processing from '@/features/evaluations/presentation/pages/Processing';
import Recommendations from '@/features/evaluations/presentation/pages/Recommendations';
import Results from '@/features/evaluations/presentation/pages/Results';
import { NavigateFn, Screen } from '@/app/navigation/navigation';

export const initialScreen: Screen = 'login';

export const screenRoutes: Record<Screen, (navigate: NavigateFn) => JSX.Element> = {
  login: (navigate) => <Login navigate={navigate} />,
  dashboard: (navigate) => <Dashboard navigate={navigate} />,
  parcels: (navigate) => <Parcels navigate={navigate} />,
  'new-evaluation': (navigate) => <NewEvaluation navigate={navigate} />,
  processing: (navigate) => <Processing navigate={navigate} />,
  results: (navigate) => <Results navigate={navigate} />,
  'crop-detail': (navigate) => <CropDetail navigate={navigate} />,
  recommendations: (navigate) => <Recommendations navigate={navigate} />,
};
