import { Plus, MapPin, TrendingUp, Sprout, FileText, AlertTriangle, ChevronRight, Eye, Download, Map } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import Sidebar from './Sidebar';
import { NavigateFn } from '../App';

interface Props { navigate: NavigateFn; }

const areaData = [
  { m: 'Ene', v: 2 }, { m: 'Feb', v: 3 }, { m: 'Mar', v: 2 }, { m: 'Abr', v: 5 },
  { m: 'May', v: 4 }, { m: 'Jun', v: 7 }, { m: 'Jul', v: 6 }, { m: 'Ago', v: 8 },
];

const recentEvals = [
  { parcela: 'Parcela Fundo Loreto - Lote A', fecha: '08 jun 2025', cultivo: 'Camote', score: 86, estado: 'Completado', estColor: '#16a34a', estBg: '#f0fdf4' },
  { parcela: 'Parcela Cañete 01', fecha: '05 jun 2025', cultivo: 'Maíz', score: 78, estado: 'Completado', estColor: '#0891b2', estBg: '#ecfeff' },
  { parcela: 'Parcela Huaral Norte', fecha: '01 jun 2025', cultivo: 'Tomate', score: 64, estado: 'Completado', estColor: '#d97706', estBg: '#fffbeb' },
  { parcela: 'Parcela Santa Rosa B2', fecha: '28 may 2025', cultivo: 'Papa', score: 51, estado: 'En revisión', estColor: '#7c3aed', estBg: '#faf5ff' },
  { parcela: 'Parcela Chilca Sur', fecha: '20 may 2025', cultivo: 'Arándano', score: 39, estado: 'Completado', estColor: '#64748b', estBg: '#f8fafc' },
];

const alerts = [
  { label: 'Salinidad alta', count: 3, color: '#dc2626', bg: '#fee2e2', icon: '⚠️' },
  { label: 'pH fuera de rango', count: 2, color: '#d97706', bg: '#fef3c7', icon: '🧪' },
  { label: 'Humedad baja', count: 4, color: '#0891b2', bg: '#ecfeff', icon: '💧' },
  { label: 'Pendiente elevada', count: 1, color: '#7c3aed', bg: '#faf5ff', icon: '⛰️' },
];

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#16a34a' : score >= 65 ? '#0891b2' : score >= 50 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, minWidth: 60 }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color }}>{score}%</span>
    </div>
  );
}

export default function Dashboard({ navigate }: Props) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="dashboard" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: 4 }}>Dashboard</h1>
            <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>Bienvenido, Juan · Técnico agrónomo · Lima, Perú</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate('admin')}
              style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '9px 16px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
            >
              Panel técnico
            </button>
            <button
              onClick={() => navigate('new-evaluation')}
              style={{ background: '#16a34a', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <Plus style={{ width: 15, height: 15 }} />
              Nueva evaluación
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { icon: MapPin, label: 'Parcelas evaluadas', value: '12', trend: '+2 este mes', color: '#16a34a', bg: '#f0fdf4', iconBg: '#dcfce7' },
            { icon: TrendingUp, label: 'Evaluaciones realizadas', value: '28', trend: '+5 este mes', color: '#0891b2', bg: '#ecfeff', iconBg: '#cffafe' },
            { icon: Sprout, label: 'Cultivos priorizados', value: '47', trend: 'Top: Camote', color: '#d97706', bg: '#fffbeb', iconBg: '#fef3c7' },
            { icon: FileText, label: 'Recomendaciones gen.', value: '23', trend: 'con trazabilidad RAG', color: '#7c3aed', bg: '#faf5ff', iconBg: '#ede9fe' },
          ].map(({ icon: Icon, label, value, trend, color, bg, iconBg }) => (
            <div key={label} style={{ background: 'white', borderRadius: 14, padding: 20, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 20, height: 20, color }} />
                </div>
                <div style={{ fontSize: 11, color, fontWeight: 600, background: bg, padding: '3px 8px', borderRadius: 20 }}>{trend}</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Main content grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginBottom: 20 }}>
          {/* Recent evaluations table */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Últimas evaluaciones</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>5 evaluaciones recientes</div>
              </div>
              <button
                onClick={() => navigate('results')}
                style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Ver todas <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Parcela', 'Fecha', 'Cultivo priorizado', 'Score', 'Estado', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentEvals.map((ev, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f8fafc' }}
                    onMouseOver={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseOut={e => (e.currentTarget.style.background = 'white')}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{ev.parcela}</div>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin style={{ width: 10, height: 10 }} /> Lima, Perú
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748b' }}>{ev.fecha}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', color: '#15803d', padding: '4px 10px', borderRadius: 20, fontSize: 12.5, fontWeight: 600 }}>
                        🌱 {ev.cultivo}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', minWidth: 120 }}><ScoreBadge score={ev.score} /></td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ background: ev.estBg, color: ev.estColor, fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20, display: 'inline-block' }}>{ev.estado}</div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button
                        onClick={() => navigate('results')}
                        style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                      >
                        <Eye style={{ width: 12, height: 12 }} /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Mini map */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Parcelas recientes</div>
                <Map style={{ width: 15, height: 15, color: '#94a3b8' }} />
              </div>
              <div style={{ height: 160, position: 'relative', background: '#e8f0e4' }}>
                <svg width="100%" height="160" viewBox="0 0 360 160">
                  <defs><pattern id="dashGrid" width="18" height="18" patternUnits="userSpaceOnUse">
                    <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#a7c7a0" strokeWidth="0.5" opacity="0.5" />
                  </pattern></defs>
                  <rect width="360" height="160" fill="#dff0d8" />
                  <rect width="360" height="160" fill="url(#dashGrid)" />
                  <polygon points="60,30 140,20 160,75 130,100 55,90 45,55" fill="#16a34a" fillOpacity="0.3" stroke="#15803d" strokeWidth="2" />
                  <polygon points="200,40 270,35 285,80 255,100 195,90 185,65" fill="#0891b2" fillOpacity="0.3" stroke="#0891b2" strokeWidth="2" />
                  <polygon points="290,90 340,85 345,130 310,140 280,135 275,110" fill="#d97706" fillOpacity="0.25" stroke="#d97706" strokeWidth="2" />
                  <circle cx="100" cy="62" r="4" fill="#15803d" />
                  <circle cx="237" cy="65" r="4" fill="#0891b2" />
                  <circle cx="310" cy="112" r="4" fill="#d97706" />
                </svg>
                <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', gap: 6 }}>
                  {[{ l: 'Loreto A', c: '#15803d' }, { l: 'Cañete 01', c: '#0891b2' }, { l: 'Chilca', c: '#d97706' }].map(({ l, c }) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.9)', padding: '3px 7px', borderRadius: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                      <span style={{ fontSize: 10, color: '#475569', fontWeight: 500 }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Alerts panel */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle style={{ width: 15, height: 15, color: '#d97706' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Factores frecuentes</div>
              </div>
              <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {alerts.map(({ label, count, color, bg, icon }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 14 }}>{icon}</span>
                      <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{label}</span>
                    </div>
                    <div style={{ background: bg, color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>
                      {count} parcelas
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trend chart */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '16px 20px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Evaluaciones por mes</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>Ene – Ago 2025</div>
              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="evalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <Area type="monotone" dataKey="v" stroke="#16a34a" strokeWidth={2} fill="url(#evalGrad)" dot={{ r: 3, fill: '#16a34a' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick actions row */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('new-evaluation')} style={{ flex: 1, background: 'white', border: '1.5px dashed #bbf7d0', borderRadius: 12, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, color: '#16a34a' }}>
            <div style={{ width: 36, height: 36, background: '#f0fdf4', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus style={{ width: 18, height: 18, color: '#16a34a' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Nueva evaluación</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Delimitar parcela y evaluar cultivos</div>
            </div>
          </button>
          <button onClick={() => navigate('results')} style={{ flex: 1, background: 'white', border: '1.5px dashed #e2e8f0', borderRadius: 12, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: '#ecfeff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp style={{ width: 18, height: 18, color: '#0891b2' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Ver resultados</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Ranking y detalle de evaluaciones</div>
            </div>
          </button>
          <button onClick={() => navigate('report')} style={{ flex: 1, background: 'white', border: '1.5px dashed #e2e8f0', borderRadius: 12, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: '#faf5ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Download style={{ width: 18, height: 18, color: '#7c3aed' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Generar reporte</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Exportar PDF con resultados y brechas</div>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
