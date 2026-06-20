import { CreateParcelInput, Parcel } from '@/features/evaluations/domain/parcel';
import {
  EvaluationAccepted,
  EvaluationMcdaResult,
  EvaluationStatusSnapshot,
  StartEvaluationInput,
} from '@/features/evaluations/domain/evaluation';

export interface ParcelRepository {
  createParcel(input: CreateParcelInput, accessToken: string): Promise<Parcel>;
}

export interface EvaluationRepository {
  startEvaluation(input: StartEvaluationInput): Promise<EvaluationAccepted>;
  getEvaluationStatus(evaluationId: string): Promise<EvaluationStatusSnapshot>;
  getMcdaResult(evaluationId: string): Promise<EvaluationMcdaResult>;
}
