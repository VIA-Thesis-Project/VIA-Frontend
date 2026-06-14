import { BookOpen, CheckCircle2, Database, FileText, Settings } from 'lucide-react';

export const rulebooks = [
  { cultivo: 'ðŸ  Camote', version: 'v1.2', criterios: 7, estado: 'Activo', estadoColor: '#16a34a', estadoBg: '#dcfce7', updated: '01 jun 2025' },
  { cultivo: 'ðŸŒ½ MaÃ­z', version: 'v2.0', criterios: 8, estado: 'Activo', estadoColor: '#16a34a', estadoBg: '#dcfce7', updated: '15 may 2025' },
  { cultivo: 'ðŸ… Tomate', version: 'v1.5', criterios: 9, estado: 'Activo', estadoColor: '#16a34a', estadoBg: '#dcfce7', updated: '10 may 2025' },
  { cultivo: 'ðŸ¥” Papa', version: 'v1.1', criterios: 7, estado: 'En revisiÃ³n', estadoColor: '#d97706', estadoBg: '#fef3c7', updated: '28 abr 2025' },
  { cultivo: 'ðŸ« ArÃ¡ndano', version: 'v0.9', criterios: 6, estado: 'Borrador', estadoColor: '#7c3aed', estadoBg: '#ede9fe', updated: '20 abr 2025' },
  { cultivo: 'ðŸ¥‘ Palta', version: 'v1.0', criterios: 8, estado: 'Activo', estadoColor: '#16a34a', estadoBg: '#dcfce7', updated: '05 jun 2025' },
];

export const ragDocs = [
  { name: 'Manejo agronÃ³mico del camote (Ipomoea batatas)', source: 'INIA PerÃº', estado: 'Indexado', estadoColor: '#16a34a', estadoBg: '#dcfce7', fragmentos: 124, updated: '01 jun 2025' },
  { name: 'Crop Water Requirements â€“ Vegetables', source: 'FAO', estado: 'Indexado', estadoColor: '#16a34a', estadoBg: '#dcfce7', fragmentos: 88, updated: '28 may 2025' },
  { name: 'BoletÃ­n climÃ¡tico Lima costera 2024', source: 'SENAMHI', estado: 'Indexado', estadoColor: '#16a34a', estadoBg: '#dcfce7', fragmentos: 56, updated: '20 may 2025' },
  { name: 'GuÃ­a de fertilizaciÃ³n para suelos alcalinos', source: 'INIA PerÃº', estado: 'Procesando', estadoColor: '#d97706', estadoBg: '#fef3c7', fragmentos: 0, updated: '08 jun 2025' },
  { name: 'Potato crop management guidelines', source: 'CIP Lima', estado: 'Indexado', estadoColor: '#16a34a', estadoBg: '#dcfce7', fragmentos: 97, updated: '15 may 2025' },
  { name: 'Ãndices espectrales para monitoreo agrÃ­cola', source: 'USGS/NASA', estado: 'Error', estadoColor: '#dc2626', estadoBg: '#fee2e2', fragmentos: 0, updated: '05 jun 2025' },
];

export const adminNav = [
  { id: 'rulebooks', icon: BookOpen, label: 'Rulebooks', count: 6 },
  { id: 'docs', icon: FileText, label: 'Documentos RAG', count: 6 },
  { id: 'validations', icon: CheckCircle2, label: 'Validaciones', count: 3 },
  { id: 'settings', icon: Settings, label: 'ConfiguraciÃ³n', count: null },
];

export const adminStats = [
  { icon: BookOpen, label: 'Rulebooks activos', value: '4', sub: '2 en revisiÃ³n', color: '#16a34a', bg: '#f0fdf4', iconBg: '#dcfce7' },
  { icon: FileText, label: 'Documentos indexados', value: '4', sub: '1 procesando, 1 error', color: '#0891b2', bg: '#ecfeff', iconBg: '#cffafe' },
  { icon: Database, label: 'Fragmentos RAG', value: '365', sub: 'Listos para recuperaciÃ³n', color: '#7c3aed', bg: '#faf5ff', iconBg: '#ede9fe' },
  { icon: CheckCircle2, label: 'Validaciones pendientes', value: '3', sub: 'Por experto agrÃ³nomo', color: '#d97706', bg: '#fffbeb', iconBg: '#fef3c7' },
];
