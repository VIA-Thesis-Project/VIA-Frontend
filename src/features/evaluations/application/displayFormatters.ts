type CriterionLike = {
  criterionId: string;
  criterionName?: string | null;
  criterionLabel?: string | null;
  phaseId?: string | null;
  phaseName?: string | null;
  unit?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  INICIADA: 'Iniciada',
  EXTRACCION_COMPLETADA: 'Extraccion completada',
  EVALUACION_COMPLETADA: 'Evaluacion completada',
  RECOMENDACION_COMPLETADA: 'Recomendacion completada',
  FALLIDA: 'Fallida',
  GENERATED: 'Generada',
  PENDING: 'Pendiente',
  VIABLE: 'Viable',
  CONDICIONAL: 'Condicional',
  NO_VIABLE: 'No viable',
  NO_CONCLUYENTE: 'No concluyente',
  DEFINITIVO: 'Definitivo',
  PARCIAL: 'Parcial',
};

export function humanizeToken(value: string | null | undefined): string {
  if (!value) return '-';
  if (STATUS_LABELS[value]) return STATUS_LABELS[value];

  return value
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

export function formatBackendStatus(value: string | null | undefined): string {
  return humanizeToken(value);
}

export function formatCriterionLabel(item: CriterionLike): string {
  return item.criterionLabel || humanizeToken(item.criterionName || item.criterionId);
}

export function formatPhaseLabel(item: CriterionLike): string {
  return item.phaseName || humanizeToken(item.phaseId);
}

export function formatNumberWithUnit(value: number, unit?: string | null): string {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return unit ? `${formatted} ${unit}` : formatted;
}
