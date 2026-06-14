export const criteriaCards = [
  { label: 'pH del suelo', value: 0.82, observed: '7.8', optimal: '5.5 â€“ 8.0', status: 'Tolerable', color: '#d97706', bg: '#fffbeb', iconBg: '#fef3c7', detail: 'Dentro del rango tolerable para camote. Cercano al lÃ­mite superior.' },
  { label: 'Pendiente', value: 0.91, observed: '4.2 %', optimal: '0 â€“ 8 %', status: 'Ã“ptimo', color: '#16a34a', bg: '#f0fdf4', iconBg: '#dcfce7', detail: 'Pendiente muy favorable para maquinaria y drenaje.' },
  { label: 'Humedad', value: 0.76, observed: '18 %', optimal: '25 â€“ 40 %', status: 'Tolerable', color: '#d97706', bg: '#fffbeb', iconBg: '#fef3c7', detail: 'Por debajo del rango ideal. Recomendable riego suplementario.' },
  { label: 'NDVI', value: 0.88, observed: '0.62', optimal: '0.50 â€“ 0.80', status: 'Ã“ptimo', color: '#16a34a', bg: '#f0fdf4', iconBg: '#dcfce7', detail: 'Actividad vegetal alta, indica buena cobertura del suelo.' },
  { label: 'Temperatura', value: 0.84, observed: '21.4 Â°C', optimal: '18 â€“ 25 Â°C', status: 'Ã“ptimo', color: '#16a34a', bg: '#f0fdf4', iconBg: '#dcfce7', detail: 'Temperatura media dentro del rango Ã³ptimo para camote.' },
];

export const chartData = criteriaCards.map(c => ({
  name: c.label.split(' ')[0],
  value: Math.round(c.value * 100),
  color: c.color,
}));

export const gapData = [
  { criterio: 'pH del suelo', observado: '7.8', optimo: '5.5 â€“ 8.0', impacto: 'Moderado', comentario: 'Ligeramente alcalino; monitorear salinidad', color: '#d97706', bg: '#fef3c7' },
  { criterio: 'Pendiente', observado: '4.2 %', optimo: '0 â€“ 8 %', impacto: 'MÃ­nimo', comentario: 'No hay brecha. CondiciÃ³n muy favorable.', color: '#16a34a', bg: '#dcfce7' },
  { criterio: 'Humedad', observado: '18 %', optimo: '25 â€“ 40 %', impacto: 'Moderado', comentario: 'Brecha de 7%. Riego suplementario recomendado.', color: '#d97706', bg: '#fef3c7' },
  { criterio: 'NDVI', observado: '0.62', optimo: '0.50 â€“ 0.80', impacto: 'MÃ­nimo', comentario: 'Dentro del rango Ã³ptimo. Sin brecha.', color: '#16a34a', bg: '#dcfce7' },
  { criterio: 'Temperatura', observado: '21.4 Â°C', optimo: '18 â€“ 25 Â°C', impacto: 'MÃ­nimo', comentario: 'Temperatura adecuada para el ciclo del cultivo.', color: '#16a34a', bg: '#dcfce7' },
  { criterio: 'PrecipitaciÃ³n', observado: '35 mm', optimo: '60 â€“ 100 mm', impacto: 'Alto', comentario: 'Brecha significativa. Requiere sistema de riego.', color: '#dc2626', bg: '#fee2e2' },
];
