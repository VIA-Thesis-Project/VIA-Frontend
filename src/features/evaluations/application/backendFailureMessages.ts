const NO_RANKED_CROP_REASON = 'rank_position=1 is required when crop_id is not provided';

/**
 * Converts known backend failure reasons into messages a field user can act on.
 */
export function toUserFriendlyFailureReason(reason: string | null | undefined): string | null {
  if (!reason) return null;

  if (reason.includes(NO_RANKED_CROP_REASON)) {
    return 'La evaluacion no produjo un cultivo rankeable para generar una recomendacion. Prueba con otros cultivos o ajusta la delimitacion de la parcela.';
  }

  return reason;
}

/**
 * Identifies the current backend edge case where no crop can be selected for recommendation.
 */
export function isNoRankedCropFailure(reason: string | null | undefined): boolean {
  return Boolean(reason?.includes(NO_RANKED_CROP_REASON));
}
