import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronLeft, ExternalLink, FileText, RefreshCcw, Sprout } from 'lucide-react';
import { NavigateFn } from '@/app/navigation/navigation';
import { toUserFriendlyFailureReason } from '@/features/evaluations/application/backendFailureMessages';
import { getCropLabel } from '@/features/evaluations/application/cropCatalog';
import { hasRecommendableCrop, isEvaluationPending } from '@/features/evaluations/application/evaluationStatus';
import {
  CropEvaluationResult,
  EvaluationRecommendation,
  EvaluationMcdaResult,
  FinalRecommendationResult,
} from '@/features/evaluations/domain/evaluation';
import { EvaluationApiRepository } from '@/features/evaluations/infrastructure/api/evaluationApiRepository';
import { readCurrentEvaluation } from '@/features/evaluations/infrastructure/session/currentEvaluationStorage';
import Sidebar from '@/shared/presentation/layouts/Sidebar';

interface Props { navigate: NavigateFn; }

const evaluationRepository = new EvaluationApiRepository();
const RECOMMENDATION_POLL_INTERVAL_MS = 15000;
const RECOMMENDATION_POLL_MAX_ATTEMPTS = 24;

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

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function normalizeBackendText(value: string): string {
  return value
    .replaceAll('Ã¡', 'a')
    .replaceAll('Ã©', 'e')
    .replaceAll('Ã­', 'i')
    .replaceAll('Ã³', 'o')
    .replaceAll('Ãº', 'u')
    .replaceAll('Ã±', 'n');
}

function readErrorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}

function buildDerivedActions(crop: CropEvaluationResult | null) {
  if (!crop) return [];

  const factors = crop.limitingFactors.slice(0, 4);
  if (factors.length === 0) {
    return [
      {
        title: 'Revision tecnica',
        items: [
          `Validar en campo la viabilidad reportada para ${getCropLabel(crop.cropId)}.`,
          'Contrastar el resultado MCDA con disponibilidad hidrica, acceso y manejo local.',
        ],
      },
    ];
  }

  return [
    {
      title: 'Acciones sugeridas desde brechas MCDA',
      items: factors.map((factor) => (
        `Revisar ${factor.criterionId} en fase ${factor.phaseId}: valor observado ${formatNumber(factor.observedValue)} frente a limite ${formatNumber(factor.optimalLimit)}.`
      )),
    },
    {
      title: 'Validacion agronomica',
      items: [
        'Priorizar verificacion de campo para los factores con menor membresia.',
        'Registrar evidencia local antes de convertir esta salida en plan de manejo.',
      ],
    },
  ];
}

export default function Recommendations({ navigate }: Props) {
  const [currentEvaluation] = useState(() => readCurrentEvaluation());
  const [mcdaResult, setMcdaResult] = useState<EvaluationMcdaResult | null>(null);
  const [recommendation, setRecommendation] = useState<FinalRecommendationResult | null>(null);
  const [allRecommendations, setAllRecommendations] = useState<EvaluationRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);
  const [lastPolledAt, setLastPolledAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(currentEvaluation ? null : 'No hay una evaluacion activa.');

  const fetchRecommendationSnapshot = async () => {
    if (!currentEvaluation) return false;

    const [finalRecommendationResult, recommendationsResult] = await Promise.allSettled([
      evaluationRepository.getFinalRecommendation(currentEvaluation.evaluationId),
      evaluationRepository.getRecommendationsForEvaluation(currentEvaluation.evaluationId),
    ]);

    let hasRecommendation = false;
    const requestErrors: string[] = [];

    if (finalRecommendationResult.status === 'fulfilled') {
      setRecommendation(finalRecommendationResult.value);
      hasRecommendation = finalRecommendationResult.value.status === 'available';
    } else {
      requestErrors.push(readErrorMessage(finalRecommendationResult.reason, 'No se pudo consultar la recomendacion final.'));
    }

    if (recommendationsResult.status === 'fulfilled') {
      setAllRecommendations(recommendationsResult.value);
      hasRecommendation = hasRecommendation || recommendationsResult.value.length > 0;
    } else {
      requestErrors.push(readErrorMessage(recommendationsResult.reason, 'No se pudo consultar el historial de recomendaciones.'));
    }

    setLastPolledAt(new Date());

    if (!hasRecommendation && requestErrors.length === 2) {
      throw new Error(requestErrors[0]);
    }

    return hasRecommendation;
  };

  const refreshRecommendation = async () => {
    if (!currentEvaluation) return;

    setRefreshing(true);
    setError(null);
    try {
      const hasRecommendation = await fetchRecommendationSnapshot();
      if (hasRecommendation) {
        setPollAttempts(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reconsultar la recomendacion.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!currentEvaluation) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadRecommendation = async () => {
      try {
        const [mcdaResultPromise, finalRecommendationPromise, recommendationsPromise] = await Promise.allSettled([
          evaluationRepository.getMcdaResult(currentEvaluation.evaluationId),
          evaluationRepository.getFinalRecommendation(currentEvaluation.evaluationId),
          evaluationRepository.getRecommendationsForEvaluation(currentEvaluation.evaluationId),
        ]);

        if (!cancelled) {
          if (mcdaResultPromise.status === 'fulfilled') {
            setMcdaResult(mcdaResultPromise.value);
            setError(toUserFriendlyFailureReason(mcdaResultPromise.value.failureReason));
          } else {
            setError(mcdaResultPromise.reason instanceof Error ? mcdaResultPromise.reason.message : 'No se pudo consultar el resultado MCDA.');
          }

          if (finalRecommendationPromise.status === 'fulfilled') {
            setRecommendation(finalRecommendationPromise.value);
          }

          if (recommendationsPromise.status === 'fulfilled') {
            setAllRecommendations(recommendationsPromise.value);
          }

          setLastPolledAt(new Date());
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo consultar la recomendacion.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadRecommendation();
    return () => {
      cancelled = true;
    };
  }, [currentEvaluation]);

  const topCrop = useMemo(() => sortResults(mcdaResult?.results ?? [])[0] ?? null, [mcdaResult]);
  const derivedActions = useMemo(() => buildDerivedActions(topCrop), [topCrop]);
  const score = toPercent(topCrop?.score ?? null);
  const cropLabel = topCrop ? getCropLabel(topCrop.cropId) : '-';
  const finalRecommendation = recommendation?.status === 'available' ? recommendation.recommendation : null;
  const listRecommendation = allRecommendations.at(-1) ?? null;
  const backendRecommendation = finalRecommendation ?? listRecommendation;
  const pendingDetail = recommendation?.status === 'pending' && !listRecommendation ? recommendation.detail : null;
  const mcdaPending = isEvaluationPending(mcdaResult?.status);
  const hasMcdaResults = (mcdaResult?.results.length ?? 0) > 0;
  const noRecommendableCrops = Boolean(!mcdaPending && hasMcdaResults && !hasRecommendableCrop(mcdaResult?.results ?? []));
  const backendSections = backendRecommendation?.sections ?? [];
  const gapRecommendations = backendRecommendation?.gapRecommendations ?? [];
  const shouldAutoPoll = Boolean(currentEvaluation && !loading && !backendRecommendation && !mcdaPending && !noRecommendableCrops && pollAttempts < RECOMMENDATION_POLL_MAX_ATTEMPTS);
  const pollLimitReached = Boolean(currentEvaluation && !backendRecommendation && !mcdaPending && !noRecommendableCrops && pollAttempts >= RECOMMENDATION_POLL_MAX_ATTEMPTS);

  useEffect(() => {
    if (!shouldAutoPoll || refreshing) return;

    const timeoutId = window.setTimeout(() => {
      setPollAttempts((attempts) => attempts + 1);
      void refreshRecommendation();
    }, RECOMMENDATION_POLL_INTERVAL_MS);

    return () => window.clearTimeout(timeoutId);
  }, [refreshing, shouldAutoPoll, pollAttempts]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="results" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <button onClick={() => navigate('crop-detail')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>
              <ChevronLeft style={{ width: 13, height: 13 }} /> Volver a detalle de cultivo
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: 6 }}>Recomendaciones agronomicas</h1>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Cultivo: {cropLabel}</div>
              <div style={{ height: 14, width: 1, background: '#e2e8f0' }} />
              <div style={{ fontSize: 13, color: '#64748b' }}>Parcela: <strong>{currentEvaluation?.parcelName ?? '-'}</strong></div>
              <div style={{ height: 14, width: 1, background: '#e2e8f0' }} />
              <div style={{ background: '#dcfce7', color: '#16a34a', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>Score: {score}%</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('results')} style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '9px 16px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Volver al ranking
            </button>
            <button onClick={() => navigate('report')} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              <FileText style={{ width: 14, height: 14 }} /> Generar reporte
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 13.5 }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: 24, color: '#64748b' }}>
            Consultando recomendacion y resultado MCDA...
          </div>
        )}

        {!loading && (
          <>
            {mcdaPending && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 13.5, lineHeight: 1.6 }}>
                El backend aun no tiene ranking MCDA para esta evaluacion. Estado actual: <strong>{mcdaResult?.status}</strong>. Vuelve a procesamiento y espera que la saga llegue a EVALUACION_COMPLETADA.
              </div>
            )}

            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '24px 28px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sprout style={{ width: 18, height: 18, color: '#16a34a' }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Estado de recomendacion backend</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Consulta real a /recomendacion-final y /recomendaciones</div>
                </div>
              </div>
              <div style={{ background: '#fafafa', borderRadius: 12, padding: '18px 20px', border: '1px solid #f1f5f9' }}>
                {backendRecommendation ? (
                  <>
                    <p style={{ fontSize: 14.5, color: '#334155', lineHeight: 1.75, margin: 0, marginBottom: 10 }}>
                      <strong>{normalizeBackendText(backendRecommendation.title)}</strong>
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ background: '#f0fdf4', color: '#15803d', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>Estado: {backendRecommendation.status}</div>
                      <div style={{ background: '#ecfeff', color: '#0891b2', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>Proveedor: {backendRecommendation.provider}</div>
                      <div style={{ background: '#faf5ff', color: '#7c3aed', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>Evidencias: {backendRecommendation.evidence.length}</div>
                      <div style={{ background: '#f0fdf4', color: '#15803d', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>Secciones: {backendSections.length}</div>
                      <div style={{ background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>Recomendaciones: {allRecommendations.length}</div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#d97706', fontWeight: 800, marginBottom: 6 }}>
                        {noRecommendableCrops ? 'Sin recomendacion por criterio backend' : pollLimitReached ? 'Tiempo de espera agotado' : 'Generando recomendacion en backend'}
                      </div>
                      <p style={{ fontSize: 14.5, color: '#334155', lineHeight: 1.75, margin: 0 }}>
                        {noRecommendableCrops
                          ? 'El backend completo MCDA, pero todos los cultivos candidatos quedaron como NO_VIABLE o NO_CONCLUYENTE. Por diseno, VIA solo genera recomendaciones para cultivos VIABLE o CONDICIONAL.'
                          : pollLimitReached
                          ? 'La recomendacion aun no aparece despues de varios intentos. Puede seguir procesandose en Render; usa Reconsultar para validar nuevamente.'
                          : `${normalizeBackendText(pendingDetail ?? 'La recomendacion aun no esta disponible en el backend.')} La evaluacion ya tiene MCDA, pero la recomendacion puede tardar algunos minutos en persistirse.`}
                      </p>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                        {noRecommendableCrops ? 'No se reconsulta automaticamente porque el backend no emitira recomendacion para esta evaluacion.' : shouldAutoPoll ? `Reconsulta automatica activa cada 15 s. Intento ${pollAttempts + 1} de ${RECOMMENDATION_POLL_MAX_ATTEMPTS}.` : 'Reconsulta automatica pausada.'}
                        {lastPolledAt ? ` Ultima consulta: ${lastPolledAt.toLocaleTimeString()}.` : ''}
                      </div>
                    </div>
                    {noRecommendableCrops ? (
                      <button
                        onClick={() => navigate('results')}
                        style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                      >
                        Ver ranking MCDA
                      </button>
                    ) : (
                      <button
                        onClick={refreshRecommendation}
                        disabled={refreshing}
                        style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: refreshing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0, opacity: refreshing ? 0.7 : 1 }}
                      >
                        <RefreshCcw style={{ width: 14, height: 14 }} />
                        {refreshing ? 'Consultando...' : 'Reconsultar'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {noRecommendableCrops && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 22px', marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Candidatos evaluados por MCDA</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                  {sortResults(mcdaResult?.results ?? []).map((crop) => (
                    <div key={crop.cropId} style={{ background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{getCropLabel(crop.cropId)}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: 11.5, fontWeight: 800, padding: '4px 9px', borderRadius: 20 }}>{crop.viabilityCategory}</span>
                        <span style={{ background: '#f8fafc', color: '#475569', fontSize: 11.5, fontWeight: 700, padding: '4px 9px', borderRadius: 20 }}>Score {toPercent(crop.score)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {backendSections.length > 0 && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #bbf7d0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bbf7d0' }}>
                    <CheckCircle2 style={{ width: 17, height: 17, color: '#16a34a' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Recomendacion generada por backend</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Texto persistido desde /evaluaciones/:id/recomendacion-final</div>
                  </div>
                </div>
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {backendSections.map((section) => (
                    <section key={`${section.sectionType}-${section.title}`} style={{ background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: 12, padding: '16px 18px' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>{normalizeBackendText(section.title)}</div>
                      <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.75, margin: 0, whiteSpace: 'pre-wrap' }}>
                        {normalizeBackendText(section.content)}
                      </p>
                    </section>
                  ))}
                </div>
              </div>
            )}

            {allRecommendations.length > 0 && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 22px', marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Recomendaciones persistidas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {allRecommendations.map((item) => (
                    <div key={item.recommendationId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: 10, padding: '10px 12px' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{normalizeBackendText(item.title)}</div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{getCropLabel(item.cropId)} - {item.provider}</div>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(item.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gapRecommendations.length > 0 && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 22px', marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Recomendaciones priorizadas por brecha</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                  {gapRecommendations.slice(0, 5).map((item, index) => {
                    const recommendationText = String(item.recommendation ?? item.mapping_validation_note ?? 'Recomendacion pendiente de evidencia suficiente.');
                    const criterion = String(item.criterion_label ?? item.criterion_name ?? item.gap_key ?? `Brecha ${index + 1}`);
                    const confidence = item.confidence ? String(item.confidence) : 'sin confianza';
                    return (
                      <div key={`${criterion}-${index}`} style={{ background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: 12, padding: '14px 16px' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{normalizeBackendText(criterion)}</div>
                        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, margin: 0 }}>{normalizeBackendText(recommendationText)}</p>
                        <div style={{ display: 'inline-flex', marginTop: 10, background: '#ecfeff', color: '#0891b2', fontSize: 11, fontWeight: 800, padding: '4px 9px', borderRadius: 20 }}>
                          Confianza: {confidence}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {derivedActions.map(({ title, items }) => (
                <div key={title} style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                  <div style={{ background: '#f0fdf4', borderBottom: '1.5px solid #bbf7d0', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bbf7d0' }}>
                      <CheckCircle2 style={{ width: 16, height: 16, color: '#16a34a' }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{title}</div>
                  </div>
                  <div style={{ padding: '16px 20px' }}>
                    {items.map((item) => (
                      <div key={item} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                        <CheckCircle2 style={{ width: 14, height: 14, color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '22px 28px', marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Trazabilidad</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                La recomendacion, sus secciones y evidencias provienen de los endpoints desplegados de Render. Las brechas MCDA se muestran como sustento tecnico complementario.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                {(backendRecommendation?.evidence ?? []).map(({ fragmentId, sourceFilename, text, score: evidenceScore }) => (
                  <div key={fragmentId} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#faf5ff', border: '1px solid #ede9fe', borderRadius: 10, padding: '8px 14px', maxWidth: 360 }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7c3aed', marginBottom: 1 }}>{sourceFilename ?? 'Fragmento RAG'}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.45 }}>
                        {text ? `${text.slice(0, 120)}${text.length > 120 ? '...' : ''}` : fragmentId.slice(0, 8)}
                        {typeof evidenceScore === 'number' ? ` - score ${evidenceScore.toFixed(2)}` : ''}
                      </div>
                    </div>
                    <ExternalLink style={{ width: 12, height: 12, color: '#7c3aed', flexShrink: 0, marginLeft: 6 }} />
                  </div>
                ))}
                {!backendRecommendation?.evidence.length && (
                  <div style={{ fontSize: 13, color: '#64748b' }}>Sin evidencias RAG disponibles todavia.</div>
                )}
              </div>
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Brechas MCDA que sustentan la orientacion temporal:</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(topCrop?.gaps ?? []).slice(0, 5).map((gap) => (
                    <div key={`${gap.criterionId}-${gap.phaseId}`} style={{ background: '#fef3c7', color: '#d97706', fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20 }}>
                      {gap.criterionId}: brecha {formatNumber(gap.gapValue)}
                    </div>
                  ))}
                  {(!topCrop || topCrop.gaps.length === 0) && (
                    <div style={{ fontSize: 13, color: '#64748b' }}>Sin brechas disponibles.</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 14, padding: '14px 20px', display: 'flex', gap: 12 }}>
              <AlertTriangle style={{ width: 18, height: 18, color: '#d97706', flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>Aviso importante</div>
                <p style={{ fontSize: 13, color: '#78350f', margin: 0, lineHeight: 1.65 }}>
                  Esta salida es orientativa. El texto principal ya viene del backend; las acciones derivadas localmente solo ayudan a interpretar las brechas MCDA mientras se consolida la evidencia documental.
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
