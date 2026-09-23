import { CreateParcelInput, Parcel, Project } from '@/features/evaluations/domain/parcel';
import {
  AgroenvVector,
  EvaluationAccepted,
  EvaluationRecommendation,
  EvaluationSummary,
  FinalRecommendationResult,
  EvaluationCapabilities,
  EvaluationMcdaResult,
  EvaluationStatusSnapshot,
  StartEvaluationInput,
  WaterRegime,
} from '@/features/evaluations/domain/evaluation';

export interface ParcelRepository {
  listProjects(accessToken: string): Promise<Project[]>;
  createParcel(input: CreateParcelInput, accessToken: string): Promise<Parcel>;
  getParcel(parcelId: string, accessToken: string): Promise<Parcel>;
  listParcels(accessToken: string): Promise<Parcel[]>;
  updateParcel(parcelId: string, input: Partial<CreateParcelInput>, accessToken: string): Promise<Parcel>;
  deleteParcel(parcelId: string, accessToken: string): Promise<void>;
}

export interface EvaluationRepository {
  getCapabilities(): Promise<EvaluationCapabilities>;
  startEvaluation(input: StartEvaluationInput): Promise<EvaluationAccepted>;
  listEvaluationsForParcel(parcelId: string): Promise<EvaluationSummary[]>;
  getEvaluationStatus(evaluationId: string): Promise<EvaluationStatusSnapshot>;
  getMcdaResult(evaluationId: string, waterRegime?: WaterRegime): Promise<EvaluationMcdaResult>;
  getAgroenvVector(evaluationId: string): Promise<AgroenvVector>;
  getRecommendationsForEvaluation(evaluationId: string): Promise<EvaluationRecommendation[]>;
  ensureRecommendationsForEvaluation(evaluationId: string, waterRegime?: WaterRegime): Promise<EvaluationRecommendation[]>;
  getFinalRecommendation(evaluationId: string, waterRegime?: WaterRegime): Promise<FinalRecommendationResult>;
  getRecommendation(recommendationId: string): Promise<EvaluationRecommendation>;
}
