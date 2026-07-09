import { readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';
import { cropCatalog } from '@/features/evaluations/application/cropCatalog';
import { readThresholds, usingDefaults } from '@/features/settings/infrastructure/thresholdStorage';
import { EvaluationRepository, ParcelRepository } from '@/features/evaluations/application/evaluationRepositories';
import { CurrentEvaluationContext } from '@/features/evaluations/domain/evaluation';
import { GeoJsonGeometry, Parcel } from '@/features/evaluations/domain/parcel';

type StartEvaluationWorkflowInput = {
  name: string;
  district: string;
  areaHa: string;
  selectedCropIds: string[];
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

  // Umbrales de viabilidad definidos por el usuario en Configuracion; solo se
  // envian cuando difieren de los valores por defecto del sistema.
  const thresholds = readThresholds();
  const customThresholds = usingDefaults(thresholds)
    ? {}
    : { viableThreshold: thresholds.viable, condicionalThreshold: thresholds.condicional };

  const accepted = await evaluationRepository.startEvaluation({
    parcelId: parcel.id,
    requestedBy: session.user.id,
    cropCandidates: input.selectedCropIds,
    temporalWindow: {
      start: '2025-01-01',
      end: '2025-12-31',
    },
    ...customThresholds,
  });

  return {
    parcelId: parcel.id,
    parcelName: parcel.metadata.name,
    parcelLocation: input.existingParcel ? parcel.metadata.description : input.district,
    areaHa: input.existingParcel ? 'Area no registrada' : input.areaHa,
    evaluationId: accepted.evaluationId,
    cropCandidates: input.selectedCropIds.map((cropId) => cropCatalog.find((crop) => crop.id === cropId) ?? { id: cropId, label: cropId }),
  };
}
