import { readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';
import { EvaluationRepository, ParcelRepository } from '@/features/evaluations/application/evaluationRepositories';
import { CurrentEvaluationContext, WaterRegime } from '@/features/evaluations/domain/evaluation';
import { GeoJsonGeometry, Parcel } from '@/features/evaluations/domain/parcel';

type StartEvaluationWorkflowInput = {
  name: string;
  district: string;
  areaHa: string;
  selectedCropIds: string[];
  waterRegime: WaterRegime;
  geometry: GeoJsonGeometry | null;
  existingParcel?: Parcel | null;
};

export async function startEvaluationWorkflow(
  parcelRepository: ParcelRepository,
  evaluationRepository: EvaluationRepository,
  input: StartEvaluationWorkflowInput,
): Promise<CurrentEvaluationContext> {
  const session = readAuthSession();
  if (!session) {
    throw new Error('Inicia sesion antes de registrar parcelas.');
  }

  if (!input.selectedCropIds.length) {
    throw new Error('Selecciona al menos un cultivo para evaluar.');
  }

  if (!input.existingParcel && !input.geometry) {
    throw new Error('Delimita una parcela o selecciona una parcela existente.');
  }

  const parcel = input.existingParcel ?? await parcelRepository.createParcel(
    {
      geometry: input.geometry as GeoJsonGeometry,
      metadata: {
        name: input.name.trim() || 'Parcela demo',
        description: `${input.district.trim() || 'Ubicacion no indicada'} - Area estimada: ${input.areaHa || '?'}`,
        crs: 'EPSG:4326',
      },
    },
    session.accessToken,
  );

  const capabilities = await evaluationRepository.getCapabilities();
  const bindings = capabilities.environmentalInputs.scientificallyBoundDatasetVersions;
  const requiredInputs = Math.max(capabilities.environmentalInputs.minimumCount, 1);
  if (bindings.length < requiredInputs) {
    throw new Error('El backend no tiene suficientes versiones de datasets con binding cientifico para iniciar la evaluacion.');
  }

  const environmentalInputs = bindings.slice(0, requiredInputs).map((binding, index) => ({
    inputKey: `environmental-input-${index + 1}`,
    datasetId: binding.datasetId,
    datasetVersionId: binding.datasetVersionId,
  }));

  const accepted = await evaluationRepository.startEvaluation({
    projectId: parcel.projectId,
    parcelId: parcel.id,
    parcelVersion: parcel.currentVersion,
    requestedCrops: input.selectedCropIds,
    waterRegimes: [input.waterRegime],
    environmentalInputs,
  });

  return {
    projectId: parcel.projectId,
    parcelVersion: parcel.currentVersion,
    waterRegime: input.waterRegime,
    parcelId: parcel.id,
    parcelName: parcel.metadata.name,
    parcelLocation: input.existingParcel ? parcel.metadata.description : input.district,
    areaHa: input.existingParcel ? 'Area no registrada' : input.areaHa,
    evaluationId: accepted.evaluationId,
    cropCandidates: input.selectedCropIds.map((cropId) => ({ id: cropId, label: cropId })),
  };
}
