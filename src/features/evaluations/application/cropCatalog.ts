import { CropCandidate } from '@/features/evaluations/domain/evaluation';

export const cropCatalog: CropCandidate[] = [
  { id: 'maiz_amarillo_duro', label: 'Maiz amarillo duro' },
  { id: 'mandarina_murcott', label: 'Mandarina Murcott' },
  { id: 'maracuya_criolla_amarilla', label: 'Maracuya criolla amarilla' },
  { id: 'palta_hass', label: 'Palta Hass' },
  { id: 'uva_de_mesa_sweet_globe', label: 'Uva de mesa Sweet Globe' },
];

export function getCropLabel(cropId: string): string {
  return cropCatalog.find((crop) => crop.id === cropId)?.label ?? cropId;
}
