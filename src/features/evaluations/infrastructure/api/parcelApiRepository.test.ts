import { beforeEach, expect, it, vi } from 'vitest';
import { ParcelApiRepository } from './parcelApiRepository';
import { apiRequest } from '@/shared/infrastructure/http/apiClient';

vi.mock('@/shared/infrastructure/http/apiClient', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error { constructor(message: string, public status: number) { super(message); } },
}));

const geometry = {
  type: 'Polygon' as const,
  coordinates: [[[-77.6, -11.1], [-77.5, -11.1], [-77.5, -11.0], [-77.6, -11.1]]],
};
const parcel = {
  id: 'parcel-1', project_id: 'project-1', name: 'North', description: 'Initial',
  current_version: 1, created_at: '2026-09-27T00:00:00Z',
  versions: [{ number: 1, geometry, created_at: '2026-09-27T00:00:00Z' }],
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(apiRequest).mockImplementation(async (path) => {
    if (path === '/projects') return [{ id: 'project-1', name: 'Project', created_at: parcel.created_at }];
    if (path === '/projects/project-1/parcels') return [parcel];
    return parcel;
  });
});

it('loads name and description from the server', async () => {
  const loaded = await new ParcelApiRepository().getParcel('parcel-1', 'token');
  expect(loaded.metadata.name).toBe('North');
  expect(loaded.metadata.description).toBe('Initial');
});

it('patches metadata without geometry', async () => {
  await new ParcelApiRepository().updateParcel('parcel-1', {
    metadata: { name: 'South', description: 'Edited', crs: 'EPSG:4326' },
  }, 'token');
  expect(apiRequest).toHaveBeenCalledWith('/projects/project-1/parcels/parcel-1', {
    method: 'PATCH', token: 'token', body: { name: 'South', description: 'Edited' },
  });
});

it('keeps geometry changes on the versions endpoint', async () => {
  await new ParcelApiRepository().updateParcel('parcel-1', { geometry }, 'token');
  expect(apiRequest).toHaveBeenCalledWith('/projects/project-1/parcels/parcel-1/versions', {
    method: 'POST', token: 'token', body: { geometry },
  });
});

it('calls DELETE for the selected parcel', async () => {
  await new ParcelApiRepository().deleteParcel('parcel-1', 'token');
  expect(apiRequest).toHaveBeenCalledWith('/projects/project-1/parcels/parcel-1', {
    method: 'DELETE', token: 'token',
  });
});
