import { EvaluationStatus } from '@/features/evaluations/domain/evaluation';

const MCDA_READY_STATUSES = new Set<EvaluationStatus>([
  'EVALUACION_COMPLETADA',
  'RECOMENDACION_COMPLETADA',
]);

/**
 * Indicates whether the backend has persisted MCDA results for an evaluation.
 */
export function isMcdaReadyStatus(status: EvaluationStatus | null | undefined): boolean {
  return Boolean(status && MCDA_READY_STATUSES.has(status));
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
