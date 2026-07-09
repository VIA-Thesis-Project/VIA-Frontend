const SELECTED_PARCEL_KEY = 'via.selectedParcelId';
const DETAIL_PARCEL_KEY = 'via.detailParcelId';

export function saveSelectedParcelId(parcelId: string): void {
  window.sessionStorage.setItem(SELECTED_PARCEL_KEY, parcelId);
}

export function readSelectedParcelId(): string | null {
  return window.sessionStorage.getItem(SELECTED_PARCEL_KEY);
}

export function clearSelectedParcelId(): void {
  window.sessionStorage.removeItem(SELECTED_PARCEL_KEY);
}

export function saveDetailParcelId(parcelId: string): void {
  window.sessionStorage.setItem(DETAIL_PARCEL_KEY, parcelId);
}

export function readDetailParcelId(): string | null {
  return window.sessionStorage.getItem(DETAIL_PARCEL_KEY);
}
