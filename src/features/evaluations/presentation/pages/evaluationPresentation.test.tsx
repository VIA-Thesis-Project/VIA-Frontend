import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { formatSuitability } from '@/features/evaluations/application/displayFormatters';
import { CropEvaluationResult, EvaluationMcdaResult } from '@/features/evaluations/domain/evaluation';
import Results from './Results';
import CropDetail from './CropDetail';
import Processing from './Processing';

const { getMcdaResult, getEvaluationStatus } = vi.hoisted(() => ({
  getMcdaResult: vi.fn(),
  getEvaluationStatus: vi.fn(),
}));

vi.mock('@/shared/presentation/layouts/Sidebar', () => ({ default: () => null }));
vi.mock('@/features/evaluations/infrastructure/api/evaluationApiRepository', () => ({
  EvaluationApiRepository: class {
    getMcdaResult = getMcdaResult;
    getEvaluationStatus = getEvaluationStatus;
  },
}));
vi.mock('@/features/evaluations/infrastructure/session/currentEvaluationStorage', () => ({
  readCurrentEvaluation: () => ({ evaluationId: 'evaluation-1', parcelName: 'Norte', waterRegime: 'rainfed' }),
  readSelectedCropId: () => 'maize',
  saveSelectedCropId: vi.fn(),
}));
vi.mock('recharts', () => ({
  ResponsiveContainer: () => null,
  Bar: () => null,
  BarChart: () => null,
  Cell: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

function crop(overrides: Partial<CropEvaluationResult> = {}): CropEvaluationResult {
  return {
    cropId: 'maize', score: 55, comparableScore: 0.5, rankPosition: 1,
    calcCondition: 'succeeded', viabilityCategory: null, gaps: [], limitingFactors: [],
    missingCriteria: [], unrecognizedVariables: [], limitationAvailability: 'available',
    ...overrides,
  };
}

function result(results: CropEvaluationResult[]): EvaluationMcdaResult {
  return { evaluationId: 'evaluation-1', status: 'succeeded', failureReason: null, results };
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

it('preserves the 0..100 scale and distinguishes missing data from zero', () => {
  expect(formatSuitability(0.5)).toBe('0.5%');
  expect(formatSuitability(1)).toBe('1%');
  expect(formatSuitability(0)).toBe('0%');
  expect(formatSuitability(null)).toBe('Sin datos');
});

it('shows comparable scores for ranked crops without fabricating missing scores or ranks', async () => {
  getMcdaResult.mockResolvedValue(result([
    crop(),
    crop({ cropId: 'rice', score: null, comparableScore: null, rankPosition: null, calcCondition: 'no_coverage' }),
    crop({ cropId: 'wheat', score: 0, comparableScore: null, rankPosition: null }),
  ]));
  render(<Results navigate={vi.fn()} />);
  await screen.findByText('#1');
  expect(screen.getAllByText('0.5%')).toHaveLength(2);
  expect(screen.getAllByText('Sin datos')).toHaveLength(2);
  expect(screen.getAllByText('0%')).toHaveLength(2);
  expect(screen.queryByText('55%')).toBeNull();
  expect(screen.queryByText('#2')).toBeNull();
  expect(screen.queryByText('#3')).toBeNull();
});

it('shows the actual affected area rather than its complement or an invented severity', async () => {
  getMcdaResult.mockResolvedValue(result([crop({
    limitingFactors: [{
      criterionId: 'temperature', criterionLabel: 'Temperatura', phaseId: '', policy: '',
      penaltyFactor: null, observedValue: 0.25, optimalLimit: 1, membership: 0.75,
      docSource: 'hash', affectedFraction: 0.25, dominant: true,
    }],
  })]));
  render(<CropDetail navigate={vi.fn()} />);
  await screen.findByText('25%');
  expect(screen.getByText('del área evaluada afectada')).toBeTruthy();
  expect(screen.queryByText('75%')).toBeNull();
  expect(screen.queryByText('Adecuado')).toBeNull();
  expect(screen.getByText('Detalles técnicos de las limitaciones').closest('details')?.open).toBe(false);
});

it('does not announce recommendations as ready when only the scientific evaluation has finished', async () => {
  getEvaluationStatus.mockResolvedValue({ status: 'succeeded', failureReason: null });
  getMcdaResult.mockResolvedValue(result([crop()]));
  render(<Processing navigate={vi.fn()} />);
  await screen.findByText('Evaluación completada');
  await waitFor(() => expect(getMcdaResult).toHaveBeenCalled());
  expect(screen.getByText('Puedes consultar los resultados y solicitar recomendaciones.')).toBeTruthy();
  expect(screen.queryByText('Analisis y recomendacion completados')).toBeNull();
  expect(screen.getByText('Detalles técnicos').closest('details')?.open).toBe(false);
});
