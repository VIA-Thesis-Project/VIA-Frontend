export type Screen =
  | 'login'
  | 'dashboard'
  | 'parcels'
  | 'new-evaluation'
  | 'processing'
  | 'results'
  | 'crop-detail'
  | 'recommendations'
  | 'report';

export type NavigateFn = (screen: Screen) => void;
