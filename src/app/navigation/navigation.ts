export type Screen =
  | 'login'
  | 'dashboard'
  | 'parcels'
  | 'parcel-detail'
  | 'new-evaluation'
  | 'processing'
  | 'results'
  | 'crop-detail'
  | 'recommendations';

export type NavigateFn = (screen: Screen) => void;
