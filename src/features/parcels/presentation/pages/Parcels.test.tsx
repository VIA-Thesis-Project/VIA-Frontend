import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import Parcels from './Parcels';
import { readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';

vi.mock('@/shared/presentation/layouts/Sidebar', () => ({ default: () => null }));
vi.mock('@/features/auth/infrastructure/session/authSessionStorage', () => ({ readAuthSession: vi.fn() }));
const { listParcels, updateParcel, deleteParcel } = vi.hoisted(() => ({
  listParcels: vi.fn(), updateParcel: vi.fn(), deleteParcel: vi.fn(),
}));
vi.mock('@/features/evaluations/infrastructure/api/parcelApiRepository', () => ({
  ParcelApiRepository: class {
    listParcels = listParcels;
    updateParcel = updateParcel;
    deleteParcel = deleteParcel;
  },
}));

const parcel = {
  id: 'parcel-1', projectId: 'project-1', ownerId: 'owner-1', currentVersion: 1,
  geometry: { type: 'Polygon' as const, coordinates: [] }, versions: [],
  metadata: { name: 'North', description: 'Initial', crs: 'EPSG:4326' },
  createdAt: '2026-09-27T00:00:00Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readAuthSession).mockReturnValue({
    accessToken: 'token', tokenType: 'bearer', expiresInSeconds: 3600, expiresAt: '',
    user: { id: 'owner-1', email: 'owner@example.com', role: 'user' },
  });
  listParcels.mockResolvedValue([parcel]);
  updateParcel.mockResolvedValue({ ...parcel, metadata: { ...parcel.metadata, name: 'South' } });
  deleteParcel.mockResolvedValue(undefined);
});
afterEach(() => cleanup());

it('keeps the parcel edit action hidden until it is re-enabled', async () => {
  render(<Parcels navigate={vi.fn()} />);
  await screen.findByText('North');
  expect(screen.queryByTitle('Editar metadatos')).toBeNull();
});

it('requires confirmation and removes a deleted parcel from the list', async () => {
  render(<Parcels navigate={vi.fn()} />);
  await screen.findByText('North');
  fireEvent.click(screen.getByTitle('Eliminar parcela'));
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.getByText('Vas a eliminar')).toBeTruthy();
  expect(deleteParcel).not.toHaveBeenCalled();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar parcela', exact: true }));
  await waitFor(() => expect(deleteParcel).toHaveBeenCalledWith('parcel-1', 'token'));
  await screen.findByText('Parcela eliminada correctamente.');
  expect(screen.queryByText('North')).toBeNull();
});

it('keeps the new evaluation action available', async () => {
  render(<Parcels navigate={vi.fn()} />);
  await screen.findByText('North');
  expect(screen.getByText('Nueva evaluacion')).toBeTruthy();
});

it('disables delete while the request is pending and shows failures', async () => {
  let rejectDelete: ((reason: Error) => void) | undefined;
  deleteParcel.mockImplementation(() => new Promise((_, reject) => { rejectDelete = reject; }));
  render(<Parcels navigate={vi.fn()} />);
  await screen.findByText('North');
  fireEvent.click(screen.getByTitle('Eliminar parcela'));
  const deleteButton = within(screen.getByRole('dialog')).getByRole('button', { name: 'Eliminar parcela', exact: true }) as HTMLButtonElement;
  fireEvent.click(deleteButton);
  await waitFor(() => expect(deleteButton.disabled).toBe(true));
  rejectDelete?.(new Error('Conflicto al eliminar la parcela.'));
  await screen.findByText('Conflicto al eliminar la parcela.');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect((screen.getByTitle('Eliminar parcela') as HTMLButtonElement).disabled).toBe(false);
});
