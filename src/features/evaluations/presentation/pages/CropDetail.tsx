import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, Info } from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { NavigateFn } from '@/app/navigation/navigation';
import { toUserFriendlyFailureReason } from '@/features/evaluations/application/backendFailureMessages';
import { getCropLabel } from '@/features/evaluations/application/cropCatalog';
import { isRecommendableViabilityCategory } from '@/features/evaluations/application/evaluationStatus';
import { CropEvaluationResult, EvaluationMcdaResult } from '@/features/evaluations/domain/evaluation';
import { EvaluationApiRepository } from '@/features/evaluations/infrastructure/api/evaluationApiRepository';
import { readCurrentEvaluation } from '@/features/evaluations/infrastructure/session/currentEvaluationStorage';
import Sidebar from '@/shared/presentation/layouts/Sidebar';

interface Props { navigate: NavigateFn; }

const evaluationRepository = new EvaluationApiRepository();

function toPercent(score: number | null): number {
  if (score === null) return 0;
  return Math.round(score <= 1 ? score * 100 : score);
}

function categoryStyle(category: string) {
  const normalized = category.toUpperCase();
  if (normalized.includes('VIABLE') && !normalized.includes('NO')) {
    return { color: '#16a34a', bg: '#dcfce7', border: '#bbf7d0' };
  }
  if (normalized.includes('CONDICIONAL')) {
    return { color: '#d97706', bg: '#fef3c7', border: '#fde68a' };
  }
  return { color: '#dc2626', bg: '#fee2e2', border: '#fecaca' };
}

function sortResults(results: CropEvaluationResult[]): CropEvaluationResult[] {
  return [...results].sort((a, b) => {
    const aRanked = a.rankPosition !== null;
    const bRanked = b.rankPosition !== null;
    if (aRanked && bRanked) return Number(a.rankPosition) - Number(b.rankPosition);
    if (aRanked !== bRanked) return aRanked ? -1 : 1;
    return (b.score ?? -1) - (a.score ?? -1);
  });
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function buildCriteriaCards(crop: CropEvaluationResult) {
  const factors = crop.limitingFactors.length > 0
    ? crop.limitingFactors
    : crop.gaps.map((gap) => ({
        criterionId: gap.criterionId,
        phaseId: gap.phaseId,
        policy: 'gap',
        penaltyFactor: null,
        observedValue: gap.observedValue,
        optimalLimit: gap.optimalLimit,
        membership: Math.max(0, Math.min(1, 1 - Math.abs(gap.gapValue) / Math.max(Math.abs(gap.optimalLimit), 1))),
        docSource: null,
      }));

  return factors.slice(0, 6).map((factor) => {
    const value = Math.max(0, Math.min(1, factor.membership));
    const color = value >= 0.75 ? '#16a34a' : value >= 0.5 ? '#d97706' : '#dc2626';
    return {
      label: factor.criterionId,
      value,
      observed: formatNumber(factor.observedValue),
      optimal: formatNumber(factor.optimalLimit),
      status: value >= 0.75 ? 'Adecuado' : value >= 0.5 ? 'Moderado' : 'Critico',
      color,
      bg: value >= 0.75 ? '#f0fdf4' : value >= 0.5 ? '#fffbeb' : '#fee2e2',
      border: value >= 0.75 ? '#bbf7d0' : value >= 0.5 ? '#fde68a' : '#fecaca',
      detail: `${factor.phaseId} - politica ${factor.policy}`,
    };
  });
}

export default function CropDetail({ navigate }: Props) {
  const [currentEvaluation] = useState(() => readCurrentEvaluation());
  const [mcdaResult, setMcdaResult] = useState<EvaluationMcdaResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(currentEvaluation ? null : 'No hay una evaluacion activa.');

  useEffect(() => {
    if (!currentEvaluation) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadResult = async () => {
      try {
        const result = await evaluationRepository.getMcdaResult(currentEvaluation.evaluationId);
        if (!cancelled) {
          setMcdaResult(result);
          setError(toUserFriendlyFailureReason(result.failureReason));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo consultar el detalle MCDA.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadResult();
    return () => {
      cancelled = true;
    };
  }, [currentEvaluation]);

  const crop = useMemo(() => sortResults(mcdaResult?.results ?? [])[0] ?? null, [mcdaResult]);
  const criteriaCards = useMemo(() => (crop ? buildCriteriaCards(crop) : []), [crop]);
  const chartData = criteriaCards.map((card) => ({
    name: card.label,
    value: Math.round(card.value * 100),
    color: card.color,
  }));
  const score = toPercent(crop?.score ?? null);
  const style = categoryStyle(crop?.viabilityCategory ?? '');
  const cropCanReceiveRecommendation = isRecommendableViabilityCategory(crop?.viabilityCategory);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="results" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <button onClick={() => navigate('results')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8', fontSize: 12 }}>
            <ArrowLeft style={{ width: 13, height: 13 }} /> Resultados
          </button>
          <span style={{ color: '#e2e8f0' }}>/</span>
          <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Detalle MCDA</span>
        </div>

        {error && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 13.5 }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: 24, color: '#64748b' }}>
            Consultando detalle MCDA...
          </div>
        )}

        {!loading && !crop && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: 24, color: '#64748b' }}>
            Aun no hay un resultado MCDA disponible para mostrar detalle de cultivo.
          </div>
        )}

        {crop && (
          <>
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfeff)', borderRadius: 18, border: '1px solid #bbf7d0', padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'white', border: `4px solid ${style.color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(22,163,74,0.2)', flexShrink: 0 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: style.color, lineHeight: 1 }}>{score}%</span>
                <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>score</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>{getCropLabel(crop.cropId)}</h1>
                  <div style={{ background: style.bg, color: style.color, fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, border: `1px solid ${style.border}` }}>{crop.viabilityCategory}</div>
                </div>
                <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.6, maxWidth: 700 }}>
                  Resultado calculado por el backend para la evaluacion activa. Condicion de calculo: <strong style={{ color: '#0f172a' }}>{crop.calcCondition}</strong>. Se detectaron {crop.gaps.length} brechas y {crop.limitingFactors.length} factores limitantes.
                </p>
              </div>
              <button
                onClick={() => navigate('recommendations')}
                style={{ background: cropCanReceiveRecommendation ? '#16a34a' : '#d97706', color: 'white', border: 'none', padding: '12px 22px', borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
              >
                {cropCanReceiveRecommendation ? 'Ver recomendacion' : 'Ver criterio backend'} <ChevronRight style={{ width: 15, height: 15 }} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Factores evaluados por MCDA</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {criteriaCards.length === 0 && <div style={{ color: '#64748b', fontSize: 13 }}>Sin factores detallados reportados por el backend.</div>}
                  {criteriaCards.map(({ label, value, observed, optimal, status, color, bg, border, detail }) => (
                    <div key={`${label}-${detail}`} style={{ background: '#fafafa', borderRadius: 12, padding: 16, border: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{label}</div>
                        <div style={{ fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 10, background: bg, color, border: `1px solid ${border}` }}>{status}</div>
                      </div>
                      <div style={{ marginBottom: 10 }}>
                        <span style={{ fontSize: 28, fontWeight: 900, color }}>{value.toFixed(2)}</span>
                        <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>membresia</span>
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
                          <div style={{ fontSize: 10, color: '#94a3b8' }}>Optimo</div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{optimal}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, lineHeight: 1.4 }}>{detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Membresia por criterio</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>Datos derivados del resultado MCDA</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 10 }}>
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11.5, fill: '#64748b' }} axisLine={false} tickLine={false} width={70} />
                      <Tooltip formatter={(v: number) => [`${v}%`, 'Membresia']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                        {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: '#f0fdf4', borderRadius: 14, border: '1px solid #bbf7d0', padding: '14px 16px', display: 'flex', gap: 10 }}>
                  <Info style={{ width: 15, height: 15, color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.6 }}>
                    Esta pantalla ya no usa el mock de detalle de cultivo. Si faltan criterios visuales, es porque el backend aun no expone mas variables crudas para la evaluacion.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Brechas agronomicas</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Valores observados y limites optimos reportados por el backend</div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fafafa' }}>
                      {['Criterio', 'Fase', 'Periodo', 'Valor observado', 'Limite optimo', 'Brecha'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {crop.gaps.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: 16, fontSize: 13, color: '#64748b' }}>Sin brechas reportadas.</td>
                      </tr>
                    )}
                    {crop.gaps.map((row) => (
                      <tr key={`${row.criterionId}-${row.phaseId}-${row.mostLimitingPeriod}`} style={{ borderTop: '1px solid #f8fafc' }}>
                        <td style={{ padding: '12px 16px', fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{row.criterionId}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#475569', fontWeight: 600 }}>{row.phaseId}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>{row.mostLimitingPeriod}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>{formatNumber(row.observedValue)}</td>
                        <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>{formatNumber(row.optimalLimit)}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ background: '#fffbeb', color: '#d97706', fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20, display: 'inline-block' }}>{formatNumber(row.gapValue)}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
