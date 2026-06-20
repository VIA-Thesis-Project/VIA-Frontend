import { CloudRain, Droplets, FlaskConical, Layers, Mountain, Satellite, Thermometer } from 'lucide-react';

export const processingSteps = [
  { id: 1, label: 'Validando geometría de la parcela', sub: 'Verificando polígono y cobertura espacial' },
  { id: 2, label: 'Consultando datos agroambientales', sub: 'Google Earth Engine · SENAMHI · INIA' },
  { id: 3, label: 'Calculando variables por parcela', sub: 'Interpolación espacial y agregación estadística' },
  { id: 4, label: 'Ejecutando MCDA difuso / Fuzzy AHP', sub: 'Evaluando criterios con funciones de membresía' },
  { id: 5, label: 'Generando recomendaciones (LLM/RAG)', sub: 'Recuperando documentos técnicos relevantes' },
];

export const processingVariables = [
  { icon: FlaskConical, label: 'pH del suelo', value: '7.8', unit: '', status: 'Tolerable', statusColor: '#d97706', statusBg: '#fef3c7', color: '#d97706', bg: '#fffbeb', detail: 'Ligeramente alcalino' },
  { icon: Mountain, label: 'Pendiente', value: '4.2', unit: '%', status: 'Óptimo', statusColor: '#16a34a', statusBg: '#dcfce7', color: '#78716c', bg: '#fafaf9', detail: 'Terreno suave' },
  { icon: Droplets, label: 'Humedad estimada', value: '18', unit: '%', status: 'Tolerable', statusColor: '#d97706', statusBg: '#fef3c7', color: '#0891b2', bg: '#ecfeff', detail: 'Déficit moderado' },
  { icon: Satellite, label: 'NDVI', value: '0.62', unit: '', status: 'Óptimo', statusColor: '#16a34a', statusBg: '#dcfce7', color: '#16a34a', bg: '#f0fdf4', detail: 'Vegetación activa' },
  { icon: Thermometer, label: 'Temperatura media', value: '21.4', unit: '°C', status: 'Óptimo', statusColor: '#16a34a', statusBg: '#dcfce7', color: '#dc2626', bg: '#fff1f2', detail: 'Rango adecuado' },
  { icon: CloudRain, label: 'Precipitación est.', value: '35', unit: 'mm', status: 'Tolerable', statusColor: '#d97706', statusBg: '#fef3c7', color: '#0891b2', bg: '#ecfeff', detail: 'Requiere riego suplementario' },
  { icon: Layers, label: 'Textura del suelo', value: 'Franco', unit: 'arenosa', status: 'Óptimo', statusColor: '#16a34a', statusBg: '#dcfce7', color: '#92400e', bg: '#fef3c7', detail: 'Drenaje adecuado' },
];

export const dataSources = [
  { name: 'Google Earth Engine', desc: 'NDVI, topografía, textura', dot: '#16a34a' },
  { name: 'SENAMHI', desc: 'Temperatura, precipitación', dot: '#0891b2' },
  { name: 'INIA Perú', desc: 'Parámetros de suelo (pH, salinidad)', dot: '#d97706' },
  { name: 'SIG Lima Metropolitana', desc: 'Límites distritales, parcelas', dot: '#7c3aed' },
];
