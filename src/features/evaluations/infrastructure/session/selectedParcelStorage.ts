const SELECTED_PARCEL_KEY = 'via.selectedParcelId';

export function saveSelectedParcelId(parcelId: string): void {
  window.sessionStorage.setItem(SELECTED_PARCEL_KEY, parcelId);
}

export function readSelectedParcelId(): string | null {
  return window.sessionStorage.getItem(SELECTED_PARCEL_KEY);
}

export function clearSelectedParcelId(): void {
  window.sessionStorage.removeItem(SELECTED_PARCEL_KEY);
}
