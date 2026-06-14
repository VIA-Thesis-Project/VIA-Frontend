import { useState, useEffect } from 'react';
import { CheckCircle2, Loader2, Circle, ChevronRight, FlaskConical, Droplets, Mountain, Satellite, Thermometer, CloudRain, Layers } from 'lucide-react';
import Sidebar from './Sidebar';
import { NavigateFn } from '../App';

interface Props { navigate: NavigateFn; }

const steps = [
  { id: 1, label: 'Validando geometría de la parcela', sub: 'Verificando polígono y cobertura espacial' },
  { id: 2, label: 'Consultando datos agroambientales', sub: 'Google Earth Engine · SENAMHI · INIA' },
  { id: 3, label: 'Calculando variables por parcela', sub: 'Interpolación espacial y agregación estadística' },
  { id: 4, label: 'Ejecutando MCDA difuso / Fuzzy AHP', sub: 'Evaluando criterios con funciones de membresía' },
  { id: 5, label: 'Generando recomendaciones (LLM/RAG)', sub: 'Recuperando documentos técnicos relevantes' },
];

const variables = [
  { icon: FlaskConical, label: 'pH del suelo', value: '7.8', unit: '', status: 'Tolerable', statusColor: '#d97706', statusBg: '#fef3c7', color: '#d97706', bg: '#fffbeb', detail: 'Ligeramente alcalino' },
  { icon: Mountain, label: 'Pendiente', value: '4.2', unit: '%', status: 'Óptimo', statusColor: '#16a34a', statusBg: '#dcfce7', color: '#78716c', bg: '#fafaf9', detail: 'Terreno suave' },
  { icon: Droplets, label: 'Humedad estimada', value: '18', unit: '%', status: 'Tolerable', statusColor: '#d97706', statusBg: '#fef3c7', color: '#0891b2', bg: '#ecfeff', detail: 'Déficit moderado' },
  { icon: Satellite, label: 'NDVI', value: '0.62', unit: '', status: 'Óptimo', statusColor: '#16a34a', statusBg: '#dcfce7', color: '#16a34a', bg: '#f0fdf4', detail: 'Vegetación activa' },
  { icon: Thermometer, label: 'Temperatura media', value: '21.4', unit: '°C', status: 'Óptimo', statusColor: '#16a34a', statusBg: '#dcfce7', color: '#dc2626', bg: '#fff1f2', detail: 'Rango adecuado' },
  { icon: CloudRain, label: 'Precipitación est.', value: '35', unit: 'mm', status: 'Tolerable', statusColor: '#d97706', statusBg: '#fef3c7', color: '#0891b2', bg: '#ecfeff', detail: 'Requiere riego suplementario' },
  { icon: Layers, label: 'Textura del suelo', value: 'Franco', unit: 'arenosa', status: 'Óptimo', statusColor: '#16a34a', statusBg: '#dcfce7', color: '#92400e', bg: '#fef3c7', detail: 'Drenaje adecuado' },
];

export default function Processing({ navigate }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          clearInterval(timer);
          setTimeout(() => setDone(true), 600);
          return prev;
        }
        return prev + 1;
      });
    }, 900);
    return () => clearInterval(timer);
  }, []);

  const progress = done ? 100 : Math.round((currentStep / (steps.length - 1)) * 100);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="new-evaluation" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, padding: '32px', minWidth: 0 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }} onClick={() => navigate('dashboard')}>Dashboard</div>
            <span style={{ color: '#e2e8f0' }}>/</span>
            <div style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }} onClick={() => navigate('new-evaluation')}>Nueva evaluación</div>
            <span style={{ color: '#e2e8f0' }}>/</span>
            <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Procesamiento</div>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Procesamiento de variables agroambientales</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Parcela: <strong style={{ color: '#0f172a' }}>Fundo Loreto - Lote A</strong> · Lurín, Lima · 2.4 ha</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
          {/* Left: steps */}
          <div>
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Progreso del análisis</div>

              {/* Progress bar */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Progreso general</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>{progress}%</span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #16a34a, #0891b2)', borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
              </div>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {steps.map((step, i) => {
                  const completed = done || i < currentStep;
                  const active = !done && i === currentStep;
                  const pending = !done && i > currentStep;
                  return (
                    <div key={step.id} style={{ display: 'flex', gap: 14, paddingBottom: i < steps.length - 1 ? 0 : 0 }}>
                      {/* Icon + connector */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: completed ? '#f0fdf4' : active ? '#ecfeff' : '#f8fafc',
                          border: `2px solid ${completed ? '#16a34a' : active ? '#0891b2' : '#e2e8f0'}`,
                        }}>
                          {completed ? (
                            <CheckCircle2 style={{ width: 16, height: 16, color: '#16a34a' }} />
                          ) : active ? (
                            <Loader2 style={{ width: 16, height: 16, color: '#0891b2', animation: 'spin 1s linear infinite' }} />
                          ) : (
                            <Circle style={{ width: 16, height: 16, color: '#cbd5e1' }} />
                          )}
                        </div>
                        {i < steps.length - 1 && (
                          <div style={{ width: 2, height: 32, background: completed ? '#bbf7d0' : '#f1f5f9', margin: '3px 0' }} />
                        )}
                      </div>
                      {/* Content */}
                      <div style={{ paddingBottom: i < steps.length - 1 ? 16 : 0, paddingTop: 5 }}>
                        <div style={{ fontSize: 13.5, fontWeight: completed || active ? 600 : 400, color: completed ? '#15803d' : active ? '#0891b2' : '#94a3b8' }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{step.sub}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Data sources */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #f1f5f9', padding: '16px 20px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Fuentes de datos</div>
              {[
                { name: 'Google Earth Engine', desc: 'NDVI, topografía, textura', dot: '#16a34a' },
                { name: 'SENAMHI', desc: 'Temperatura, precipitación', dot: '#0891b2' },
                { name: 'INIA Perú', desc: 'Parámetros de suelo (pH, salinidad)', dot: '#d97706' },
                { name: 'SIG Lima Metropolitana', desc: 'Límites distritales, parcelas', dot: '#7c3aed' },
              ].map(({ name, desc, dot }) => (
                <div key={name} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>{name}</div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: variable cards */}
          <div>
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Variables agroambientales obtenidas</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[
                    { label: 'Óptimo', color: '#16a34a', bg: '#f0fdf4' },
                    { label: 'Tolerable', color: '#d97706', bg: '#fef3c7' },
                    { label: 'Limitante', color: '#dc2626', bg: '#fee2e2' },
                  ].map(({ label, color, bg }) => (
                    <div key={label} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: bg, color }}>{label}</div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {variables.map(({ icon: Icon, label, value, unit, status, statusColor, statusBg, color, bg, detail }) => (
                  <div key={label} style={{ background: '#fafafa', borderRadius: 12, padding: 16, border: '1px solid #f1f5f9', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: statusColor === '#16a34a' ? 'linear-gradient(90deg, #16a34a, #22c55e)' : statusColor === '#d97706' ? 'linear-gradient(90deg, #d97706, #f59e0b)' : 'linear-gradient(90deg, #dc2626, #ef4444)' }} />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon style={{ width: 18, height: 18, color }} />
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 12, background: statusBg, color: statusColor }}>{status}</div>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                      <span style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>{value}</span>
                      <span style={{ fontSize: 13, color: '#64748b' }}>{unit}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>{detail}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary card */}
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfeff)', borderRadius: 14, border: '1px solid #bbf7d0', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                  {done ? '✅ Análisis completado' : '⏳ Procesando análisis MCDA difuso...'}
                </div>
                <div style={{ fontSize: 13.5, color: '#475569' }}>
                  {done
                    ? '7 variables procesadas · Fuzzy AHP ejecutado · Recomendaciones listas'
                    : `Paso ${currentStep + 1} de ${steps.length} en ejecución`}
                </div>
              </div>
              {done && (
                <button
                  onClick={() => navigate('results')}
                  style={{ background: '#16a34a', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
                >
                  Ver resultados <ChevronRight style={{ width: 16, height: 16 }} />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
