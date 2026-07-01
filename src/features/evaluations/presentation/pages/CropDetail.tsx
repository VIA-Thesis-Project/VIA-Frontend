import { Fragment, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, Info } from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { NavigateFn } from '@/app/navigation/navigation';
import { toUserFriendlyFailureReason } from '@/features/evaluations/application/backendFailureMessages';
import { getCropLabel } from '@/features/evaluations/application/cropCatalog';
import { formatBackendStatus, formatCriterionLabel, formatNumberWithUnit, formatPhaseLabel } from '@/features/evaluations/application/displayFormatters';
import { isRecommendableViabilityCategory } from '@/features/evaluations/application/evaluationStatus';
import { CropEvaluationResult, EvaluationMcdaResult } from '@/features/evaluations/domain/evaluation';
import { EvaluationApiRepository } from '@/features/evaluations/infrastructure/api/evaluationApiRepository';
import { readCurrentEvaluation, readSelectedCropId } from '@/features/evaluations/infrastructure/session/currentEvaluationStorage';
import Sidebar from '@/shared/presentation/layouts/Sidebar';

interface Props { navigate: NavigateFn; }

const evaluationRepository = new EvaluationApiRepository();

// Colors assigned to phases by their index within a criterion group (cycles if > 7 phases)
const PHASE_PILL_STYLES = [
  { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  { bg: '#f5f3ff', color: '#7c3aed', border: '#ddd6fe' },
  { bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  { bg: '#fdf4ff', color: '#a21caf', border: '#f0abfc' },
  { bg: '#fefce8', color: '#854d0e', border: '#fef08a' },
  { bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
];

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

function humanizePhase(raw: string): string {
  return raw.replace(/_/g, ' ');
}

function formatPeriodLabel(period: string): string {
  if (!period) return '—';
  // YYYY-MM date → "ene 2026"
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-');
    const months = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  }
  if (period === 'site_static') return 'Dato estático';
  // "phase_name_climate" → strip phase prefix, show just the type
  if (period.endsWith('_climate')) return 'Clima';
  if (period.endsWith('_static')) return 'Estático';
  if (period.endsWith('_soil')) return 'Suelo';
  return humanizePhase(period);
}

function gapSeverityStyle(gapValue: number, optimalLimit: number) {
  const relGap = optimalLimit !== 0
    ? Math.abs(gapValue) / Math.max(Math.abs(optimalLimit), 1)
    : 1;
  if (relGap > 0.5) return { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' };
  if (relGap > 0.2) return { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' };
  return { bg: '#fefce8', color: '#854d0e', border: '#fef08a' };
}

function buildAllFactors(crop: CropEvaluationResult) {
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
        criterionName: gap.criterionName,
        criterionLabel: gap.criterionLabel,
        criterionGroup: gap.criterionGroup,
        phaseName: gap.phaseName,
        unit: gap.unit,
        interventionClass: gap.interventionClass,
      }));

  return factors.map((factor) => {
    const value = Math.max(0, Math.min(1, factor.membership));
    const color = value >= 0.75 ? '#16a34a' : value >= 0.5 ? '#d97706' : '#dc2626';
    return {
      criterionId: factor.criterionId,
      phaseId: factor.phaseId,
      label: formatCriterionLabel(factor),
      phaseLabel: humanizePhase(formatPhaseLabel(factor)),
      value,
      observed: formatNumberWithUnit(factor.observedValue, factor.unit),
      optimal: formatNumberWithUnit(factor.optimalLimit, factor.unit),
      status: value >= 0.75 ? 'Adecuado' : value >= 0.5 ? 'Moderado' : 'Critico',
      color,
      bg: value >= 0.75 ? '#f0fdf4' : value >= 0.5 ? '#fffbeb' : '#fee2e2',
      border: value >= 0.75 ? '#bbf7d0' : value >= 0.5 ? '#fde68a' : '#fecaca',
    };
  });
}

function PhaseTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload as { name: string; value: number; phases: Array<{ phase: string; value: number }> };
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 11, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>{data.name}</div>
      {data.phases.map((p) => (
        <div key={p.phase} style={{ color: '#475569', display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 2 }}>
          <span>{p.phase}</span>
          <span style={{ fontWeight: 700, color: p.value >= 75 ? '#16a34a' : p.value >= 50 ? '#d97706' : '#dc2626' }}>{p.value}%</span>
        </div>
      ))}
    </div>
  );
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
    return () => { cancelled = true; };
  }, [currentEvaluation]);

  const selectedCropId = useMemo(() => readSelectedCropId(), []);
  const crop = useMemo(() => {
    const results = sortResults(mcdaResult?.results ?? []);
    return results.find((result) => result.cropId === selectedCropId) ?? results[0] ?? null;
  }, [mcdaResult, selectedCropId]);

  const allFactors = useMemo(() => (crop ? buildAllFactors(crop) : []), [crop]);

  // Group factors by criterion; limit to 6 unique criteria for the cards section
  const groupedCards = useMemo(() => {
    const map = new Map<string, typeof allFactors>();
    allFactors.forEach((card) => {
      const group = map.get(card.criterionId) ?? [];
      group.push(card);
      map.set(card.criterionId, group);
    });
    return Array.from(map.entries()).slice(0, 6);
  }, [allFactors]);

  // One bar per criterion: show worst (min) membership across phases
  const chartData = useMemo(() =>
    groupedCards.map(([, cards]) => {
      const minValue = Math.min(...cards.map((c) => Math.round(c.value * 100)));
      return {
        name: cards[0].label,
        value: minValue,
        color: minValue >= 75 ? '#16a34a' : minValue >= 50 ? '#d97706' : '#dc2626',
        phases: cards.map((c) => ({ phase: c.phaseLabel, value: Math.round(c.value * 100) })),
      };
    }), [groupedCards]);

  // Group gaps by criterion for the table
  const groupedGaps = useMemo(() => {
    const map = new Map<string, typeof crop.gaps>();
    (crop?.gaps ?? []).forEach((gap) => {
      const group = map.get(gap.criterionId) ?? [];
      group.push(gap);
      map.set(gap.criterionId, group);
    });
    return Array.from(map.entries());
  }, [crop]);

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
            {/* Hero */}
            <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #ecfeff)', borderRadius: 18, border: '1px solid #bbf7d0', padding: '24px 28px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ width: 90, height: 90, borderRadius: '50%', background: 'white', border: `4px solid ${style.color}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(22,163,74,0.2)', flexShrink: 0 }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: style.color, lineHeight: 1 }}>{score}%</span>
                <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>score</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>{getCropLabel(crop.cropId)}</h1>
                  <div style={{ background: style.bg, color: style.color, fontSize: 12, fontWeight: 700, padding: '5px 14px', borderRadius: 20, border: `1px solid ${style.border}` }}>{formatBackendStatus(crop.viabilityCategory)}</div>
                </div>
                <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.6, maxWidth: 700 }}>
                  Condicion de calculo: <strong style={{ color: '#0f172a' }}>{formatBackendStatus(crop.calcCondition)}</strong>. Se detectaron {crop.gaps.length} brechas en {groupedGaps.length} {groupedGaps.length === 1 ? 'criterio' : 'criterios'} y {crop.limitingFactors.length} factores limitantes.
                </p>
              </div>
              <button
                onClick={() => navigate('recommendations')}
                style={{ background: cropCanReceiveRecommendation ? '#16a34a' : '#d97706', color: 'white', border: 'none', padding: '12px 22px', borderRadius: 11, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
              >
                {cropCanReceiveRecommendation ? 'Ver recomendacion' : 'Ver resultado'} <ChevronRight style={{ width: 15, height: 15 }} />
              </button>
            </div>

            {/* Cards + chart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 20 }}>
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Factores evaluados por MCDA</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Agrupados por criterio — cada fase puede tener una membresia distinta</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {groupedCards.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', color: '#64748b', fontSize: 13 }}>Sin factores detallados.</div>
                  )}
                  {groupedCards.map(([criterionId, cards], groupIdx) => (
                    <Fragment key={criterionId}>
                      {/* Criterion group header */}
                      <div style={{
                        gridColumn: '1 / -1',
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 0 4px',
                        borderTop: groupIdx > 0 ? '1px solid #f1f5f9' : 'none',
                        marginTop: groupIdx > 0 ? 8 : 0,
                      }}>
                        <span style={{ fontSize: 12.5, fontWeight: 700, color: '#374151' }}>{cards[0].label}</span>
                        {cards.length > 1 && (
                          <span style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '1px 8px', borderRadius: 20 }}>
                            {cards.length} fases
                          </span>
                        )}
                      </div>

                      {/* Phase cards for this criterion */}
                      {cards.map((card, phaseIdx) => {
                        const pill = PHASE_PILL_STYLES[phaseIdx % PHASE_PILL_STYLES.length];
                        return (
                          <div key={`${criterionId}-${card.phaseId}`} style={{ background: '#fafafa', borderRadius: 12, padding: 14, border: '1px solid #f1f5f9' }}>
                            {/* Phase pill + status badge */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 4 }}>
                              <div style={{ background: pill.bg, color: pill.color, border: `1px solid ${pill.border}`, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '65%' }}>
                                {card.phaseLabel}
                              </div>
                              <div style={{ fontSize: 10, fontWeight: 600, padding: '3px 7px', borderRadius: 10, background: card.bg, color: card.color, border: `1px solid ${card.border}`, flexShrink: 0 }}>
                                {card.status}
                              </div>
                            </div>
                            {/* Membership score */}
                            <div style={{ marginBottom: 8 }}>
                              <span style={{ fontSize: 26, fontWeight: 900, color: card.color }}>{card.value.toFixed(2)}</span>
                              <span style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>membresia</span>
                            </div>
                            <div style={{ height: 5, background: '#f1f5f9', borderRadius: 3, marginBottom: 10 }}>
                              <div style={{ width: `${card.value * 100}%`, height: '100%', background: card.color, borderRadius: 3 }} />
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                              <div>
                                <div style={{ fontSize: 10, color: '#94a3b8' }}>Observado</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{card.observed}</div>
                              </div>
                              <div>
                                <div style={{ fontSize: 10, color: '#94a3b8' }}>Optimo</div>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{card.optimal}</div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 20px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>Membresia por criterio</div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 14 }}>Peor fase por criterio · pasa el cursor para ver todas</div>
                  <ResponsiveContainer width="100%" height={Math.max(120, chartData.length * 42)}>
                    <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }}>
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10.5, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip content={<PhaseTooltip />} />
                      <Bar dataKey="value" radius={[0, 5, 5, 0]}>
                        {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: '#f0fdf4', borderRadius: 14, border: '1px solid #bbf7d0', padding: '14px 16px', display: 'flex', gap: 10 }}>
                  <Info style={{ width: 15, height: 15, color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.6 }}>
                    Cada barra muestra la fase mas limitante del criterio. Los colores de fase son consistentes dentro de cada criterio.
                  </div>
                </div>
              </div>
            </div>

            {/* Brechas table — grouped by criterion */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Brechas agronomicas</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {crop.gaps.length} brechas en {groupedGaps.length} {groupedGaps.length === 1 ? 'criterio' : 'criterios'} — agrupadas por criterio
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#fafafa' }}>
                      {['Fase', 'Periodo', 'Observado', 'Optimo', 'Brecha'].map((h) => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {groupedGaps.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: 16, fontSize: 13, color: '#64748b' }}>Sin brechas reportadas.</td>
                      </tr>
                    )}
                    {groupedGaps.map(([criterionId, gaps]) => (
                      <Fragment key={criterionId}>
                        {/* Criterion group header row */}
                        <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                          <td colSpan={5} style={{ padding: '8px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
                                {formatCriterionLabel(gaps[0])}
                              </span>
                              <span style={{ fontSize: 11, color: '#94a3b8', background: '#e2e8f0', padding: '1px 8px', borderRadius: 20 }}>
                                {gaps.length} {gaps.length === 1 ? 'fase' : 'fases'}
                              </span>
                            </div>
                          </td>
                        </tr>
                        {/* Phase rows */}
                        {gaps.map((row) => {
                          const sevStyle = gapSeverityStyle(row.gapValue, row.optimalLimit);
                          return (
                            <tr key={`${row.criterionId}-${row.phaseId}-${row.mostLimitingPeriod}`} style={{ borderTop: '1px solid #f8fafc' }}>
                              <td style={{ padding: '10px 16px 10px 28px', fontSize: 13, color: '#475569', fontWeight: 500 }}>
                                {humanizePhase(formatPhaseLabel(row))}
                              </td>
                              <td style={{ padding: '10px 16px', fontSize: 12, color: '#94a3b8' }}>{formatPeriodLabel(row.mostLimitingPeriod)}</td>
                              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{formatNumberWithUnit(row.observedValue, row.unit)}</td>
                              <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748b' }}>{formatNumberWithUnit(row.optimalLimit, row.unit)}</td>
                              <td style={{ padding: '10px 16px' }}>
                                <div style={{ background: sevStyle.bg, color: sevStyle.color, border: `1px solid ${sevStyle.border}`, fontSize: 11.5, fontWeight: 700, padding: '4px 10px', borderRadius: 20, display: 'inline-block' }}>
                                  {formatNumber(row.gapValue)} {row.unit ?? ''}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
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
