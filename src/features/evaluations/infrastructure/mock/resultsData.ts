export const crops = [
  {
    emoji: '🍠', name: 'Camote', score: 86, category: 'Viabilidad alta',
    catColor: '#16a34a', catBg: '#f0fdf4', catBorder: '#bbf7d0',
    positives: ['pH tolerable (7.8)', 'NDVI alto (0.62)', 'Temperatura óptima'],
    limitants: ['Humedad moderada (18%)'],
  },
  {
    emoji: '🌽', name: 'Maíz', score: 78, category: 'Viabilidad media-alta',
    catColor: '#0891b2', catBg: '#ecfeff', catBorder: '#a5f3fc',
    positives: ['Pendiente baja (4.2%)', 'Temperatura adecuada'],
    limitants: ['Precipitación baja (35 mm)', 'pH ligeramente alto'],
  },
  {
    emoji: '🍅', name: 'Tomate', score: 64, category: 'Viabilidad media',
    catColor: '#d97706', catBg: '#fffbeb', catBorder: '#fde68a',
    positives: ['Textura arenosa favorable', 'NDVI positivo'],
    limitants: ['Humedad insuficiente', 'pH borderline', 'Requiere fertiriego'],
  },
  {
    emoji: '🥔', name: 'Papa', score: 51, category: 'Viabilidad baja-media',
    catColor: '#7c3aed', catBg: '#faf5ff', catBorder: '#ddd6fe',
    positives: ['Pendiente adecuada'],
    limitants: ['Temperatura alta (21.4°C)', 'Humedad baja', 'pH desfavorable'],
  },
  {
    emoji: '🫐', name: 'Arándano', score: 39, category: 'Viabilidad baja',
    catColor: '#dc2626', catBg: '#fee2e2', catBorder: '#fecaca',
    positives: ['NDVI presente'],
    limitants: ['pH muy alto (7.8, óptimo 4.5–5.5)', 'Temperatura excesiva', 'Baja acidez de suelo'],
  },
];

export const radarData = [
  { criterio: 'Suelo', Camote: 88, Maíz: 72, Tomate: 60 },
  { criterio: 'Clima', Camote: 84, Maíz: 80, Tomate: 62 },
  { criterio: 'Topografía', Camote: 91, Maíz: 88, Tomate: 75 },
  { criterio: 'NDVI', Camote: 88, Maíz: 72, Tomate: 65 },
  { criterio: 'Salinidad', Camote: 82, Maíz: 70, Tomate: 58 },
];
