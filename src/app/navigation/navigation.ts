export type Screen =
  | 'login'
  | 'dashboard'
  | 'parcels'
  | 'new-evaluation'
  | 'processing'
  | 'results'
  | 'crop-detail'
  | 'recommendations';

export type NavigateFn = (screen: Screen) => void;
