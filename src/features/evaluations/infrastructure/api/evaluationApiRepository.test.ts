import { beforeEach, expect, it, vi } from 'vitest';
import { apiRequest } from '@/shared/infrastructure/http/apiClient';
import { EvaluationApiRepository } from './evaluationApiRepository';

vi.mock('@/shared/infrastructure/http/apiClient', () => ({
  apiRequest: vi.fn(),
  ApiError: class ApiError extends Error {},
}));
vi.mock('@/features/auth/infrastructure/session/authSessionStorage', () => ({
  readAuthSession: () => ({ accessToken: 'token' }),
}));

const support = {
  status: 'comparable', method: 'intersection', area_crs: 'EPSG:32718',
  parcel_area_m2: 100, common_valid_area_m2: 100, common_coverage_fraction: 1,
  eligible_crops: ['maize'], excluded_without_coverage: [],
};
const outcome = {
  crop_id: 'maize', water_regime: 'irrigated', status: 'succeeded',
  suitability: { mean: 65, minimum: 0, maximum: 100, valid_cells: 10,
    valid_area_m2: 100, coverage_fraction: 1, zero_suitability_area_m2: 0 },
};
const scientificResult = {
  evaluation_id: 'evaluation-1', evaluation_status: 'succeeded', availability: 'final',
  outcomes: [outcome], common_support: support,
  scenarios: [{ water_regime: 'irrigated', outcomes: [outcome],
    comparable_crops: [{ crop_id: 'maize', mean: 60, rank: 1 }], common_support: support }],
};

beforeEach(() => vi.clearAllMocks());

it('uses the classification bound to the evaluation and selected scenario without changing scientific scores', async () => {
  vi.mocked(apiRequest).mockImplementation(async (path) => {
    if (path.endsWith('/result')) return scientificResult;
    if (path.endsWith('/limitations')) return { limitations: [] };
    return { assessments: [{ crop_id: 'maize', viability: 'conditional' }] };
  });
  const result = await new EvaluationApiRepository().getMcdaResult('evaluation-1', 'irrigated');
  expect(apiRequest).toHaveBeenCalledWith(
    '/v1/decision-support/evaluations/evaluation-1/viability?water_regime=irrigated',
    { token: 'token' },
  );
  expect(result.results[0]).toMatchObject({
    score: 65, comparableScore: 60, rankPosition: 1, viabilityCategory: 'conditional',
  });
});

it('keeps scientific results available if classification cannot be loaded', async () => {
  vi.mocked(apiRequest).mockImplementation(async (path) => {
    if (path.endsWith('/result')) return scientificResult;
    if (path.endsWith('/limitations')) return { limitations: [] };
    throw new Error('Unavailable');
  });
  const result = await new EvaluationApiRepository().getMcdaResult('evaluation-1', 'irrigated');
  expect(result.results[0]).toMatchObject({ score: 65, viabilityCategory: null });
});
