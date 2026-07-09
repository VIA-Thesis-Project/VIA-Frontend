export type EvaluationStatus =
  | 'INICIADA'
  | 'EXTRACCION_COMPLETADA'
  | 'EVALUACION_COMPLETADA'
  | 'RECOMENDACION_COMPLETADA'
  | 'FALLIDA'
  | string;

export type CropCandidate = {
  id: string;
  label: string;
};

export type StartEvaluationInput = {
  parcelId: string;
  requestedBy: string;
  cropCandidates: string[];
  temporalWindow: {
    start: string;
    end: string;
  };
  /** Umbrales de viabilidad definidos por el usuario, en fraccion (0, 1). */
  viableThreshold?: number;
  condicionalThreshold?: number;
};

export type EvaluationAccepted = {
  evaluationId: string;
  status: EvaluationStatus;
};

export type EvaluationStatusSnapshot = {
  evaluationId: string;
  status: EvaluationStatus;
  currentPhase: string;
  lastTransition: string | null;
  failureReason: string | null;
};

export type AgronomyGap = {
  criterionId: string;
  phaseId: string;
  mostLimitingPeriod: string;
  observedValue: number;
  optimalLimit: number;
  gapValue: number;
  criterionName?: string | null;
  criterionLabel?: string | null;
  criterionGroup?: string | null;
  phaseName?: string | null;
  unit?: string | null;
  interventionClass?: string | null;
};

export type LimitingFactor = {
  criterionId: string;
  phaseId: string;
  policy: string;
  penaltyFactor: number | null;
  observedValue: number;
  optimalLimit: number;
  membership: number;
  docSource: string | null;
  criterionName?: string | null;
  criterionLabel?: string | null;
  criterionGroup?: string | null;
  phaseName?: string | null;
  unit?: string | null;
  interventionClass?: string | null;
};

export type CropEvaluationResult = {
  cropId: string;
  score: number | null;
  rankPosition: number | null;
  calcCondition: string;
  viabilityCategory: string;
  gaps: AgronomyGap[];
  limitingFactors: LimitingFactor[];
  missingCriteria: string[];
  unrecognizedVariables: string[];
};

export type EvaluationMcdaResult = {
  evaluationId: string;
  status: EvaluationStatus;
  results: CropEvaluationResult[];
  failureReason: string | null;
};

export type AgroenvVariable = {
  variableName: string;
  criterionId: string;
  cropId: string;
  phaseId: string;
  periodKey: string;
  value: number | null;
  unit: string;
  status: string;
  datasetKey: string;
  band: string;
  source: string;
  criterionName?: string | null;
  criterionLabel?: string | null;
  criterionGroup?: string | null;
  phaseName?: string | null;
  interventionClass?: string | null;
};

export type AgroenvVector = {
  evaluationId: string;
  parcelId: string;
  variables: AgroenvVariable[];
};

export type RecommendationSection = {
  sectionType: string;
  title: string;
  content: string;
};

export type RecommendationEvidence = {
  fragmentId: string;
  documentId?: string | null;
  text?: string | null;
  cropTags?: string[];
  pageRef?: number | null;
  score?: number | null;
  sourceFilename?: string | null;
  sourceFileId?: string | null;
};

export type EvaluationRecommendation = {
  recommendationId: string;
  evaluationId: string;
  parcelId: string | null;
  cropId: string;
  status: string;
  title: string;
  sections: RecommendationSection[];
  evidence: RecommendationEvidence[];
  structuredOutput: Record<string, unknown>;
  gapRecommendations: Array<Record<string, unknown>>;
  createdAt: string;
  provider: string;
};

export type FinalRecommendationResult =
  | {
      status: 'available';
      recommendation: EvaluationRecommendation;
    }
  | {
      status: 'pending';
      detail: string;
    };

export type CurrentEvaluationContext = {
  parcelId: string;
  parcelName: string;
  parcelLocation: string;
  areaHa: string;
  evaluationId: string;
  cropCandidates: CropCandidate[];
};

export type EvaluationSummary = {
  evaluationId: string;
  parcelId: string;
  status: string;
  createdAt: string | null;
  cropCandidates: string[];
  topCropId: string | null;
  topScore: number | null;
  topViabilityCategory: string | null;
};
