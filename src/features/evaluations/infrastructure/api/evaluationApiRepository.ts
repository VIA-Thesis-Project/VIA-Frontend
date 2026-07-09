import { readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';
import { EvaluationRepository } from '@/features/evaluations/application/evaluationRepositories';
import {
  AgroenvVector,
  EvaluationAccepted,
  EvaluationRecommendation,
  EvaluationSummary,
  FinalRecommendationResult,
  EvaluationMcdaResult,
  EvaluationStatusSnapshot,
  StartEvaluationInput,
} from '@/features/evaluations/domain/evaluation';
import { ApiError, apiRequest } from '@/shared/infrastructure/http/apiClient';

// Evaluation endpoints require Bearer auth (contract change T0.1); the backend
// takes requested_by from the token instead of the request body.
function authToken(): string | undefined {
  return readAuthSession()?.accessToken;
}

type StartEvaluationResponse = {
  evaluation_id: string;
  status: string;
};

type EvaluationSummaryResponse = {
  evaluation_id: string;
  parcel_id: string;
  status: string;
  created_at: string | null;
  crop_candidates: string[];
  top_crop_id: string | null;
  top_score: number | null;
  top_viability_category: string | null;
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
      criterion_name?: string | null;
      criterion_label?: string | null;
      criterion_group?: string | null;
      phase_name?: string | null;
      unit?: string | null;
      intervention_class?: string | null;
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
      criterion_name?: string | null;
      criterion_label?: string | null;
      criterion_group?: string | null;
      phase_name?: string | null;
      unit?: string | null;
      intervention_class?: string | null;
    }>;
    missing_criteria: string[];
    unrecognized_variables: string[];
  }>;
  failure_reason: string | null;
};

type AgroenvVectorResponse = {
  evaluation_id: string;
  parcel_id: string;
  variables: Array<{
    variable_name: string;
    criterion_id: string;
    crop_id: string;
    phase_id: string;
    period_key: string;
    value: number | null;
    unit: string;
    status: string;
    dataset_key: string;
    band: string;
    source: string;
    criterion_name?: string | null;
    criterion_label?: string | null;
    criterion_group?: string | null;
    phase_name?: string | null;
    intervention_class?: string | null;
  }>;
};

type RecommendationResponse = {
  recommendation_id: string;
  evaluation_id: string;
  parcel_id: string | null;
  crop_id: string;
  status: string;
  title: string;
  sections: Array<{
    section_type: string;
    title: string;
    content: string;
  }>;
  evidence: Array<{
    fragment_id: string;
    document_id?: string | null;
    text?: string | null;
    crop_tags?: string[];
    page_ref?: number | null;
    score?: number | null;
    source_filename?: string | null;
    source_file_id?: string | null;
  }>;
  structured_output?: Record<string, unknown>;
  gap_recommendations?: Array<Record<string, unknown>>;
  created_at: string;
  provider: string;
};

type PendingRecommendationResponse = {
  evaluation_id: string;
  status: 'pending';
  detail: string;
};

export class EvaluationApiRepository implements EvaluationRepository {
  async startEvaluation(input: StartEvaluationInput): Promise<EvaluationAccepted> {
    const response = await apiRequest<StartEvaluationResponse>('/evaluaciones', {
      method: 'POST',
      token: authToken(),
      body: {
        parcel_id: input.parcelId,
        crop_candidates: input.cropCandidates,
        temporal_window: input.temporalWindow,
        viable_threshold: input.viableThreshold,
        condicional_threshold: input.condicionalThreshold,
      },
    });

    return {
      evaluationId: response.evaluation_id,
      status: response.status,
    };
  }

  async listEvaluationsForParcel(parcelId: string): Promise<EvaluationSummary[]> {
    const response = await apiRequest<EvaluationSummaryResponse[]>(
      `/evaluaciones?parcel_id=${encodeURIComponent(parcelId)}`,
      { token: authToken() },
    );

    return response.map((summary) => ({
      evaluationId: summary.evaluation_id,
      parcelId: summary.parcel_id,
      status: summary.status,
      createdAt: summary.created_at,
      cropCandidates: summary.crop_candidates,
      topCropId: summary.top_crop_id,
      topScore: summary.top_score,
      topViabilityCategory: summary.top_viability_category,
    }));
  }

  async getEvaluationStatus(evaluationId: string): Promise<EvaluationStatusSnapshot> {
    const response = await apiRequest<EvaluationStatusResponse>(`/evaluaciones/${evaluationId}/estado`, { token: authToken() });
    return {
      evaluationId: response.evaluation_id,
      status: response.status,
      currentPhase: response.current_phase,
      lastTransition: response.last_transition,
      failureReason: response.failure_reason,
    };
  }

  async getMcdaResult(evaluationId: string): Promise<EvaluationMcdaResult> {
    const response = await apiRequest<McdaResultResponse>(`/evaluaciones/${evaluationId}/resultado-mcda`, { token: authToken() });
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
          criterionName: gap.criterion_name,
          criterionLabel: gap.criterion_label,
          criterionGroup: gap.criterion_group,
          phaseName: gap.phase_name,
          unit: gap.unit,
          interventionClass: gap.intervention_class,
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
          criterionName: factor.criterion_name,
          criterionLabel: factor.criterion_label,
          criterionGroup: factor.criterion_group,
          phaseName: factor.phase_name,
          unit: factor.unit,
          interventionClass: factor.intervention_class,
        })),
        missingCriteria: result.missing_criteria,
        unrecognizedVariables: result.unrecognized_variables,
      })),
    };
  }

  async getAgroenvVector(evaluationId: string): Promise<AgroenvVector> {
    const response = await apiRequest<AgroenvVectorResponse>(`/evaluaciones/${evaluationId}/vector-agroambiental`, { token: authToken() });
    return {
      evaluationId: response.evaluation_id,
      parcelId: response.parcel_id,
      variables: response.variables.map((entry) => ({
        variableName: entry.variable_name,
        criterionId: entry.criterion_id,
        cropId: entry.crop_id,
        phaseId: entry.phase_id,
        periodKey: entry.period_key,
        value: entry.value,
        unit: entry.unit,
        status: entry.status,
        datasetKey: entry.dataset_key,
        band: entry.band,
        source: entry.source,
        criterionName: entry.criterion_name,
        criterionLabel: entry.criterion_label,
        criterionGroup: entry.criterion_group,
        phaseName: entry.phase_name,
        interventionClass: entry.intervention_class,
      })),
    };
  }

  async getFinalRecommendation(evaluationId: string): Promise<FinalRecommendationResult> {
    try {
      const response = await apiRequest<RecommendationResponse | PendingRecommendationResponse>(
        `/evaluaciones/${evaluationId}/recomendacion-final`,
        { token: authToken() },
      );

      if ('recommendation_id' in response) {
        return {
          status: 'available',
          recommendation: toRecommendation(response),
        };
      }

      return {
        status: 'pending',
        detail: response.detail,
      };
    } catch (error) {
      if (error instanceof ApiError && error.status === 202) {
        return {
          status: 'pending',
          detail: 'Recomendacion aun no disponible.',
        };
      }
      throw error;
    }
  }

  async getRecommendationsForEvaluation(evaluationId: string): Promise<EvaluationRecommendation[]> {
    const response = await apiRequest<RecommendationResponse[]>(`/evaluaciones/${evaluationId}/recomendaciones`, { token: authToken() });
    return response.map(toRecommendation);
  }

  async getRecommendation(recommendationId: string): Promise<EvaluationRecommendation> {
    const response = await apiRequest<RecommendationResponse>(`/recomendaciones/${recommendationId}`, { token: authToken() });
    return toRecommendation(response);
  }
}

function toRecommendation(response: RecommendationResponse): EvaluationRecommendation {
  return {
    recommendationId: response.recommendation_id,
    evaluationId: response.evaluation_id,
    parcelId: response.parcel_id,
    cropId: response.crop_id,
    status: response.status,
    title: response.title,
    sections: response.sections.map((section) => ({
      sectionType: section.section_type,
      title: section.title,
      content: section.content,
    })),
    evidence: response.evidence.map((item) => ({
      fragmentId: item.fragment_id,
      documentId: item.document_id,
      text: item.text,
      cropTags: item.crop_tags ?? [],
      pageRef: item.page_ref,
      score: item.score,
      sourceFilename: item.source_filename,
      sourceFileId: item.source_file_id,
    })),
    structuredOutput: response.structured_output ?? {},
    gapRecommendations: response.gap_recommendations ?? [],
    createdAt: response.created_at,
    provider: response.provider,
  };
}
