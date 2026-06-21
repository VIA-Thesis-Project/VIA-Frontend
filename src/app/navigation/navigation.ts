export type Screen =
  | 'login'
  | 'dashboard'
  | 'new-evaluation'
  | 'processing'
  | 'results'
  | 'crop-detail'
  | 'recommendations'
  | 'report';

export type NavigateFn = (screen: Screen) => void;
