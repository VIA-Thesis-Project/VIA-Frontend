import { EvaluationRepository } from '@/features/evaluations/application/evaluationRepositories';
import {
  EvaluationAccepted,
  EvaluationMcdaResult,
  EvaluationStatusSnapshot,
  StartEvaluationInput,
} from '@/features/evaluations/domain/evaluation';
import { apiRequest } from '@/shared/infrastructure/http/apiClient';

type StartEvaluationResponse = {
  evaluation_id: string;
  status: string;
};

type EvaluationStatusResponse = {
  evaluation_id: string;
  status: string;
  current_phase: string;
  last_transition: string | null;
  failure_reason: string | null;
};

type McdaResultResponse = {
  evaluation_id: string;
  status: string;
  results: Array<{
    crop_id: string;
    score: number | null;
    rank_position: number | null;
    calc_condition: string;
    viability_category: string;
    gaps: Array<{
      criterion_id: string;
      phase_id: string;
      most_limiting_period: string;
      observed_value: number;
      optimal_limit: number;
      gap_value: number;
    }>;
    limiting_factors: Array<{
      criterion_id: string;
      phase_id: string;
      policy: string;
      penalty_factor: number | null;
      observed_value: number;
      optimal_limit: number;
      membership: number;
      doc_source: string | null;
    }>;
    missing_criteria: string[];
    unrecognized_variables: string[];
  }>;
  failure_reason: string | null;
};

export class EvaluationApiRepository implements EvaluationRepository {
  async startEvaluation(input: StartEvaluationInput): Promise<EvaluationAccepted> {
    const response = await apiRequest<StartEvaluationResponse>('/evaluaciones', {
      method: 'POST',
      body: {
        parcel_id: input.parcelId,
        requested_by: input.requestedBy,
        crop_candidates: input.cropCandidates,
        temporal_window: input.temporalWindow,
      },
    });

    return {
      evaluationId: response.evaluation_id,
      status: response.status,
    };
  }

  async getEvaluationStatus(evaluationId: string): Promise<EvaluationStatusSnapshot> {
    const response = await apiRequest<EvaluationStatusResponse>(`/evaluaciones/${evaluationId}/estado`);
    return {
      evaluationId: response.evaluation_id,
      status: response.status,
      currentPhase: response.current_phase,
      lastTransition: response.last_transition,
      failureReason: response.failure_reason,
    };
  }

  async getMcdaResult(evaluationId: string): Promise<EvaluationMcdaResult> {
    const response = await apiRequest<McdaResultResponse>(`/evaluaciones/${evaluationId}/resultado-mcda`);
    return {
      evaluationId: response.evaluation_id,
      status: response.status,
      failureReason: response.failure_reason,
      results: response.results.map((result) => ({
        cropId: result.crop_id,
        score: result.score,
        rankPosition: result.rank_position,
        calcCondition: result.calc_condition,
        viabilityCategory: result.viability_category,
        gaps: result.gaps.map((gap) => ({
          criterionId: gap.criterion_id,
          phaseId: gap.phase_id,
          mostLimitingPeriod: gap.most_limiting_period,
          observedValue: gap.observed_value,
          optimalLimit: gap.optimal_limit,
          gapValue: gap.gap_value,
        })),
        limitingFactors: result.limiting_factors.map((factor) => ({
          criterionId: factor.criterion_id,
          phaseId: factor.phase_id,
          policy: factor.policy,
          penaltyFactor: factor.penalty_factor,
          observedValue: factor.observed_value,
          optimalLimit: factor.optimal_limit,
          membership: factor.membership,
          docSource: factor.doc_source,
        })),
        missingCriteria: result.missing_criteria,
        unrecognizedVariables: result.unrecognized_variables,
      })),
    };
  }
}
