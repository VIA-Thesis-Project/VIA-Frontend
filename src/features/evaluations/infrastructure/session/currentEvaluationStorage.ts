import { CurrentEvaluationContext } from '@/features/evaluations/domain/evaluation';

const CURRENT_EVALUATION_KEY = 'via.current.evaluation';

export function saveCurrentEvaluation(context: CurrentEvaluationContext): void {
  sessionStorage.setItem(CURRENT_EVALUATION_KEY, JSON.stringify(context));
}

export function readCurrentEvaluation(): CurrentEvaluationContext | null {
  const rawContext = sessionStorage.getItem(CURRENT_EVALUATION_KEY);
  if (!rawContext) {
    return null;
  }

  try {
    return JSON.parse(rawContext) as CurrentEvaluationContext;
  } catch {
    sessionStorage.removeItem(CURRENT_EVALUATION_KEY);
    return null;
  }
}
