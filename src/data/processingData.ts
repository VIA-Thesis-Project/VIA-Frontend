import { CloudRain, Droplets, FlaskConical, Layers, Mountain, Satellite, Thermometer } from 'lucide-react';

export const processingSteps = [
  { id: 1, label: 'Validando geometrÃ­a de la parcela', sub: 'Verificando polÃ­gono y cobertura espacial' },
  { id: 2, label: 'Consultando datos agroambientales', sub: 'Google Earth Engine Â· SENAMHI Â· INIA' },
  { id: 3, label: 'Calculando variables por parcela', sub: 'InterpolaciÃ³n espacial y agregaciÃ³n estadÃ­stica' },
  { id: 4, label: 'Ejecutando MCDA difuso / Fuzzy AHP', sub: 'Evaluando criterios con funciones de membresÃ­a' },
  { id: 5, label: 'Generando recomendaciones (LLM/RAG)', sub: 'Recuperando documentos tÃ©cnicos relevantes' },
];

export const processingVariables = [
  { icon: FlaskConical, label: 'pH del suelo', value: '7.8', unit: '', status: 'Tolerable', statusColor: '#d97706', statusBg: '#fef3c7', color: '#d97706', bg: '#fffbeb', detail: 'Ligeramente alcalino' },
  { icon: Mountain, label: 'Pendiente', value: '4.2', unit: '%', status: 'Ã“ptimo', statusColor: '#16a34a', statusBg: '#dcfce7', color: '#78716c', bg: '#fafaf9', detail: 'Terreno suave' },
  { icon: Droplets, label: 'Humedad estimada', value: '18', unit: '%', status: 'Tolerable', statusColor: '#d97706', statusBg: '#fef3c7', color: '#0891b2', bg: '#ecfeff', detail: 'DÃ©ficit moderado' },
  { icon: Satellite, label: 'NDVI', value: '0.62', unit: '', status: 'Ã“ptimo', statusColor: '#16a34a', statusBg: '#dcfce7', color: '#16a34a', bg: '#f0fdf4', detail: 'VegetaciÃ³n activa' },
  { icon: Thermometer, label: 'Temperatura media', value: '21.4', unit: 'Â°C', status: 'Ã“ptimo', statusColor: '#16a34a', statusBg: '#dcfce7', color: '#dc2626', bg: '#fff1f2', detail: 'Rango adecuado' },
  { icon: CloudRain, label: 'PrecipitaciÃ³n est.', value: '35', unit: 'mm', status: 'Tolerable', statusColor: '#d97706', statusBg: '#fef3c7', color: '#0891b2', bg: '#ecfeff', detail: 'Requiere riego suplementario' },
  { icon: Layers, label: 'Textura del suelo', value: 'Franco', unit: 'arenosa', status: 'Ã“ptimo', statusColor: '#16a34a', statusBg: '#dcfce7', color: '#92400e', bg: '#fef3c7', detail: 'Drenaje adecuado' },
];

export const dataSources = [
  { name: 'Google Earth Engine', desc: 'NDVI, topografÃ­a, textura', dot: '#16a34a' },
  { name: 'SENAMHI', desc: 'Temperatura, precipitaciÃ³n', dot: '#0891b2' },
  { name: 'INIA PerÃº', desc: 'ParÃ¡metros de suelo (pH, salinidad)', dot: '#d97706' },
  { name: 'SIG Lima Metropolitana', desc: 'LÃ­mites distritales, parcelas', dot: '#7c3aed' },
];
