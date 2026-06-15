export const criteriaCards = [
  { label: 'pH del suelo', value: 0.82, observed: '7.8', optimal: '5.5 – 8.0', status: 'Tolerable', color: '#d97706', bg: '#fffbeb', iconBg: '#fef3c7', detail: 'Dentro del rango tolerable para camote. Cercano al límite superior.' },
  { label: 'Pendiente', value: 0.91, observed: '4.2 %', optimal: '0 – 8 %', status: 'Óptimo', color: '#16a34a', bg: '#f0fdf4', iconBg: '#dcfce7', detail: 'Pendiente muy favorable para maquinaria y drenaje.' },
  { label: 'Humedad', value: 0.76, observed: '18 %', optimal: '25 – 40 %', status: 'Tolerable', color: '#d97706', bg: '#fffbeb', iconBg: '#fef3c7', detail: 'Por debajo del rango ideal. Recomendable riego suplementario.' },
  { label: 'NDVI', value: 0.88, observed: '0.62', optimal: '0.50 – 0.80', status: 'Óptimo', color: '#16a34a', bg: '#f0fdf4', iconBg: '#dcfce7', detail: 'Actividad vegetal alta, indica buena cobertura del suelo.' },
  { label: 'Temperatura', value: 0.84, observed: '21.4 °C', optimal: '18 – 25 °C', status: 'Óptimo', color: '#16a34a', bg: '#f0fdf4', iconBg: '#dcfce7', detail: 'Temperatura media dentro del rango óptimo para camote.' },
];

export const chartData = criteriaCards.map(c => ({
  name: c.label.split(' ')[0],
  value: Math.round(c.value * 100),
  color: c.color,
}));

export const gapData = [
  { criterio: 'pH del suelo', observado: '7.8', optimo: '5.5 – 8.0', impacto: 'Moderado', comentario: 'Ligeramente alcalino; monitorear salinidad', color: '#d97706', bg: '#fef3c7' },
  { criterio: 'Pendiente', observado: '4.2 %', optimo: '0 – 8 %', impacto: 'Mínimo', comentario: 'No hay brecha. Condición muy favorable.', color: '#16a34a', bg: '#dcfce7' },
  { criterio: 'Humedad', observado: '18 %', optimo: '25 – 40 %', impacto: 'Moderado', comentario: 'Brecha de 7%. Riego suplementario recomendado.', color: '#d97706', bg: '#fef3c7' },
  { criterio: 'NDVI', observado: '0.62', optimo: '0.50 – 0.80', impacto: 'Mínimo', comentario: 'Dentro del rango óptimo. Sin brecha.', color: '#16a34a', bg: '#dcfce7' },
  { criterio: 'Temperatura', observado: '21.4 °C', optimo: '18 – 25 °C', impacto: 'Mínimo', comentario: 'Temperatura adecuada para el ciclo del cultivo.', color: '#16a34a', bg: '#dcfce7' },
  { criterio: 'Precipitación', observado: '35 mm', optimo: '60 – 100 mm', impacto: 'Alto', comentario: 'Brecha significativa. Requiere sistema de riego.', color: '#dc2626', bg: '#fee2e2' },
];
