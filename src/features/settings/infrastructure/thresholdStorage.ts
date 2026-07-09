export type McdaThresholds = {
  /** Score minimo para categoria VIABLE, en fraccion [0, 1]. */
  viable: number;
  /** Score minimo para categoria CONDICIONAL, en fraccion [0, 1]. */
  condicional: number;
};

export const DEFAULT_THRESHOLDS: McdaThresholds = { viable: 0.7, condicional: 0.4 };

const STORAGE_KEY = 'via.mcda.thresholds';

function isValid(thresholds: McdaThresholds): boolean {
  return (
    Number.isFinite(thresholds.viable)
    && Number.isFinite(thresholds.condicional)
    && thresholds.viable > 0 && thresholds.viable < 1
    && thresholds.condicional > 0 && thresholds.condicional < 1
    && thresholds.condicional < thresholds.viable
  );
}

export function readThresholds(): McdaThresholds {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_THRESHOLDS;

  try {
    const parsed = JSON.parse(raw) as McdaThresholds;
    return isValid(parsed) ? parsed : DEFAULT_THRESHOLDS;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return DEFAULT_THRESHOLDS;
  }
}

export function saveThresholds(thresholds: McdaThresholds): void {
  if (!isValid(thresholds)) {
    throw new Error('El umbral condicional debe ser menor que el viable y ambos estar entre 0 y 1.');
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(thresholds));
}

export function resetThresholds(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function usingDefaults(thresholds: McdaThresholds): boolean {
  return thresholds.viable === DEFAULT_THRESHOLDS.viable && thresholds.condicional === DEFAULT_THRESHOLDS.condicional;
}
