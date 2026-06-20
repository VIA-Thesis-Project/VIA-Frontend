import { readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';
import { cropCatalog } from '@/features/evaluations/application/cropCatalog';
import { EvaluationRepository, ParcelRepository } from '@/features/evaluations/application/evaluationRepositories';
import { CurrentEvaluationContext } from '@/features/evaluations/domain/evaluation';
import { GeoJsonGeometry } from '@/features/evaluations/domain/parcel';

type StartEvaluationWorkflowInput = {
  name: string;
  district: string;
  areaHa: string;
  selectedCropIds: string[];
  geometry: GeoJsonGeometry;
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

  const parcel = await parcelRepository.createParcel(
    {
      geometry: input.geometry,
      metadata: {
        name: input.name.trim() || 'Parcela demo',
        description: `${input.district.trim() || 'Ubicacion no indicada'} - ${input.areaHa || '?'} ha`,
        crs: 'EPSG:4326',
      },
    },
    session.accessToken,
  );

  const accepted = await evaluationRepository.startEvaluation({
    parcelId: parcel.id,
    requestedBy: session.user.id,
    cropCandidates: input.selectedCropIds,
    temporalWindow: {
      start: '2025-01-01',
      end: '2025-12-31',
    },
  });

  return {
    parcelId: parcel.id,
    parcelName: parcel.metadata.name,
    parcelLocation: input.district,
    areaHa: input.areaHa,
    evaluationId: accepted.evaluationId,
    cropCandidates: input.selectedCropIds.map((cropId) => cropCatalog.find((crop) => crop.id === cropId) ?? { id: cropId, label: cropId }),
  };
}
