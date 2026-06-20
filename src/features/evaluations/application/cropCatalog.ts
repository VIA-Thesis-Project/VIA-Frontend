import { CropCandidate } from '@/features/evaluations/domain/evaluation';

export const cropCatalog: CropCandidate[] = [
  { id: 'demo_maiz', label: 'Maiz' },
  { id: 'demo_papa', label: 'Papa' },
  { id: 'demo_quinua', label: 'Quinua' },
  { id: 'demo_palta', label: 'Palta' },
  { id: 'demo_arandano', label: 'Arandano' },
];

export function getCropLabel(cropId: string): string {
  return cropCatalog.find((crop) => crop.id === cropId)?.label ?? cropId;
}
