import { readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';
import { EvaluationRepository } from '@/features/evaluations/application/evaluationRepositories';
import {
  EnvironmentalInputReference,
  EvaluationCapabilities,
  EvaluationAccepted,
  EvaluationMcdaResult,
  EvaluationRecommendation,
  EvaluationStatusSnapshot,
  EvaluationSummary,
  FinalRecommendationResult,
  StartEvaluationInput,
  WaterRegime,
} from '@/features/evaluations/domain/evaluation';
import { ApiError, apiRequest } from '@/shared/infrastructure/http/apiClient';

function authToken(): string | undefined {
  return readAuthSession()?.accessToken;
}

type CapabilitiesResponse = {
  crops: Array<{
    crop_id: string;
    display_name: string | null;
    water_regimes: WaterRegime[];
  }>;
  environmental_inputs: {
    minimum_count: number;
    scientifically_bound_dataset_versions: Array<{
      dataset_id: string;
      dataset_version_id: string;
    }>;
  };
};

type EvaluationResponse = {
  id: string;
  parcel_snapshot: {
    project_id: string;
    parcel_id: string;
    parcel_version: number;
  };
  requested_crops: string[];
  requested_water_regimes: WaterRegime[];
  status: string;
  created_at: string;
};

type EvaluationStatusResponse = {
  evaluation_id: string;
  status: string;
  requested_crops: string[];
  requested_crop_count: number;
  completed_crop_count: number;
  requested_water_regimes: WaterRegime[];
  requested_execution_count: number;
  completed_execution_count: number;
  created_at: string;
  project_id: string;
  parcel_id: string;
  parcel_version: number;
  parcel_captured_at: string;
  failed: boolean;
};

type SuitabilityResponse = {
  mean: number | null;
  minimum: number | null;
  maximum: number | null;
  valid_cells: number;
  valid_area_m2: number;
  coverage_fraction: number;
  zero_suitability_area_m2: number;
};

type OutcomeResponse = {
  crop_id: string;
  water_regime: WaterRegime;
  status: string;
  suitability: SuitabilityResponse | null;
};

type ResultResponse = {
  evaluation_id: string;
  evaluation_status: string;
  availability: string;
  requested_crops: string[];
  requested_crop_count: number;
  completed_crop_count: number;
  requested_water_regimes: WaterRegime[];
  requested_execution_count: number;
  completed_execution_count: number;
  outcomes: OutcomeResponse[];
  scenarios: Array<{
    water_regime: WaterRegime;
    outcomes: OutcomeResponse[];
    comparable_crops: Array<{ crop_id: string; mean: number; rank: number }>;
  }>;
};

type LimitationsResponse = {
  limitations: Array<{
    crop_id: string;
    water_regime: WaterRegime;
    status: string;
    limitation_evidence: {
      factors: Array<{
        factor_code: string;
        display_label: string;
        affected_fraction: number;
        affected_area_m2: number;
        source_sha256: string;
      }>;
    };
  }>;
};

type RecommendationRunResponse = {
  run_id: string;
  evaluation_id: string;
  crop_id: string;
  water_regime: WaterRegime;
  status: string;
  provider: string;
  model: string;
  recommendation: {
    summary: string;
    observations: string[];
    scenario_interpretation: string;
    recommendations: Array<{ text: string; rationale: string; citation_ids: string[] }>;
    uncertainties: string[];
    citation_ids: string[];
  } | null;
  failure_reason: string | null;
  created_at: string;
};

type RecommendationRequest = {
  crop_id: string;
  water_regime: WaterRegime;
  force_regenerate?: boolean;
};

export class EvaluationApiRepository implements EvaluationRepository {
  async getCapabilities(): Promise<EvaluationCapabilities> {
    const response = await apiRequest<CapabilitiesResponse>('/v1/evaluation-capabilities', {
      token: authToken(),
    });
    return {
      crops: response.crops.map((crop) => ({
        cropId: crop.crop_id,
        displayName: crop.display_name,
        waterRegimes: crop.water_regimes,
      })),
      environmentalInputs: {
        minimumCount: response.environmental_inputs.minimum_count,
        scientificallyBoundDatasetVersions: response.environmental_inputs.scientifically_bound_dataset_versions,
      },
    };
  }

  async startEvaluation(input: StartEvaluationInput): Promise<EvaluationAccepted> {
    const response = await apiRequest<EvaluationResponse>('/v1/evaluations', {
      method: 'POST',
      token: authToken(),
      body: {
        parcel_reference: {
          project_id: input.projectId,
          parcel_id: input.parcelId,
          parcel_version: input.parcelVersion,
        },
        requested_crops: input.requestedCrops,
        water_regimes: input.waterRegimes,
        environmental_inputs: input.environmentalInputs.map(toEnvironmentalInputBody),
      },
    });

    return { evaluationId: response.id, status: response.status };
  }

  async listEvaluationsForParcel(parcelId: string): Promise<EvaluationSummary[]> {
    const response = await apiRequest<EvaluationResponse[]>('/v1/evaluations', { token: authToken() });
    return response
      .filter((evaluation) => evaluation.parcel_snapshot.parcel_id === parcelId)
      .map((evaluation) => ({
        evaluationId: evaluation.id,
        parcelId: evaluation.parcel_snapshot.parcel_id,
        status: evaluation.status,
        createdAt: evaluation.created_at,
        cropCandidates: evaluation.requested_crops,
        topCropId: null,
        topScore: null,
        topViabilityCategory: null,
      }));
  }

  async getEvaluationStatus(evaluationId: string): Promise<EvaluationStatusSnapshot> {
    const response = await apiRequest<EvaluationStatusResponse>(`/v1/evaluations/${evaluationId}`, {
      token: authToken(),
    });
    return {
      evaluationId: response.evaluation_id,
      status: response.status,
      currentPhase: response.status,
      lastTransition: response.created_at,
      failureReason: response.failed ? 'La evaluacion fallo en el backend.' : null,
    };
  }

  async getMcdaResult(evaluationId: string): Promise<EvaluationMcdaResult> {
    const [result, limitations] = await Promise.all([
      apiRequest<ResultResponse>(`/v1/evaluations/${evaluationId}/result`, { token: authToken() }),
      apiRequest<LimitationsResponse>(`/v1/evaluations/${evaluationId}/limitations`, { token: authToken() }),
    ]);
    const scenario = result.scenarios.find((item) => item.water_regime === 'rainfed') ?? result.scenarios[0];
    const outcomes = scenario?.outcomes ?? result.outcomes;
    const comparable = scenario?.comparable_crops ?? [];

    return {
      evaluationId: result.evaluation_id,
      status: result.evaluation_status,
      failureReason: result.availability === 'failed' ? 'La evaluacion fallo en el backend.' : null,
      results: outcomes.map((outcome) => {
        const rank = comparable.find((item) => item.crop_id === outcome.crop_id);
        const cropLimitations = limitations.limitations.find(
          (item) => item.crop_id === outcome.crop_id && item.water_regime === outcome.water_regime,
        );
        return {
          cropId: outcome.crop_id,
          score: outcome.suitability?.mean ?? null,
          rankPosition: rank?.rank ?? null,
          calcCondition: outcome.status,
          viabilityCategory: outcome.status,
          gaps: [],
          limitingFactors: (cropLimitations?.limitation_evidence.factors ?? []).map((factor) => ({
            criterionId: factor.factor_code,
            phaseId: '',
            policy: factor.display_label,
            penaltyFactor: null,
            observedValue: factor.affected_fraction,
            optimalLimit: 1,
            membership: 1 - factor.affected_fraction,
            docSource: factor.source_sha256,
          })),
          missingCriteria: [],
          unrecognizedVariables: [],
        };
      }),
    };
  }

  async getRecommendationsForEvaluation(evaluationId: string): Promise<EvaluationRecommendation[]> {
    const response = await apiRequest<RecommendationRunResponse[]>(
      `/v1/decision-support/evaluations/${evaluationId}/recommendations`,
      { token: authToken() },
    );
    return response.filter((run) => run.recommendation !== null).map(toRecommendation);
  }

  async getFinalRecommendation(evaluationId: string): Promise<FinalRecommendationResult> {
    const existing = await this.getRecommendationsForEvaluation(evaluationId);
    const available = existing.filter((item) => item.status === 'succeeded');
    if (available.length > 0) {
      return { status: 'available', recommendation: available.at(-1)! };
    }

    const result = await this.getMcdaResult(evaluationId);
    const crop = result.results.find((item) => item.calcCondition === 'succeeded');
    if (!crop) return { status: 'pending', detail: 'No hay cultivos finalizados para recomendar.' };

    const response = await apiRequest<RecommendationRunResponse>(
      `/v1/decision-support/evaluations/${evaluationId}/recommendations`,
      {
        method: 'POST',
        token: authToken(),
        body: {
          crop_id: crop.cropId,
          water_regime: 'rainfed',
        } satisfies RecommendationRequest,
      },
    );
    if (!response.recommendation) {
      return { status: 'pending', detail: response.failure_reason ?? 'La recomendacion aun no esta disponible.' };
    }
    return { status: 'available', recommendation: toRecommendation(response) };
  }

  async getAgroenvVector(_evaluationId: string): Promise<never> {
    throw new ApiError('El backend actual no expone el vector agroambiental.', 404);
  }

  async getRecommendation(_recommendationId: string): Promise<EvaluationRecommendation> {
    throw new ApiError('El backend actual no expone recomendaciones por identificador independiente.', 404);
  }
}

function toEnvironmentalInputBody(input: EnvironmentalInputReference) {
  return {
    input_key: input.inputKey,
    dataset_id: input.datasetId,
    dataset_version_id: input.datasetVersionId,
  };
}

function toRecommendation(response: RecommendationRunResponse): EvaluationRecommendation {
  const structured = response.recommendation;
  const sections = structured
    ? [
        { sectionType: 'summary', title: 'Resumen', content: structured.summary },
        { sectionType: 'observations', title: 'Observaciones', content: structured.observations.join('\n') },
        { sectionType: 'scenario', title: 'Interpretacion del escenario', content: structured.scenario_interpretation },
        { sectionType: 'recommendations', title: 'Recomendaciones', content: structured.recommendations.map((item) => `${item.text}\n${item.rationale}`).join('\n\n') },
        { sectionType: 'uncertainties', title: 'Incertidumbres', content: structured.uncertainties.join('\n') },
      ]
    : [];

  return {
    recommendationId: response.run_id,
    evaluationId: response.evaluation_id,
    parcelId: null,
    cropId: response.crop_id,
    status: response.status,
    title: structured?.summary ?? `Recomendacion para ${response.crop_id}`,
    sections,
    evidence: [],
    structuredOutput: structured ?? {},
    gapRecommendations: [],
    createdAt: response.created_at,
    provider: response.provider,
  };
}
