import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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

it('loads metadata and saves edits through the repository', async () => {
  render(<Parcels navigate={vi.fn()} />);
  await screen.findByText('North');
  fireEvent.click(screen.getByTitle('Editar metadatos'));
  expect((screen.getByLabelText('Nombre') as HTMLInputElement).value).toBe('North');
  expect((screen.getByLabelText('Descripcion') as HTMLTextAreaElement).value).toBe('Initial');
  fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'South' } });
  fireEvent.click(screen.getByText('Guardar cambios'));
  await waitFor(() => expect(updateParcel).toHaveBeenCalledWith('parcel-1', {
    metadata: { name: 'South', description: 'Initial', crs: 'EPSG:4326' },
  }, 'token'));
  await screen.findByText('Parcela actualizada correctamente.');
});

it('requires confirmation and removes a deleted parcel from the list', async () => {
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
  render(<Parcels navigate={vi.fn()} />);
  await screen.findByText('North');
  fireEvent.click(screen.getByTitle('Eliminar parcela'));
  expect(deleteParcel).not.toHaveBeenCalled();
  confirm.mockReturnValue(true);
  fireEvent.click(screen.getByTitle('Eliminar parcela'));
  await waitFor(() => expect(deleteParcel).toHaveBeenCalledWith('parcel-1', 'token'));
  await screen.findByText('Parcela eliminada correctamente.');
  expect(screen.queryByText('North')).toBeNull();
  confirm.mockRestore();
});

it('disables actions while saving and shows API errors', async () => {
  let rejectSave: ((reason: Error) => void) | undefined;
  updateParcel.mockImplementation(() => new Promise((_, reject) => { rejectSave = reject; }));
  render(<Parcels navigate={vi.fn()} />);
  await screen.findByText('North');
  fireEvent.click(screen.getByTitle('Editar metadatos'));
  fireEvent.click(screen.getByText('Guardar cambios'));
  expect((screen.getByText('Guardando...') as HTMLButtonElement).disabled).toBe(true);
  rejectSave?.(new Error('Parcela no encontrada.'));
  await screen.findByText('Parcela no encontrada.');
});

it('disables delete while the request is pending and shows failures', async () => {
  let rejectDelete: ((reason: Error) => void) | undefined;
  deleteParcel.mockImplementation(() => new Promise((_, reject) => { rejectDelete = reject; }));
  const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
  render(<Parcels navigate={vi.fn()} />);
  await screen.findByText('North');
  const deleteButton = screen.getByTitle('Eliminar parcela') as HTMLButtonElement;
  fireEvent.click(deleteButton);
  await waitFor(() => expect(deleteButton.disabled).toBe(true));
  rejectDelete?.(new Error('Conflicto al eliminar la parcela.'));
  await screen.findByText('Conflicto al eliminar la parcela.');
  expect(deleteButton.disabled).toBe(false);
  confirm.mockRestore();
});
