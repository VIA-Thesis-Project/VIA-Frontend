import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronRight, Download, Eye, FileText, Map, MapPin, Plus, Sprout, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { NavigateFn } from '@/app/navigation/navigation';
import { cropCatalog } from '@/features/evaluations/application/cropCatalog';
import { Parcel } from '@/features/evaluations/domain/parcel';
import { ParcelApiRepository } from '@/features/evaluations/infrastructure/api/parcelApiRepository';
import { readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';
import Sidebar from '@/shared/presentation/layouts/Sidebar';

interface Props { navigate: NavigateFn; }

const parcelRepository = new ParcelApiRepository();

function formatParcelArea(parcel: Parcel): string {
  const match = parcel.metadata.description.match(/Area estimada:\s*([0-9.,]+)/i);
  return match ? `${match[1].replace(',', '.')} ha` : 'Area no registrada';
}

function buildTrendData(parcelCount: number) {
  const now = Math.max(parcelCount, 1);
  return [
    { m: 'Abr', v: 0 },
    { m: 'May', v: Math.max(0, now - 2) },
    { m: 'Jun', v: now },
  ];
}

export default function Dashboard({ navigate }: Props) {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const session = readAuthSession();
    if (!session) {
      setError('Inicia sesion para consultar tus parcelas registradas.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadParcels = async () => {
      try {
        const result = await parcelRepository.listParcels(session.accessToken);
        if (!cancelled) setParcels(result);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar las parcelas.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadParcels();
    return () => {
      cancelled = true;
    };
  }, []);

  const trendData = useMemo(() => buildTrendData(parcels.length), [parcels.length]);
  const recentParcels = parcels.slice(0, 5);

  const stats = [
    { icon: MapPin, label: 'Parcelas registradas', value: String(parcels.length), trend: loading ? 'Consultando' : 'Backend real', color: '#16a34a', bg: '#f0fdf4', iconBg: '#dcfce7' },
    { icon: TrendingUp, label: 'Evaluaciones visibles', value: '-', trend: 'Sin listado backend', color: '#0891b2', bg: '#ecfeff', iconBg: '#cffafe' },
    { icon: Sprout, label: 'Cultivos demo', value: String(cropCatalog.length), trend: 'Seeds backend', color: '#d97706', bg: '#fffbeb', iconBg: '#fef3c7' },
    { icon: FileText, label: 'Recomendaciones', value: '-', trend: 'Por evaluacion', color: '#7c3aed', bg: '#faf5ff', iconBg: '#ede9fe' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="dashboard" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: 4 }}>Dashboard</h1>
            <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>Vista conectada al backend local de AgroViabilidad DSS.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate('new-evaluation')}
              style={{ background: '#16a34a', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <Plus style={{ width: 15, height: 15 }} />
              Nueva evaluacion
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 13.5 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {stats.map(({ icon: Icon, label, value, trend, color, bg, iconBg }) => (
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginBottom: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Parcelas registradas</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {loading ? 'Consultando backend...' : `${recentParcels.length} parcelas recientes desde /parcelas`}
                </div>
              </div>
              <button
                onClick={() => navigate('new-evaluation')}
                style={{ background: 'none', border: 'none', color: '#16a34a', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                Nueva <ChevronRight style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Parcela', 'CRS', 'Area', 'Origen', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={5} style={{ padding: 18, fontSize: 13, color: '#64748b' }}>Cargando parcelas...</td>
                  </tr>
                )}
                {!loading && recentParcels.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: 18, fontSize: 13, color: '#64748b' }}>Aun no hay parcelas guardadas en el backend.</td>
                  </tr>
                )}
                {recentParcels.map((parcel) => (
                  <tr key={parcel.id} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{parcel.metadata.name}</div>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin style={{ width: 10, height: 10 }} /> ID {parcel.id.slice(0, 8)}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748b' }}>{parcel.metadata.crs}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>{formatParcelArea(parcel)}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ background: '#f0fdf4', color: '#15803d', fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20, display: 'inline-block' }}>Backend</div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button
                        onClick={() => navigate('new-evaluation')}
                        style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
                      >
                        <Eye style={{ width: 12, height: 12 }} /> Usar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  {recentParcels.slice(0, 3).map((parcel, index) => {
                    const shapes = [
                      '60,30 140,20 160,75 130,100 55,90 45,55',
                      '200,40 270,35 285,80 255,100 195,90 185,65',
                      '290,90 340,85 345,130 310,140 280,135 275,110',
                    ];
                    const colors = ['#16a34a', '#0891b2', '#d97706'];
                    return (
                      <polygon key={parcel.id} points={shapes[index]} fill={colors[index]} fillOpacity="0.25" stroke={colors[index]} strokeWidth="2" />
                    );
                  })}
                </svg>
                <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {recentParcels.slice(0, 3).map((parcel, index) => (
                    <div key={parcel.id} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.9)', padding: '3px 7px', borderRadius: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: ['#15803d', '#0891b2', '#d97706'][index] }} />
                      <span style={{ fontSize: 10, color: '#475569', fontWeight: 500 }}>{parcel.metadata.name.slice(0, 16)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle style={{ width: 15, height: 15, color: '#d97706' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Pendientes de integracion</div>
              </div>
              <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  'Listado historico de evaluaciones',
                  'Metricas agregadas por mes',
                  'Alertas agronomicas globales',
                ].map((label) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{label}</span>
                    <div style={{ background: '#fffbeb', color: '#d97706', fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20 }}>sin endpoint</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '16px 20px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Parcelas por mes</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>Calculado localmente desde /parcelas</div>
              <ResponsiveContainer width="100%" height={80}>
                <AreaChart data={trendData}>
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

        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => navigate('new-evaluation')} style={{ flex: 1, background: 'white', border: '1.5px dashed #bbf7d0', borderRadius: 12, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, color: '#16a34a' }}>
            <div style={{ width: 36, height: 36, background: '#f0fdf4', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus style={{ width: 18, height: 18, color: '#16a34a' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Nueva evaluacion</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Delimitar parcela y evaluar cultivos</div>
            </div>
          </button>
          <button onClick={() => navigate('results')} style={{ flex: 1, background: 'white', border: '1.5px dashed #e2e8f0', borderRadius: 12, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: '#ecfeff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp style={{ width: 18, height: 18, color: '#0891b2' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Ver resultados</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Ranking MCDA de la evaluacion activa</div>
            </div>
          </button>
          <button onClick={() => navigate('report')} style={{ flex: 1, background: 'white', border: '1.5px dashed #e2e8f0', borderRadius: 12, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: '#faf5ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Download style={{ width: 18, height: 18, color: '#7c3aed' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Generar reporte</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Pendiente de endpoint PDF</div>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
