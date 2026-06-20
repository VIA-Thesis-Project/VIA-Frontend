import { AlertTriangle, Droplets, Satellite, Sprout } from 'lucide-react';

export const recommendationBlocks = [
  {
    icon: Sprout,
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    title: 'Manejo del suelo',
    items: [
      'Aplicar enmiendas de materia orgánica (compost) para mejorar la capacidad de retención hídrica del suelo franco-arenoso.',
      'Monitorear el pH periódicamente. Si supera 8.0, considerar la aplicación de azufre elemental o fertilizantes acidificantes.',
      'Realizar labranza conservacionista para preservar la estructura del suelo y reducir la compactación.',
      'Evaluar la conductividad eléctrica (CE) para descartar acumulación salina antes de la siembra.',
    ],
  },
  {
    icon: Droplets,
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
    title: 'Manejo hídrico',
    items: [
      'Implementar riego por goteo o riego por surcos para compensar la humedad observada (18%) respecto al umbral óptimo (25-40%).',
      'Programar riegos en función de la evapotranspiración potencial (ETP) de la zona litoral de Lima.',
      'Considerar el uso de mulching para reducir la evaporación superficial del suelo.',
      'Instalar sensores de humedad en profundidad (30 cm, 60 cm) para monitoreo en tiempo real.',
    ],
  },
  {
    icon: Satellite,
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#ddd6fe',
    title: 'Seguimiento con índices satelitales',
    items: [
      'Monitorear el NDVI actual (0.62) durante el ciclo del cultivo para detectar estrés hídrico o deficiencias nutricionales tempranamente.',
      'Utilizar imágenes Sentinel-2 (resolución 10 m) cada 5 días para actualizar el estado de la parcela.',
      'Aplicar análisis de índice NDWI para estimar el contenido de agua en la biomasa vegetal.',
      'Comparar el NDVI al inicio y final del ciclo para evaluar el desarrollo del cultivo.',
    ],
  },
  {
    icon: AlertTriangle,
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    title: 'Consideraciones antes de siembra',
    items: [
      'Realizar análisis de suelo completo (textura, CE, materia orgánica, macro y micronutrientes) antes de la primera siembra.',
      'Seleccionar variedades de camote tolerantes a suelos ligeramente alcalinos (Jonathan, Jewel, Beauregard).',
      'Verificar la disponibilidad de agua de riego para cubrir el ciclo completo del cultivo (90-150 días).',
      'Planificar la fecha de siembra considerando el período libre de heladas y temperaturas mínimas nocturnas en Lima.',
    ],
  },
];

export const recommendationSources = [
  { name: 'INIA Perú', desc: 'Manejo agronómico del camote (Ipomoea batatas)', color: '#16a34a', bg: '#f0fdf4' },
  { name: 'FAO', desc: 'Crop Water Requirements — Ipomoea batatas', color: '#0891b2', bg: '#ecfeff' },
  { name: 'Rulebook Camote v1.2', desc: 'Criterios y pesos MCDA para camote · AgroViabilidad DSS', color: '#7c3aed', bg: '#faf5ff' },
  { name: 'SENAMHI Lima', desc: 'Datos climáticos históricos región costera Lima', color: '#d97706', bg: '#fffbeb' },
];
