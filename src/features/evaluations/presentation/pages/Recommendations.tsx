import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft, RefreshCcw, Sprout } from 'lucide-react';
import { NavigateFn } from '@/app/navigation/navigation';
import { toUserFriendlyFailureReason } from '@/features/evaluations/application/backendFailureMessages';
import { getCropLabel } from '@/features/evaluations/application/cropCatalog';
import { formatBackendStatus, formatCriterionLabel, formatNumberWithUnit, formatPhaseLabel } from '@/features/evaluations/application/displayFormatters';
import { hasRecommendableCrop, isEvaluationPending } from '@/features/evaluations/application/evaluationStatus';
import {
  CropEvaluationResult,
  EvaluationRecommendation,
  EvaluationMcdaResult,
  FinalRecommendationResult,
} from '@/features/evaluations/domain/evaluation';
import { EvaluationApiRepository } from '@/features/evaluations/infrastructure/api/evaluationApiRepository';
import { readCurrentEvaluation, readSelectedCropId } from '@/features/evaluations/infrastructure/session/currentEvaluationStorage';
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

function humanizeProvider(provider: string): string {
  const map: Record<string, string> = {
    tavily_rag: 'Búsqueda web',
    openai_file_search: 'Búsqueda documental',
    openai: 'OpenAI',
    claude: 'Claude',
  };
  return map[provider] ?? provider;
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s,)]+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (/^https?:\/\//.test(part)) {
          try {
            const hostname = new URL(part).hostname;
            return (
              <a key={i} href={part} target="_blank" rel="noopener noreferrer"
                style={{ color: '#0891b2', textDecoration: 'underline', wordBreak: 'break-all' }}>
                {hostname}
              </a>
            );
          } catch {
            return <span key={i}>{part}</span>;
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function renderMarkdownContent(text: string) {
  const lines = normalizeBackendText(text).split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((rawLine, i) => {
    const line = rawLine.trimEnd();

    if (/^# /.test(line)) {
      // Skip top-level title — shown as section/card header
      return;
    }
    if (/^## /.test(line)) {
      elements.push(
        <div key={i} style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginTop: 18, marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #f1f5f9' }}>
          {line.replace(/^## /, '')}
        </div>
      );
      return;
    }
    if (/^### /.test(line)) {
      elements.push(
        <div key={i} style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginTop: 10, marginBottom: 4 }}>
          {line.replace(/^### /, '')}
        </div>
      );
      return;
    }
    if (/^\d+\.\s/.test(line)) {
      const content = line.replace(/^\d+\.\s/, '');
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 10, marginTop: 12, marginBottom: 2 }}>
          <span style={{ color: '#16a34a', fontWeight: 800, fontSize: 14, flexShrink: 0, marginTop: 1 }}>→</span>
          <span style={{ fontSize: 13, color: '#0f172a', lineHeight: 1.65, fontWeight: 600 }}>
            {renderInline(content)}
          </span>
        </div>
      );
      return;
    }
    if (/^- /.test(line)) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, marginTop: 4, paddingLeft: 4 }}>
          <span style={{ color: '#94a3b8', flexShrink: 0 }}>•</span>
          <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.65 }}>
            {renderInline(line.replace(/^- /, ''))}
          </span>
        </div>
      );
      return;
    }
    if (line === '') return;

    elements.push(
      <p key={i} style={{ fontSize: 13, color: '#475569', lineHeight: 1.75, margin: '4px 0' }}>
        {renderInline(line)}
      </p>
    );
  });

  return <>{elements}</>;
}

function buildDerivedActions(crop: CropEvaluationResult | null) {
  if (!crop) return [];

  const factors = crop.limitingFactors.slice(0, 4);
  if (factors.length === 0) {
    return [
      {
        title: 'Revision en campo',
        items: [
          `Validar en campo la viabilidad reportada para ${getCropLabel(crop.cropId)}.`,
          'Contrastar el resultado con disponibilidad hidrica, acceso y manejo local.',
        ],
      },
    ];
  }

  return [
    {
      title: 'Factores a atender',
      items: factors.map((factor) => (
        `Revisar ${formatCriterionLabel(factor)} en fase ${formatPhaseLabel(factor)}: valor observado ${formatNumberWithUnit(factor.observedValue, factor.unit)} frente a limite ${formatNumberWithUnit(factor.optimalLimit, factor.unit)}.`
      )),
    },
    {
      title: 'Validacion en campo',
      items: [
        'Priorizar verificacion de los factores con menor membresia.',
        'Registrar evidencia local antes de convertir esta orientacion en plan de manejo.',
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
      requestErrors.push(readErrorMessage(finalRecommendationResult.reason, 'No se pudo consultar la recomendacion.'));
    }

    if (recommendationsResult.status === 'fulfilled') {
      setAllRecommendations(recommendationsResult.value);
      hasRecommendation = hasRecommendation || recommendationsResult.value.length > 0;
    } else {
      requestErrors.push(readErrorMessage(recommendationsResult.reason, 'No se pudo consultar las recomendaciones.'));
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
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la recomendacion.');
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
            setError(mcdaResultPromise.reason instanceof Error ? mcdaResultPromise.reason.message : 'No se pudo consultar el resultado de viabilidad.');
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
    return () => { cancelled = true; };
  }, [currentEvaluation]);

  const selectedCropId = useMemo(() => readSelectedCropId(), []);
  const topCrop = useMemo(() => {
    const results = sortResults(mcdaResult?.results ?? []);
    return results.find((result) => result.cropId === selectedCropId) ?? results[0] ?? null;
  }, [mcdaResult, selectedCropId]);
  const derivedActions = useMemo(() => buildDerivedActions(topCrop), [topCrop]);
  const score = toPercent(topCrop?.score ?? null);
  const cropLabel = topCrop ? getCropLabel(topCrop.cropId) : '-';
  const finalRecommendation = recommendation?.status === 'available' ? recommendation.recommendation : null;
  const selectedRecommendation = allRecommendations.find((item) => item.cropId === topCrop?.cropId) ?? null;
  const listRecommendation = selectedRecommendation ?? allRecommendations.at(-1) ?? null;
  const backendRecommendation = (finalRecommendation?.cropId === topCrop?.cropId ? finalRecommendation : null) ?? listRecommendation ?? finalRecommendation;
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
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: 6 }}>Recomendaciones agronomicas</h1>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Cultivo: {cropLabel}</div>
              <div style={{ height: 14, width: 1, background: '#e2e8f0' }} />
              <div style={{ fontSize: 13, color: '#64748b' }}>Parcela: <strong>{currentEvaluation?.parcelName ?? '-'}</strong></div>
              <div style={{ height: 14, width: 1, background: '#e2e8f0' }} />
              <div style={{ background: '#dcfce7', color: '#16a34a', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 999 }}>Score: {score}%</div>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        {loading && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: 24, color: '#64748b' }}>
            Preparando recomendacion...
          </div>
        )}

        {!loading && (
          <>
            {mcdaPending && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 12, padding: 16, marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
                El analisis de viabilidad aun no esta disponible. Estado actual: <strong>{formatBackendStatus(mcdaResult?.status)}</strong>. Vuelve a la pantalla de procesamiento y espera que el analisis se complete.
              </div>
            )}

            {/* Estado de recomendacion */}
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '24px 28px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sprout style={{ width: 18, height: 18, color: '#16a34a' }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Estado de la recomendacion</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Generada con inteligencia artificial a partir de fuentes agronomicas</div>
                </div>
              </div>
              <div style={{ background: '#fafafa', borderRadius: 12, padding: '18px 20px', border: '1px solid #f1f5f9' }}>
                {backendRecommendation ? (
                  <>
                    <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.75, margin: 0, marginBottom: 10 }}>
                      <strong>{normalizeBackendText(backendRecommendation.title)}</strong>
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ background: '#f0fdf4', color: '#15803d', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999 }}>
                        {formatBackendStatus(backendRecommendation.status)}
                      </div>
                      <div style={{ background: '#ecfeff', color: '#0891b2', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999 }}>
                        Fuente: {humanizeProvider(backendRecommendation.provider)}
                      </div>
                      <div style={{ background: '#faf5ff', color: '#7c3aed', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 999 }}>
                        {backendRecommendation.evidence.length} fuentes consultadas
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#d97706', fontWeight: 800, marginBottom: 6 }}>
                        {noRecommendableCrops ? 'Cultivos no elegibles para recomendacion' : pollLimitReached ? 'Tiempo de espera agotado' : 'Preparando recomendacion...'}
                      </div>
                      <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.75, margin: 0 }}>
                        {noRecommendableCrops
                          ? 'Se completo el analisis de viabilidad, pero todos los cultivos quedaron como NO_VIABLE o NO_CONCLUYENTE. Solo se generan recomendaciones para cultivos VIABLE o CONDICIONAL.'
                          : pollLimitReached
                          ? 'La recomendacion aun no esta disponible. Puede estar procesandose; usa Actualizar para verificar nuevamente.'
                          : `${normalizeBackendText(pendingDetail ?? 'La recomendacion se esta preparando.')} Puede tardar algunos minutos.`}
                      </p>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                        {noRecommendableCrops
                          ? 'No se generaran recomendaciones para esta evaluacion.'
                          : shouldAutoPoll
                          ? `Verificando disponibilidad automaticamente. Intento ${pollAttempts + 1} de ${RECOMMENDATION_POLL_MAX_ATTEMPTS}.`
                          : 'Verificacion automatica pausada.'}
                        {lastPolledAt ? ` Ultima consulta: ${lastPolledAt.toLocaleTimeString()}.` : ''}
                      </div>
                    </div>
                    {noRecommendableCrops ? (
                      <button
                        onClick={() => navigate('results')}
                        style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                      >
                        Ver ranking
                      </button>
                    ) : (
                      <button
                        onClick={refreshRecommendation}
                        disabled={refreshing}
                        style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '9px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: refreshing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0, opacity: refreshing ? 0.7 : 1 }}
                      >
                        <RefreshCcw style={{ width: 14, height: 14 }} />
                        {refreshing ? 'Consultando...' : 'Actualizar'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {noRecommendableCrops && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 22px', marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Cultivos evaluados</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                  {sortResults(mcdaResult?.results ?? []).map((crop) => (
                    <div key={crop.cropId} style={{ background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{getCropLabel(crop.cropId)}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 800, padding: '4px 9px', borderRadius: 999 }}>{formatBackendStatus(crop.viabilityCategory)}</span>
                        <span style={{ background: '#f8fafc', color: '#475569', fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 999 }}>Score {toPercent(crop.score)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendacion principal */}
            {backendSections.length > 0 && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #bbf7d0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden', marginBottom: 20 }}>
                <div style={{ background: '#f0fdf4', borderBottom: '1px solid #bbf7d0', padding: '16px 22px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bbf7d0' }}>
                    <CheckCircle2 style={{ width: 17, height: 17, color: '#16a34a' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{cropLabel}</div>
                    {backendRecommendation?.createdAt && (
                      <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        {new Date(backendRecommendation.createdAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {backendSections.map((section) => (
                    <div key={`${section.sectionType}-${section.title}`} style={{ background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: 12, padding: '16px 18px' }}>
                      {section.title && !section.title.startsWith('#') && (
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
                          {normalizeBackendText(section.title)}
                        </div>
                      )}
                      {renderMarkdownContent(section.content)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recomendaciones por brecha */}
            {gapRecommendations.length > 0 && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 22px', marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Recomendaciones priorizadas por brecha</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                  {gapRecommendations.slice(0, 5).map((item, index) => {
                    const recommendationText = String(item.recommendation ?? item.mapping_validation_note ?? 'Recomendacion pendiente de evidencia suficiente.');
                    const criterion = String(item.criterion_label ?? item.criterion_name ?? item.gap_key ?? `Brecha ${index + 1}`);
                    const confidence = item.confidence ? String(item.confidence) : 'sin confianza';
                    return (
                      <div key={`${criterion}-${index}`} style={{ background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: 12, padding: '14px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{normalizeBackendText(criterion)}</div>
                        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, margin: 0 }}>{normalizeBackendText(recommendationText)}</p>
                        <div style={{ display: 'inline-flex', marginTop: 10, background: '#ecfeff', color: '#0891b2', fontSize: 11, fontWeight: 800, padding: '4px 9px', borderRadius: 999 }}>
                          Confianza: {confidence}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Factores a atender */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {derivedActions.map(({ title, items }) => (
                <div key={title} style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                  <div style={{ background: '#f0fdf4', borderBottom: '1.5px solid #bbf7d0', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #bbf7d0' }}>
                      <CheckCircle2 style={{ width: 16, height: 16, color: '#16a34a' }} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{title}</div>
                  </div>
                  <div style={{ padding: '16px 20px' }}>
                    {items.map((item) => (
                      <div key={item} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                        <CheckCircle2 style={{ width: 14, height: 14, color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
