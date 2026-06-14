import { Download, ChevronRight, Eye, Sprout, TrendingUp, AlertTriangle } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { crops, radarData } from '../data/resultsData';
import Sidebar from '../layouts/Sidebar';
import { NavigateFn } from '../types/navigation';

interface Props { navigate: NavigateFn; }


function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 16, fontWeight: 800, color, minWidth: 40 }}>{score}%</span>
    </div>
  );
}

export default function Results({ navigate }: Props) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="results" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }} onClick={() => navigate('dashboard')}>Dashboard</div>
            <span style={{ color: '#e2e8f0' }}>/</span>
            <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Resultados de viabilidad</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: 6 }}>Resultados de viabilidad de cultivos</h1>
              <div style={{ display: 'flex', gap: 16 }}>
                {[
                  { label: 'Parcela', value: 'Fundo Loreto - Lote A' },
                  { label: 'Área', value: '2.4 ha' },
                  { label: 'Ubicación', value: 'Lurín, Lima' },
                  { label: 'Evaluado', value: '08 jun 2025' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: 6 }}>
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}:</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => navigate('report')}
                style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '9px 16px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
              >
                <Download style={{ width: 14, height: 14 }} />
                Exportar PDF
              </button>
              <button
                onClick={() => navigate('recommendations')}
                style={{ background: '#16a34a', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
              >
                <Sprout style={{ width: 14, height: 14 }} />
                Generar recomendaciones
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
          {/* Ranking */}
          <div>
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp style={{ width: 16, height: 16, color: '#16a34a' }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Ranking de cultivos viables</div>
                <div style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>Ordenados por score MCDA difuso</div>
              </div>

              <div>
                {crops.map((crop, i) => (
                  <div key={crop.name} style={{ padding: '18px 24px', borderBottom: i < crops.length - 1 ? '1px solid #f8fafc' : 'none', display: 'flex', gap: 16 }}>
                    {/* Rank */}
                    <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4, background: i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : '#f8fafc', border: `1.5px solid ${i === 0 ? '#fbbf24' : i === 1 ? '#cbd5e1' : '#e2e8f0'}` }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: i === 0 ? '#d97706' : i === 1 ? '#64748b' : '#94a3b8' }}>#{i + 1}</span>
                    </div>

                    {/* Main content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 20 }}>{crop.emoji}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{crop.name}</span>
                        <div style={{ fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: crop.catBg, color: crop.catColor, border: `1px solid ${crop.catBorder}` }}>
                          {crop.category}
                        </div>
                      </div>

                      <ScoreBar score={crop.score} color={crop.catColor} />

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>✓ Factores positivos</div>
                          {crop.positives.map(p => (
                            <div key={p} style={{ fontSize: 12, color: '#475569', marginBottom: 2, display: 'flex', gap: 5 }}>
                              <span style={{ color: '#16a34a', flexShrink: 0 }}>·</span> {p}
                            </div>
                          ))}
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#d97706', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>⚠ Factores limitantes</div>
                          {crop.limitants.map(l => (
                            <div key={l} style={{ fontSize: 12, color: '#475569', marginBottom: 2, display: 'flex', gap: 5 }}>
                              <span style={{ color: '#d97706', flexShrink: 0 }}>·</span> {l}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, justifyContent: 'center' }}>
                      <button
                        onClick={() => navigate('crop-detail')}
                        style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#475569', padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Eye style={{ width: 13, height: 13 }} />
                        Ver detalle
                      </button>
                      {i === 0 && (
                        <button
                          onClick={() => navigate('recommendations')}
                          style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', color: '#15803d', padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                        >
                          <Sprout style={{ width: 13, height: 13 }} />
                          Recomendar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Radar chart */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '20px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Comparación por criterio (Top 3)</div>
              <div style={{ fontSize: 11.5, color: '#94a3b8', marginBottom: 12 }}>Score de membresía difusa por dimensión</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="criterio" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Radar name="Camote" dataKey="Camote" stroke="#16a34a" fill="#16a34a" fillOpacity={0.15} strokeWidth={2} />
                  <Radar name="Maíz" dataKey="Maíz" stroke="#0891b2" fill="#0891b2" fillOpacity={0.1} strokeWidth={2} />
                  <Radar name="Tomate" dataKey="Tomate" stroke="#d97706" fill="#d97706" fillOpacity={0.1} strokeWidth={1.5} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Score summary */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '20px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Resumen de scores</div>
              {crops.map(crop => (
                <div key={crop.name} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontSize: 14 }}>{crop.emoji}</span>
                  <span style={{ fontSize: 13, color: '#475569', minWidth: 64, fontWeight: 500 }}>{crop.name}</span>
                  <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                    <div style={{ width: `${crop.score}%`, height: '100%', background: crop.catColor, borderRadius: 3, opacity: 0.85 }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: crop.catColor, minWidth: 36, textAlign: 'right' }}>{crop.score}%</span>
                </div>
              ))}
            </div>

            {/* Limiting factors alert */}
            <div style={{ background: '#fffbeb', borderRadius: 14, border: '1px solid #fde68a', padding: '16px 18px' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <AlertTriangle style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#92400e' }}>Factores limitantes principales</div>
              </div>
              {['Humedad de suelo (18%) por debajo del umbral óptimo para la mayoría de cultivos.', 'pH 7.8 excluye cultivos que requieren suelo ácido (arándano, frutillas).', 'Precipitación baja (35 mm) requiere manejo hídrico suplementario.'].map((f, i) => (
                <div key={i} style={{ fontSize: 12, color: '#78350f', marginBottom: 6, display: 'flex', gap: 6 }}>
                  <span style={{ color: '#d97706', flexShrink: 0, fontWeight: 700 }}>·</span> {f}
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate('recommendations')}
              style={{ background: 'linear-gradient(135deg, #15803d, #0891b2)', color: 'white', border: 'none', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              Generar recomendaciones para Camote
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
