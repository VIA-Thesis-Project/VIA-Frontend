import { CropEvaluationResult, EvaluationStatus } from '@/features/evaluations/domain/evaluation';

const MCDA_READY_STATUSES = new Set<EvaluationStatus>([
  'EVALUACION_COMPLETADA',
  'RECOMENDACION_COMPLETADA',
]);

const RECOMMENDATION_READY_STATUSES = new Set<EvaluationStatus>([
  'RECOMENDACION_COMPLETADA',
]);

/**
 * Indicates whether the backend has persisted MCDA results for an evaluation.
 */
export function isMcdaReadyStatus(status: EvaluationStatus | null | undefined): boolean {
  return Boolean(status && MCDA_READY_STATUSES.has(status));
}

/**
 * Indicates whether the backend has persisted the final recommendation.
 */
export function isRecommendationReadyStatus(status: EvaluationStatus | null | undefined): boolean {
  return Boolean(status && RECOMMENDATION_READY_STATUSES.has(status));
}

/**
 * Indicates whether the backend saga finished with an unrecoverable failure.
 */
export function isEvaluationFailed(status: EvaluationStatus | null | undefined): boolean {
  return status === 'FALLIDA';
}

/**
 * Indicates whether the evaluation is still progressing through backend orchestration.
 */
export function isEvaluationPending(status: EvaluationStatus | null | undefined): boolean {
  return Boolean(status && !isMcdaReadyStatus(status) && !isEvaluationFailed(status));
}

/**
 * Matches the backend process-manager gate for recommendation commands.
 */
export function isRecommendableViabilityCategory(category: string | null | undefined): boolean {
  return category === 'VIABLE' || category === 'CONDICIONAL';
}

/**
 * Indicates whether MCDA produced at least one crop that can receive a backend recommendation.
 */
export function hasRecommendableCrop(results: CropEvaluationResult[]): boolean {
  return results.some((result) => isRecommendableViabilityCategory(result.viabilityCategory));
}
