import { ChevronRight, ArrowLeft, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { chartData, criteriaCards, gapData } from '@/features/evaluations/infrastructure/mock/cropDetailData';
import Sidebar from '@/shared/presentation/layouts/Sidebar';
import { NavigateFn } from '@/app/navigation/navigation';

interface Props { navigate: NavigateFn; }


function MembershipChart() {
  const w = 280, h = 100;
  const trapPoints = `60,${h - 10} 90,15 150,15 200,${h - 10}`;
  const obsX = 120;
  const obsY = 15;
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 8 }}>
        Función de membresía difusa — pH del suelo
      </div>
      <svg width={w} height={h + 10} style={{ display: 'block' }}>
        {/* Axis */}
        <line x1={20} y1={h - 10} x2={w - 10} y2={h - 10} stroke="#e2e8f0" strokeWidth={1.5} />
        <line x1={20} y1={10} x2={20} y2={h - 10} stroke="#e2e8f0" strokeWidth={1.5} />
        {/* X labels */}
        {['4', '5.5', '7.8', '8.0', '9'].map((label, i) => (
          <text key={label} x={40 + i * 54} y={h + 8} fontSize={9} fill="#94a3b8" textAnchor="middle">{label}</text>
        ))}
        {/* Y labels */}
        <text x={15} y={15} fontSize={9} fill="#94a3b8" textAnchor="end">1.0</text>
        <text x={15} y={h - 10} fontSize={9} fill="#94a3b8" textAnchor="end">0</text>
        {/* Trapezoid membership function */}
        <polygon points={trapPoints} fill="#16a34a" fillOpacity={0.15} stroke="none" />
        <polyline points={`20,${h - 10} 60,${h - 10} 90,15 150,15 200,${h - 10} ${w - 10},${h - 10}`} fill="none" stroke="#16a34a" strokeWidth={2} />
        {/* Observed value line */}
        <line x1={obsX} y1={10} x2={obsX} y2={h - 10} stroke="#d97706" strokeWidth={1.5} strokeDasharray="4,3" />
        <circle cx={obsX} cy={obsY + 8} r={4} fill="#d97706" />
        <rect x={obsX - 18} y={10} width={36} height={16} rx={4} fill="#d97706" fillOpacity={0.15} />
        <text x={obsX} y={22} fontSize={9} fill="#d97706" textAnchor="middle" fontWeight="700">pH 7.8</text>
        {/* Membership label */}
        <rect x={obsX + 6} y={obsY + 2} width={48} height={14} rx={4} fill="white" stroke="#e2e8f0" />
        <text x={obsX + 30} y={obsY + 12} fontSize={9} fill="#16a34a" textAnchor="middle" fontWeight="700">μ = 0.82</text>
      </svg>
      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
        Función trapezoidal · pH óptimo: 5.5 – 8.0 · Membresía observada: 0.82
      </div>
    </div>
  );
}

export default function CropDetail({ navigate }: Props) {
  const overallScore = 86;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="results" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <button onClick={() => navigate('results')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8', fontSize: 12 }}>
            <ArrowLeft style={{ width: 13, height: 13 }} /> Resultados
          </button>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Detalle de cultivo — Camote</span>
        </div>

        {/* Score hero */}
        <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfeff)', borderRadius: 18, border: '1px solid #bbf7d0', padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'white', border: '4px solid #16a34a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(22,163,74,0.2)', flexShrink: 0 }}>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#16a34a', lineHeight: 1 }}>{overallScore}%</span>
            <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>score</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 26 }}>🍠</span>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Camote</h1>
              <div style={{ background: '#dcfce7', color: '#16a34a', fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, border: '1px solid #bbf7d0' }}>Viabilidad alta</div>
            </div>
            <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.6, maxWidth: 640 }}>
              El cultivo obtiene <strong style={{ color: '#15803d' }}>alta viabilidad</strong> porque la pendiente, NDVI y temperatura se encuentran en rangos adecuados. La humedad presenta una brecha moderada que puede ser gestionada con riego suplementario.
            </p>
          </div>
          <button
            onClick={() => navigate('recommendations')}
            style={{ background: '#16a34a', color: 'white', border: 'none', padding: '12px 22px', borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
          >
            Ver recomendación <ChevronRight style={{ width: 15, height: 15 }} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>
          {/* Criteria cards */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Score por criterio (membresía difusa μ)</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 0 }}>
              {criteriaCards.map(({ label, value, observed, optimal, status, color, bg, iconBg, detail }) => (
                <div key={label} style={{ background: '#fafafa', borderRadius: 12, padding: 16, border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 10, background: bg, color, border: `1px solid ${iconBg}` }}>{status}</div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <span style={{ fontSize: 28, fontWeight: 900, color }}>{value.toFixed(2)}</span>
                    <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>μ</span>
                  </div>
                  <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3, marginBottom: 10 }}>
                    <div style={{ width: `${value * 100}%`, height: '100%', background: color, borderRadius: 3 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Observado</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{observed}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Óptimo</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{optimal}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, lineHeight: 1.4 }}>{detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: chart + membership */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 20px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Membresía por criterio</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>Score μ ∈ [0, 1] — Fuzzy AHP</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 10 }}>
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11.5, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Score μ']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 20px' }}>
              <MembershipChart />
            </div>

            <div style={{ background: '#f0fdf4', borderRadius: 14, border: '1px solid #bbf7d0', padding: '14px 16px', display: 'flex', gap: 10 }}>
              <Info style={{ width: 15, height: 15, color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.6 }}>
                El score final de <strong>86%</strong> resulta de aplicar pesos AHP a los scores de membresía difusa de cada criterio. Los pesos se calibran con expertos agrónomos según el cultivo evaluado.
              </div>
            </div>
          </div>
        </div>

        {/* Gap table */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Tabla de brechas agronómicas</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Comparación entre valores observados y rangos óptimos para Camote</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Criterio', 'Valor observado', 'Rango óptimo', 'Nivel de impacto', 'Comentario agronómico'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {gapData.map((row, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{row.criterio}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>{row.observado}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>{row.optimo}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ background: row.bg, color: row.color, fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20, display: 'inline-block' }}>{row.impacto}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12.5, color: '#64748b', maxWidth: 260 }}>{row.comentario}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
