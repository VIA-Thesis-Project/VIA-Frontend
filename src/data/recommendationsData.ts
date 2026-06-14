import { AlertTriangle, Droplets, Satellite, Sprout } from 'lucide-react';

export const recommendationBlocks = [
  {
    icon: Sprout,
    color: '#16a34a',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    title: 'Manejo del suelo',
    items: [
      'Aplicar enmiendas de materia orgÃ¡nica (compost) para mejorar la capacidad de retenciÃ³n hÃ­drica del suelo franco-arenoso.',
      'Monitorear el pH periÃ³dicamente. Si supera 8.0, considerar la aplicaciÃ³n de azufre elemental o fertilizantes acidificantes.',
      'Realizar labranza conservacionista para preservar la estructura del suelo y reducir la compactaciÃ³n.',
      'Evaluar la conductividad elÃ©ctrica (CE) para descartar acumulaciÃ³n salina antes de la siembra.',
    ],
  },
  {
    icon: Droplets,
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
    title: 'Manejo hÃ­drico',
    items: [
      'Implementar riego por goteo o riego por surcos para compensar la humedad observada (18%) respecto al umbral Ã³ptimo (25-40%).',
      'Programar riegos en funciÃ³n de la evapotranspiraciÃ³n potencial (ETP) de la zona litoral de Lima.',
      'Considerar el uso de mulching para reducir la evaporaciÃ³n superficial del suelo.',
      'Instalar sensores de humedad en profundidad (30 cm, 60 cm) para monitoreo en tiempo real.',
    ],
  },
  {
    icon: Satellite,
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#ddd6fe',
    title: 'Seguimiento con Ã­ndices satelitales',
    items: [
      'Monitorear el NDVI actual (0.62) durante el ciclo del cultivo para detectar estrÃ©s hÃ­drico o deficiencias nutricionales tempranamente.',
      'Utilizar imÃ¡genes Sentinel-2 (resoluciÃ³n 10 m) cada 5 dÃ­as para actualizar el estado de la parcela.',
      'Aplicar anÃ¡lisis de Ã­ndice NDWI para estimar el contenido de agua en la biomasa vegetal.',
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
      'Realizar anÃ¡lisis de suelo completo (textura, CE, materia orgÃ¡nica, macro y micronutrientes) antes de la primera siembra.',
      'Seleccionar variedades de camote tolerantes a suelos ligeramente alcalinos (Jonathan, Jewel, Beauregard).',
      'Verificar la disponibilidad de agua de riego para cubrir el ciclo completo del cultivo (90-150 dÃ­as).',
      'Planificar la fecha de siembra considerando el perÃ­odo libre de heladas y temperaturas mÃ­nimas nocturnas en Lima.',
    ],
  },
];

export const recommendationSources = [
  { name: 'INIA PerÃº', desc: 'Manejo agronÃ³mico del camote (Ipomoea batatas)', color: '#16a34a', bg: '#f0fdf4' },
  { name: 'FAO', desc: 'Crop Water Requirements â€” Ipomoea batatas', color: '#0891b2', bg: '#ecfeff' },
  { name: 'Rulebook Camote v1.2', desc: 'Criterios y pesos MCDA para camote Â· AgroViabilidad DSS', color: '#7c3aed', bg: '#faf5ff' },
  { name: 'SENAMHI Lima', desc: 'Datos climÃ¡ticos histÃ³ricos regiÃ³n costera Lima', color: '#d97706', bg: '#fffbeb' },
];
