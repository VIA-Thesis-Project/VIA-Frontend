import { CreateParcelInput, Parcel } from '@/features/evaluations/domain/parcel';
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

export interface ParcelRepository {
  createParcel(input: CreateParcelInput, accessToken: string): Promise<Parcel>;
  getParcel(parcelId: string, accessToken: string): Promise<Parcel>;
  listParcels(accessToken: string): Promise<Parcel[]>;
  updateParcel(parcelId: string, input: Partial<CreateParcelInput>, accessToken: string): Promise<Parcel>;
  deleteParcel(parcelId: string, accessToken: string): Promise<void>;
}

export interface EvaluationRepository {
  startEvaluation(input: StartEvaluationInput): Promise<EvaluationAccepted>;
  listEvaluationsForParcel(parcelId: string): Promise<EvaluationSummary[]>;
  getEvaluationStatus(evaluationId: string): Promise<EvaluationStatusSnapshot>;
  getMcdaResult(evaluationId: string): Promise<EvaluationMcdaResult>;
  getAgroenvVector(evaluationId: string): Promise<AgroenvVector>;
  getRecommendationsForEvaluation(evaluationId: string): Promise<EvaluationRecommendation[]>;
  getFinalRecommendation(evaluationId: string): Promise<FinalRecommendationResult>;
  getRecommendation(recommendationId: string): Promise<EvaluationRecommendation>;
}
