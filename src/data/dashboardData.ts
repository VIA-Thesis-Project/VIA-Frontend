import { FileText, MapPin, Sprout, TrendingUp } from 'lucide-react';

export const areaData = [
  { m: 'Ene', v: 2 }, { m: 'Feb', v: 3 }, { m: 'Mar', v: 2 }, { m: 'Abr', v: 5 },
  { m: 'May', v: 4 }, { m: 'Jun', v: 7 }, { m: 'Jul', v: 6 }, { m: 'Ago', v: 8 },
];

export const recentEvals = [
  { parcela: 'Parcela Fundo Loreto - Lote A', fecha: '08 jun 2025', cultivo: 'Camote', score: 86, estado: 'Completado', estColor: '#16a34a', estBg: '#f0fdf4' },
  { parcela: 'Parcela Cañete 01', fecha: '05 jun 2025', cultivo: 'Maíz', score: 78, estado: 'Completado', estColor: '#0891b2', estBg: '#ecfeff' },
  { parcela: 'Parcela Huaral Norte', fecha: '01 jun 2025', cultivo: 'Tomate', score: 64, estado: 'Completado', estColor: '#d97706', estBg: '#fffbeb' },
  { parcela: 'Parcela Santa Rosa B2', fecha: '28 may 2025', cultivo: 'Papa', score: 51, estado: 'En revisión', estColor: '#7c3aed', estBg: '#faf5ff' },
  { parcela: 'Parcela Chilca Sur', fecha: '20 may 2025', cultivo: 'Arándano', score: 39, estado: 'Completado', estColor: '#64748b', estBg: '#f8fafc' },
];

export const alerts = [
  { label: 'Salinidad alta', count: 3, color: '#dc2626', bg: '#fee2e2', icon: '⚠️' },
  { label: 'pH fuera de rango', count: 2, color: '#d97706', bg: '#fef3c7', icon: '🧪' },
  { label: 'Humedad baja', count: 4, color: '#0891b2', bg: '#ecfeff', icon: '💧' },
  { label: 'Pendiente elevada', count: 1, color: '#7c3aed', bg: '#faf5ff', icon: '⛰️' },
];

export const dashboardStats = [
  { icon: MapPin, label: 'Parcelas evaluadas', value: '12', trend: '+2 este mes', color: '#16a34a', bg: '#f0fdf4', iconBg: '#dcfce7' },
  { icon: TrendingUp, label: 'Evaluaciones realizadas', value: '28', trend: '+5 este mes', color: '#0891b2', bg: '#ecfeff', iconBg: '#cffafe' },
  { icon: Sprout, label: 'Cultivos priorizados', value: '47', trend: 'Top: Camote', color: '#d97706', bg: '#fffbeb', iconBg: '#fef3c7' },
  { icon: FileText, label: 'Recomendaciones gen.', value: '23', trend: 'con trazabilidad RAG', color: '#7c3aed', bg: '#faf5ff', iconBg: '#ede9fe' },
];
