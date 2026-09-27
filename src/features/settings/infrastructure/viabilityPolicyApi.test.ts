import { beforeEach, expect, it, vi } from 'vitest';
import { readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';
import { apiRequest } from '@/shared/infrastructure/http/apiClient';
import { getViabilityPolicy, updateViabilityPolicy } from './viabilityPolicyApi';

vi.mock('@/features/auth/infrastructure/session/authSessionStorage', () => ({
  readAuthSession: vi.fn(),
}));
vi.mock('@/shared/infrastructure/http/apiClient', () => ({
  apiRequest: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(readAuthSession).mockReturnValue({
    accessToken: 'test-token', tokenType: 'bearer', expiresInSeconds: 3600,
    expiresAt: '', user: { id: '1', email: 'admin@example.com', role: 'admin' },
  });
});

it('reads the authoritative policy with the bearer token', async () => {
  await getViabilityPolicy();
  expect(apiRequest).toHaveBeenCalledWith('/v1/decision-support/viability-policy', {
    token: 'test-token',
  });
});

it('sends the server-issued version without inventing a new identity', async () => {
  await updateViabilityPolicy({
    identifier: 'via-policy', version: 'server-v1',
    conditional_from: 40, viable_from: 70,
    default_configuration: { conditional_from: 40, viable_from: 70 },
  }, 45, 75);
  expect(apiRequest).toHaveBeenCalledWith('/v1/decision-support/viability-policy', {
    method: 'PUT',
    token: 'test-token',
    body: {
      conditional_from: 45,
      viable_from: 75,
      expected_identifier: 'via-policy',
      expected_version: 'server-v1',
    },
  });
});
