import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ChevronRight, Eye, Sprout, TrendingUp } from 'lucide-react';
import Sidebar from '@/shared/presentation/layouts/Sidebar';
import { NavigateFn } from '@/app/navigation/navigation';
import { isNoRankedCropFailure, toUserFriendlyFailureReason } from '@/features/evaluations/application/backendFailureMessages';
import { getCropLabel } from '@/features/evaluations/application/cropCatalog';
import { formatBackendStatus, formatCriterionLabel } from '@/features/evaluations/application/displayFormatters';
import { hasRecommendableCrop, isEvaluationFailed, isEvaluationPending } from '@/features/evaluations/application/evaluationStatus';
import { CropEvaluationResult, EvaluationMcdaResult } from '@/features/evaluations/domain/evaluation';
import { EvaluationApiRepository } from '@/features/evaluations/infrastructure/api/evaluationApiRepository';
import { readCurrentEvaluation, saveSelectedCropId } from '@/features/evaluations/infrastructure/session/currentEvaluationStorage';

interface Props { navigate: NavigateFn; }

const evaluationRepository = new EvaluationApiRepository();

function ScoreBar({ score, color }: { score: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: 4 }} />
      </div>
      <span style={{ fontSize: 16, fontWeight: 800, color, minWidth: 48 }}>{score}%</span>
    </div>
  );
}

function categoryStyle(category: string) {
  const normalized = category.toUpperCase();
  if (normalized.includes('VIABLE') && !normalized.includes('NO')) {
    return { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
  }
  if (normalized.includes('CONDICIONAL')) {
    return { color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
  }
  return { color: '#dc2626', bg: '#fee2e2', border: '#fecaca' };
}

function toPercent(score: number | null): number {
  if (score === null) return 0;
  return Math.round(score <= 1 ? score * 100 : score);
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

function countGapCriteria(crop: CropEvaluationResult): number {
  return new Set(crop.gaps.map((gap) => gap.criterionId)).size;
}

export default function Results({ navigate }: Props) {
  const [currentEvaluation] = useState(() => readCurrentEvaluation());
  const [mcdaResult, setMcdaResult] = useState<EvaluationMcdaResult | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(currentEvaluation ? null : 'No hay una evaluacion activa.');

  useEffect(() => {
    if (!currentEvaluation) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchResult = async () => {
      try {
        setLoading(true);
        const result = await evaluationRepository.getMcdaResult(currentEvaluation.evaluationId);
        if (!cancelled) {
          setMcdaResult(result);
          setError(toUserFriendlyFailureReason(result.failureReason));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo consultar el resultado MCDA.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchResult();
    return () => {
      cancelled = true;
    };
  }, [currentEvaluation, refreshCount]);

  const sortedResults = useMemo(() => sortResults(mcdaResult?.results ?? []), [mcdaResult]);
  const pending = isEvaluationPending(mcdaResult?.status);
  const failed = isEvaluationFailed(mcdaResult?.status);
  const noRankedCropFailure = isNoRankedCropFailure(mcdaResult?.failureReason);
  const canUseResults = sortedResults.length > 0;
  const canRequestRecommendations = hasRecommendableCrop(sortedResults);
  const noRecommendableCrops = canUseResults && !canRequestRecommendations && !pending && !failed;
  const limitingFactors = sortedResults.flatMap((result) => result.limitingFactors.slice(0, 2).map((factor) => ({
    cropId: result.cropId,
    factor,
  }))).slice(0, 4);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="results" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }} onClick={() => navigate('dashboard')}>Dashboard</div>
            <span style={{ color: '#e2e8f0' }}>/</span>
            <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Resultados de viabilidad</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: 6 }}>Resultados de viabilidad de cultivos</h1>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  { label: 'Parcela', value: currentEvaluation?.parcelName ?? '-' },
                  { label: 'Area', value: `${currentEvaluation?.areaHa ?? '-'} ha` },
                  { label: 'Ubicacion', value: currentEvaluation?.parcelLocation ?? '-' },
                  { label: 'Estado', value: mcdaResult?.status ? formatBackendStatus(mcdaResult.status) : (loading ? 'Consultando...' : '-') },
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
                onClick={() => navigate('recommendations')}
                disabled={!canUseResults}
                style={{ background: canUseResults ? (canRequestRecommendations ? '#16a34a' : '#d97706') : '#bbf7d0', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: canUseResults ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 7 }}
              >
                <Sprout style={{ width: 14, height: 14 }} />
                {canRequestRecommendations ? 'Ver recomendaciones' : 'Ver criterio backend'}
              </button>
            </div>
          </div>
        </div>

        {noRecommendableCrops && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
            El backend no generara recomendaciones para esta evaluacion porque ningun cultivo candidato alcanzo categoria <strong>VIABLE</strong> o <strong>CONDICIONAL</strong>. Puedes revisar las brechas MCDA o probar otra parcela/cultivos.
          </div>
        )}

        {error && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
          <div>
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
                <TrendingUp style={{ width: 16, height: 16, color: '#16a34a' }} />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Ranking de cultivos viables</div>
                <div style={{ marginLeft: 'auto', fontSize: 12, color: '#94a3b8' }}>Datos reales del endpoint MCDA</div>
              </div>

              {loading && <div style={{ padding: 24, color: '#64748b', fontSize: 14 }}>Consultando resultado MCDA...</div>}

              {!loading && sortedResults.length === 0 && (
                <div style={{ padding: 24, color: '#64748b', fontSize: 14 }}>
                  <div style={{ fontWeight: 700, color: failed ? '#991b1b' : '#0f172a', marginBottom: 6 }}>
                    {failed ? 'La evaluacion fallo en backend' : pending ? 'Resultado MCDA aun en procesamiento' : 'Sin resultados MCDA disponibles'}
                  </div>
                  <div style={{ lineHeight: 1.6, marginBottom: 14 }}>
                    {failed
                      ? (toUserFriendlyFailureReason(mcdaResult?.failureReason) ?? 'El backend marco la evaluacion como fallida.')
                      : pending
                      ? `Estado actual: ${formatBackendStatus(mcdaResult?.status)}. Vuelve a procesamiento o reconsulta cuando el backend complete la saga.`
                        : 'El backend respondio sin cultivos rankeados para esta evaluacion.'}
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => navigate(noRankedCropFailure ? 'new-evaluation' : 'processing')}
                      style={{ background: '#16a34a', color: 'white', border: 'none', padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      {noRankedCropFailure ? 'Nueva evaluacion' : 'Volver a procesamiento'}
                    </button>
                    <button
                      onClick={() => setRefreshCount((count) => count + 1)}
                      style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      Reconsultar MCDA
                    </button>
                  </div>
                </div>
              )}

              {sortedResults.map((crop, i) => {
                const score = toPercent(crop.score);
                const style = categoryStyle(crop.viabilityCategory);
                const gapCriteriaCount = countGapCriteria(crop);
                return (
                  <div key={crop.cropId} style={{ padding: '18px 24px', borderBottom: i < sortedResults.length - 1 ? '1px solid #f8fafc' : 'none', display: 'flex', gap: 16 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4, background: i === 0 ? '#fef3c7' : '#f8fafc', border: `1.5px solid ${i === 0 ? '#fbbf24' : '#e2e8f0'}` }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: i === 0 ? '#d97706' : '#94a3b8' }}>#{crop.rankPosition ?? i + 1}</span>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{getCropLabel(crop.cropId)}</span>
                        <div style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                          {formatBackendStatus(crop.viabilityCategory)}
                        </div>
                      </div>

                      <ScoreBar score={score} color={style.color} />

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Condicion</div>
                          <div style={{ fontSize: 12, color: '#475569' }}>{formatBackendStatus(crop.calcCondition)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: '#d97706', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brechas</div>
                          <div style={{ fontSize: 12, color: '#475569' }}>
                            {gapCriteriaCount} criterios con brecha · {crop.gaps.length} ocurrencias · {crop.limitingFactors.length} limitantes
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0, justifyContent: 'center' }}>
                      <button
                        onClick={() => {
                          saveSelectedCropId(crop.cropId);
                          navigate('crop-detail');
                        }}
                        style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', color: '#475569', padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Eye style={{ width: 13, height: 13 }} />
                        Ver detalle
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '20px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>Resumen de scores</div>
              {sortedResults.map((crop) => {
                const score = toPercent(crop.score);
                const style = categoryStyle(crop.viabilityCategory);
                return (
                  <div key={crop.cropId} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: '#475569', minWidth: 86, fontWeight: 500 }}>{getCropLabel(crop.cropId)}</span>
                    <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                      <div style={{ width: `${score}%`, height: '100%', background: style.color, borderRadius: 3, opacity: 0.85 }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: style.color, minWidth: 42, textAlign: 'right' }}>{score}%</span>
                  </div>
                );
              })}
            </div>

            <div style={{ background: '#fffbeb', borderRadius: 16, border: '1px solid #fde68a', padding: '16px 18px' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <AlertTriangle style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#92400e' }}>Factores limitantes principales</div>
              </div>
              {limitingFactors.length === 0 && <div style={{ fontSize: 12, color: '#78350f' }}>Sin factores limitantes reportados.</div>}
              {limitingFactors.map(({ cropId, factor }) => (
                <div key={`${cropId}-${factor.criterionId}-${factor.phaseId}`} style={{ fontSize: 12, color: '#78350f', marginBottom: 6, display: 'flex', gap: 6 }}>
                  <span style={{ color: '#d97706', flexShrink: 0, fontWeight: 700 }}>·</span>
                  {getCropLabel(cropId)}: {formatCriterionLabel(factor)} ({formatBackendStatus(factor.policy)})
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('recommendations')}
              disabled={!canUseResults}
              style={{ background: canUseResults ? (canRequestRecommendations ? 'linear-gradient(135deg, #15803d, #0891b2)' : 'linear-gradient(135deg, #d97706, #b45309)') : '#bbf7d0', color: 'white', border: 'none', padding: '14px', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: canUseResults ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {canRequestRecommendations ? 'Ver recomendaciones' : 'Ver motivo sin recomendacion'}
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
