import { useEffect, useMemo, useState } from 'react';
import { Eye, FileText, MapPin, Plus, Sprout, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { NavigateFn } from '@/app/navigation/navigation';
import { cropCatalog } from '@/features/evaluations/application/cropCatalog';
import { Parcel } from '@/features/evaluations/domain/parcel';
import { ParcelApiRepository } from '@/features/evaluations/infrastructure/api/parcelApiRepository';
import { readCurrentEvaluation } from '@/features/evaluations/infrastructure/session/currentEvaluationStorage';
import { readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';
import Sidebar from '@/shared/presentation/layouts/Sidebar';

interface Props { navigate: NavigateFn; }

const parcelRepository = new ParcelApiRepository();

function formatParcelArea(parcel: Parcel): string {
  const match = parcel.metadata.description.match(/Area estimada:\s*([0-9.,]+)/i);
  return match ? `${match[1].replace(',', '.')} ha` : 'Area no registrada';
}

function getParcelAreaHa(parcel: Parcel): number | null {
  const match = parcel.metadata.description.match(/Area estimada:\s*([0-9.,]+)/i);
  if (!match) return null;
  const area = Number(match[1].replace(',', '.'));
  return Number.isFinite(area) ? area : null;
}

function buildTrendData(parcels: Parcel[]) {
  const formatter = new Intl.DateTimeFormat('es-PE', { month: 'short' });
  const today = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return {
      key,
      m: formatter.format(date).replace('.', ''),
      v: 0,
    };
  });
  const monthByKey = new Map(months.map((month) => [month.key, month]));

  parcels.forEach((parcel) => {
    const createdAt = new Date(parcel.createdAt);
    if (Number.isNaN(createdAt.getTime())) return;
    const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
    const bucket = monthByKey.get(key);
    if (bucket) bucket.v += 1;
  });

  return months;
}

export default function Dashboard({ navigate }: Props) {
  const [currentEvaluation] = useState(() => readCurrentEvaluation());
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

  const trendData = useMemo(() => buildTrendData(parcels), [parcels]);
  const recentParcels = parcels.slice(0, 5);
  const areaValues = useMemo(() => parcels.map(getParcelAreaHa).filter((area): area is number => area !== null), [parcels]);
  const totalAreaHa = areaValues.reduce((sum, area) => sum + area, 0);
  const parcelsWithArea = areaValues.length;
  const parcelsWithoutArea = Math.max(parcels.length - parcelsWithArea, 0);
  const localEvaluationCount = currentEvaluation ? 1 : 0;
  const localRecommendationCount = currentEvaluation ? 1 : 0;
  const localSummary = [
    {
      label: 'Area total registrada',
      value: totalAreaHa > 0 ? `${totalAreaHa.toFixed(2)} ha` : 'Sin areas registradas',
      color: '#16a34a',
      bg: '#f0fdf4',
    },
    {
      label: 'Parcelas con area',
      value: String(parcelsWithArea),
      color: '#0891b2',
      bg: '#ecfeff',
    },
    {
      label: 'Parcelas sin area',
      value: String(parcelsWithoutArea),
      color: '#d97706',
      bg: '#fffbeb',
    },
    {
      label: 'Evaluacion activa',
      value: currentEvaluation ? currentEvaluation.parcelName : 'Ninguna',
      color: '#7c3aed',
      bg: '#faf5ff',
    },
  ];

  const stats = [
    { icon: MapPin, label: 'Parcelas registradas', value: String(parcels.length), trend: loading ? 'Cargando...' : 'En linea', color: '#16a34a', bg: '#f0fdf4', iconBg: '#dcfce7' },
    { icon: TrendingUp, label: 'Evaluacion activa', value: String(localEvaluationCount), trend: currentEvaluation ? 'En curso' : 'Ninguna', color: '#0891b2', bg: '#ecfeff', iconBg: '#cffafe' },
    { icon: Sprout, label: 'Cultivos disponibles', value: String(cropCatalog.length), trend: 'Catalogo VIA', color: '#d97706', bg: '#fffbeb', iconBg: '#fef3c7' },
    { icon: FileText, label: 'Recomendaciones', value: String(localRecommendationCount), trend: currentEvaluation ? 'Disponible' : 'Pendiente', color: '#7c3aed', bg: '#faf5ff', iconBg: '#ede9fe' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="dashboard" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: 4 }}>Dashboard</h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Resumen de parcelas, evaluaciones y recomendaciones recientes.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => navigate('new-evaluation')}
              style={{ background: '#16a34a', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <Plus style={{ width: 15, height: 15 }} />
              Nueva evaluacion
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {stats.map(({ icon: Icon, label, value, trend, color, bg, iconBg }) => (
            <div key={label} style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon style={{ width: 20, height: 20, color }} />
                </div>
                <div style={{ fontSize: 11, color, fontWeight: 600, background: bg, padding: '3px 8px', borderRadius: 999 }}>{trend}</div>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginBottom: 20 }}>
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Parcelas registradas</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {loading ? 'Cargando...' : `${recentParcels.length} parcelas registradas`}
                </div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Parcela', 'CRS', 'Area', 'Origen', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
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
                    <td colSpan={5} style={{ padding: 18, fontSize: 13, color: '#64748b' }}>Aun no hay parcelas registradas. Crea una nueva evaluacion para comenzar.</td>
                  </tr>
                )}
                {recentParcels.map((parcel) => (
                  <tr key={parcel.id} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>{parcel.metadata.name}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin style={{ width: 10, height: 10 }} /> ID {parcel.id.slice(0, 8)}
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748b' }}>{parcel.metadata.crs}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>{formatParcelArea(parcel)}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ background: '#f0fdf4', color: '#15803d', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, display: 'inline-block' }}>Registrada</div>
                    </td>
                    <td style={{ padding: '13px 16px' }}>
                      <button
                        onClick={() => navigate('new-evaluation')}
                        style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}
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
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText style={{ width: 15, height: 15, color: '#16a34a' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Resumen local</div>
              </div>
              <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {localSummary.map((item) => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: 13, color: '#475569', fontWeight: 500 }}>{item.label}</span>
                    <div style={{ background: item.bg, color: item.color, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, maxWidth: 170, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '16px 20px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Parcelas por mes</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>Parcelas registradas en los ultimos 6 meses</div>
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
            <div style={{ width: 36, height: 36, background: '#f0fdf4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus style={{ width: 18, height: 18, color: '#16a34a' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Nueva evaluacion</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Delimitar parcela y evaluar cultivos</div>
            </div>
          </button>
          <button onClick={() => navigate('results')} style={{ flex: 1, background: 'white', border: '1.5px dashed #e2e8f0', borderRadius: 12, padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: '#ecfeff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp style={{ width: 18, height: 18, color: '#0891b2' }} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Ver resultados</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>Ranking MCDA de la evaluacion activa</div>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
