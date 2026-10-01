import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { NavigateFn } from '@/app/navigation/navigation';
import { toUserFriendlyFailureReason } from '@/features/evaluations/application/backendFailureMessages';
import { getCropLabel } from '@/features/evaluations/application/cropCatalog';
import { formatBackendStatus, formatSuitability } from '@/features/evaluations/application/displayFormatters';
import { hasRecommendableCrop, isEvaluationPending } from '@/features/evaluations/application/evaluationStatus';
import {
  CropEvaluationResult,
  EvaluationRecommendation,
  EvaluationMcdaResult,
} from '@/features/evaluations/domain/evaluation';
import { EvaluationApiRepository } from '@/features/evaluations/infrastructure/api/evaluationApiRepository';
import { readCurrentEvaluation, readSelectedCropId } from '@/features/evaluations/infrastructure/session/currentEvaluationStorage';
import Sidebar from '@/shared/presentation/layouts/Sidebar';

interface Props { navigate: NavigateFn; }

const evaluationRepository = new EvaluationApiRepository();
const RECOMMENDATION_POLL_INTERVAL_MS = 15000;
const RECOMMENDATION_POLL_MAX_ATTEMPTS = 24;

function sortResults(results: CropEvaluationResult[]): CropEvaluationResult[] {
  return [...results].sort((a, b) => {
    const aRanked = a.rankPosition !== null;
    const bRanked = b.rankPosition !== null;
    if (aRanked && bRanked) return Number(a.rankPosition) - Number(b.rankPosition);
    if (aRanked !== bRanked) return aRanked ? -1 : 1;
    return 0;
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

// La escala interna del backend (alta/media/baja) se presenta como nivel de
// respaldo documental: mide cuan directa es la evidencia, no cuan buena es la
// recomendacion. Color semantico para que el nivel se lea de un vistazo.
function supportLevel(confidence: string | null): { label: string; bg: string; color: string } {
  switch ((confidence ?? '').toLowerCase()) {
    case 'alta':
      return { label: 'directo', bg: '#f0fdf4', color: '#15803d' };
    case 'media':
      return { label: 'parcial', bg: '#fffbeb', color: '#b45309' };
    case 'baja':
      return { label: 'indirecto', bg: '#f1f5f9', color: '#64748b' };
    default:
      return { label: 'sin evidencia', bg: '#f1f5f9', color: '#94a3b8' };
  }
}

function isReadyRecommendation(item: EvaluationRecommendation | null): boolean {
  return item?.status === 'succeeded' && item.sections.length > 0;
}

function isRecommendationInProgress(item: EvaluationRecommendation | null): boolean {
  const status = item?.status?.toLowerCase();
  return ['queued', 'pending', 'preparing', 'running', 'processing', 'generating', 'in_progress', 'in-progress'].includes(status ?? '');
}

function AnimatedDots({ color = 'currentColor' }: { color?: string }) {
  return (
    <span aria-hidden="true" style={{ display: 'inline-flex', gap: 2, marginLeft: 3 }}>
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          style={{
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: color,
            animation: 'recommendation-dot 1.2s ease-in-out infinite',
            animationDelay: `${dot * 0.16}s`,
          }}
        />
      ))}
    </span>
  );
}

function mergeRecommendations(
  current: EvaluationRecommendation[],
  incoming: EvaluationRecommendation[],
): EvaluationRecommendation[] {
  const byCrop = new Map(current.map((item) => [`${item.cropId}:${item.waterRegime}`, item]));
  incoming.forEach((item) => byCrop.set(`${item.cropId}:${item.waterRegime}`, item));
  return Array.from(byCrop.values());
}

function latestReadyRecommendation(items: EvaluationRecommendation[]): EvaluationRecommendation | null {
  return items
    .filter((item) => isReadyRecommendation(item))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .at(-1) ?? null;
}

function formatCitationPages(source: EvaluationRecommendation['evidence'][number]): string {
  if (source.pageStart && source.pageEnd && source.pageStart !== source.pageEnd) {
    return `pp. ${source.pageStart}–${source.pageEnd}`;
  }
  if (source.pageStart) return `p. ${source.pageStart}`;
  return '';
}

function formatCitationLabel(source: EvaluationRecommendation['evidence'][number], fallback: string): string {
  const label = [source.organization, source.title].filter(Boolean).join(' · ');
  const pages = formatCitationPages(source);
  return [label || fallback, pages].filter(Boolean).join(' · ');
}

function renderInline(text: string, evidence: EvaluationRecommendation['evidence'] = []) {
  const citations = new Map(evidence.map((source) => [source.fragmentId, source]));
  const cleanCitationBrackets = text.replace(/\[\s*(SOURCE_\d+(?:\s*,\s*SOURCE_\d+)*)\s*\]/g, '$1');
  const parts = cleanCitationBrackets.split(/(\*\*[^*]+\*\*|https?:\/\/[^\s,)]+|SOURCE_\d+)/g);
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
        if (/^SOURCE_\d+$/.test(part)) {
          const source = citations.get(part);
          if (!source) return <span key={i}>{part}</span>;
          const label = formatCitationLabel(source, part);
          return (
            <span
              key={i}
              title={`Fuente de respaldo: ${label}`}
              style={{ display: 'inline-flex', alignItems: 'center', background: '#ecfeff', color: '#0e7490', border: '1px solid #a5f3fc', borderRadius: 999, padding: '2px 7px', fontSize: 11, fontWeight: 700, lineHeight: 1.35, verticalAlign: 'middle' }}
            >
              {label}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

function renderMarkdownContent(text: string, evidence: EvaluationRecommendation['evidence'] = []) {
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
            {renderInline(content, evidence)}
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
            {renderInline(line.replace(/^- /, ''), evidence)}
          </span>
        </div>
      );
      return;
    }
    if (line === '') return;

    elements.push(
      <p key={i} style={{ fontSize: 13, color: '#475569', lineHeight: 1.75, margin: '4px 0' }}>
        {renderInline(line, evidence)}
      </p>
    );
  });

  return <>{elements}</>;
}

export default function Recommendations({ navigate }: Props) {
  const [currentEvaluation] = useState(() => readCurrentEvaluation());
  const [mcdaResult, setMcdaResult] = useState<EvaluationMcdaResult | null>(null);
  const [allRecommendations, setAllRecommendations] = useState<EvaluationRecommendation[]>([]);
  const [activeRecommendationCropId, setActiveRecommendationCropId] = useState<string | null>(null);
  const [startingCropIds, setStartingCropIds] = useState<Set<string>>(new Set());
  const [generationErrors, setGenerationErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);
  const [error, setError] = useState<string | null>(currentEvaluation ? null : 'No hay una evaluacion activa.');

  const fetchRecommendationSnapshot = async () => {
    if (!currentEvaluation) return false;

    const waterRegime = currentEvaluation.waterRegime ?? 'rainfed';
    const eligibleCropIds = (mcdaResult?.results ?? [])
      .filter((crop) => crop.calcCondition === 'succeeded')
      .map((crop) => crop.cropId);
    const recommendations = await evaluationRepository.getRecommendationsForCrops(
      currentEvaluation.evaluationId,
      eligibleCropIds,
      waterRegime,
    );
    setAllRecommendations(recommendations);

    return recommendations.some((item) => isReadyRecommendation(item));
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
        const result = await evaluationRepository.getMcdaResult(
          currentEvaluation.evaluationId,
          currentEvaluation.waterRegime ?? 'rainfed',
        );
        if (cancelled) return;

        setMcdaResult(result);
        setError(toUserFriendlyFailureReason(result.failureReason));
        // The ranking is enough to display the cards. Generation starts in the
        // background so each card can be updated as its own POST/GET cycle
        // finishes instead of waiting for every crop.
        setLoading(false);

        const eligibleCrops = result.results.filter((crop) => crop.calcCondition === 'succeeded');
        for (const crop of eligibleCrops) {
          if (cancelled) return;

          setStartingCropIds((current) => new Set(current).add(crop.cropId));
          try {
            const recommendation = await evaluationRepository.startRecommendationForCrop(
              currentEvaluation.evaluationId,
              crop.cropId,
              currentEvaluation.waterRegime ?? 'rainfed',
            );
            if (!cancelled && recommendation) {
              setAllRecommendations((current) => mergeRecommendations(current, [recommendation]));
            }
          } catch (err) {
            if (!cancelled) {
              setGenerationErrors((current) => ({
                ...current,
                [crop.cropId]: err instanceof Error ? err.message : 'No se pudo iniciar la recomendacion.',
              }));
            }
          } finally {
            if (!cancelled) {
              setStartingCropIds((current) => {
                const next = new Set(current);
                next.delete(crop.cropId);
                return next;
              });
            }
          }
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
  const sortedCrops = useMemo(() => sortResults(mcdaResult?.results ?? []), [mcdaResult]);
  const topCrop = useMemo(() => (
    sortedCrops.find((result) => result.cropId === selectedCropId) ?? sortedCrops[0] ?? null
  ), [selectedCropId, sortedCrops]);

  useEffect(() => {
    if (activeRecommendationCropId && sortedCrops.some((crop) => crop.cropId === activeRecommendationCropId)) return;
    if (topCrop) setActiveRecommendationCropId(topCrop.cropId);
  }, [activeRecommendationCropId, sortedCrops, topCrop]);

  const activeCrop = sortedCrops.find((crop) => crop.cropId === activeRecommendationCropId) ?? topCrop;
  const cropLabel = activeCrop ? getCropLabel(activeCrop.cropId) : '-';
  const selectedRun = allRecommendations.find((item) => item.cropId === activeCrop?.cropId) ?? null;
  const selectedRecommendation = isReadyRecommendation(selectedRun) ? selectedRun : null;
  const backendRecommendation = selectedRecommendation;
  const mcdaPending = isEvaluationPending(mcdaResult?.status);
  const hasMcdaResults = (mcdaResult?.results.length ?? 0) > 0;
  const noRecommendableCrops = Boolean(!mcdaPending && hasMcdaResults && !hasRecommendableCrop(mcdaResult?.results ?? []));
  const backendSections = backendRecommendation?.sections ?? [];
  const gapRecommendations = backendRecommendation?.gapRecommendations ?? [];
  const eligibleCropCount = sortedCrops.filter((crop) => crop.calcCondition === 'succeeded').length;
  const availableRecommendationCount = sortedCrops.filter(
    (crop) => crop.calcCondition === 'succeeded' && allRecommendations.some((item) => item.cropId === crop.cropId && isReadyRecommendation(item)),
  ).length;
  const pendingRecommendationCount = sortedCrops.filter((crop) => {
    if (crop.calcCondition !== 'succeeded') return false;
    const recommendation = allRecommendations.find((item) => item.cropId === crop.cropId) ?? null;
    return !isReadyRecommendation(recommendation)
      && !isRecommendationInProgress(recommendation)
      && !['failed', 'insufficient_evidence'].includes(recommendation?.status ?? '')
      && !generationErrors[crop.cropId];
  }).length;
  const inProgressRecommendationCount = sortedCrops.filter((crop) => {
    if (crop.calcCondition !== 'succeeded') return false;
    const recommendation = allRecommendations.find((item) => item.cropId === crop.cropId) ?? null;
    return startingCropIds.has(crop.cropId) || isRecommendationInProgress(recommendation);
  }).length;
  const shouldAutoPoll = Boolean(currentEvaluation && !loading && (pendingRecommendationCount > 0 || inProgressRecommendationCount > 0) && !mcdaPending && !noRecommendableCrops && pollAttempts < RECOMMENDATION_POLL_MAX_ATTEMPTS);

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
            <div style={{ fontSize: 13, color: '#64748b' }}>Parcela: <strong>{currentEvaluation?.parcelName ?? '-'}</strong></div>
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
                Los resultados de la evaluación aún no están disponibles. Estado actual: <strong>{formatBackendStatus(mcdaResult?.status)}</strong>. Vuelve a la pantalla de procesamiento y espera que el analisis se complete.
              </div>
            )}

            {sortedCrops.length > 0 && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 22px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Recomendaciones por cultivo</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                      {inProgressRecommendationCount > 0
                        ? 'Las recomendaciones se generan de forma independiente y se habilitan al estar listas.'
                        : 'Selecciona un cultivo para consultar su recomendacion especifica.'}
                    </div>
                  </div>
                  <div style={{ background: availableRecommendationCount === eligibleCropCount ? '#f0fdf4' : '#fffbeb', color: availableRecommendationCount === eligibleCropCount ? '#15803d' : '#b45309', fontSize: 11, fontWeight: 800, padding: '5px 9px', borderRadius: 999, whiteSpace: 'nowrap' }}>
                    {availableRecommendationCount}/{eligibleCropCount} listas
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                  {sortedCrops.map((crop) => {
                    const cropRun = allRecommendations.find((item) => item.cropId === crop.cropId) ?? null;
                    const cropRecommendation = isReadyRecommendation(cropRun) ? cropRun : null;
                    const isActive = activeCrop?.cropId === crop.cropId;
                    const isEligible = crop.calcCondition === 'succeeded';
                    const isStarting = startingCropIds.has(crop.cropId);
                    const isFailed = cropRun?.status === 'failed' || Boolean(generationErrors[crop.cropId]);
                    const hasInsufficientEvidence = cropRun?.status === 'insufficient_evidence';
                    const isGenerating = isStarting || isRecommendationInProgress(cropRun);
                    const recommendationState = !isEligible
                      ? 'ineligible'
                      : cropRecommendation
                      ? 'ready'
                      : isFailed
                      ? 'failed'
                      : hasInsufficientEvidence
                      ? 'insufficient'
                      : isGenerating
                      ? 'generating'
                      : 'queued';
                    const recommendationLabel = recommendationState === 'ineligible'
                      ? 'No elegible'
                      : recommendationState === 'ready'
                      ? 'Recomendacion lista'
                      : recommendationState === 'failed'
                      ? 'No se pudo generar'
                      : recommendationState === 'insufficient'
                      ? 'Sin evidencia suficiente'
                      : recommendationState === 'generating'
                      ? 'Generando'
                      : 'En cola';
                    const recommendationBadge = recommendationState === 'ready'
                      ? { background: '#ecfeff', color: '#0e7490' }
                      : recommendationState === 'failed'
                      ? { background: '#fef2f2', color: '#b91c1c' }
                      : recommendationState === 'insufficient'
                      ? { background: '#fff7ed', color: '#c2410c' }
                      : { background: '#fff7ed', color: '#c2410c' };
                    return (
                      <button
                        key={crop.cropId}
                        type="button"
                        onClick={() => cropRecommendation && setActiveRecommendationCropId(crop.cropId)}
                        disabled={!cropRecommendation}
                        aria-busy={recommendationState === 'generating' || recommendationState === 'queued'}
                        aria-label={`${getCropLabel(crop.cropId)}: ${recommendationLabel}`}
                        style={{ textAlign: 'left', background: isActive ? '#f0fdf4' : recommendationState === 'ready' ? '#fafafa' : '#f8fafc', border: isActive ? '1.5px solid #86efac' : recommendationState === 'ready' ? '1px solid #f1f5f9' : '1px solid #e2e8f0', borderRadius: 12, padding: '13px 14px', cursor: cropRecommendation ? 'pointer' : 'default', minHeight: 116, position: 'relative', overflow: 'hidden', transition: 'border-color 120ms ease, background 120ms ease' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 13, fontWeight: 800, color: recommendationState === 'ready' ? '#0f172a' : '#475569' }}>{getCropLabel(crop.cropId)}</span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>Aptitud {formatSuitability(crop.score)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ background: isEligible ? '#dcfce7' : '#fef2f2', color: isEligible ? '#15803d' : '#b91c1c', fontSize: 10, fontWeight: 800, padding: '4px 7px', borderRadius: 999 }}>
                            {formatBackendStatus(crop.calcCondition)}
                          </span>
                          <span style={{ ...recommendationBadge, fontSize: 10, fontWeight: 800, padding: '4px 7px', borderRadius: 999 }}>
                            {recommendationLabel}
                          </span>
                        </div>
                        {(recommendationState === 'generating' || recommendationState === 'queued') && (
                          <div
                            aria-live="polite"
                            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.82)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, pointerEvents: 'none' }}
                          >
                            <AnimatedDots color="white" />
                            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.01em' }}>
                              {recommendationState === 'generating' ? 'Generando recomendacion' : 'En cola'}
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {noRecommendableCrops && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 22px', marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Cultivos evaluados</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                  {sortResults(mcdaResult?.results ?? []).map((crop) => (
                    <div key={crop.cropId} style={{ background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: 12, padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{getCropLabel(crop.cropId)}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: 11, fontWeight: 800, padding: '4px 9px', borderRadius: 999 }}>{formatBackendStatus(crop.calcCondition)}</span>
                        <span style={{ background: '#f8fafc', color: '#475569', fontSize: 11, fontWeight: 700, padding: '4px 9px', borderRadius: 999 }}>Aptitud {formatSuitability(crop.score)}</span>
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
                      {renderMarkdownContent(section.content, backendRecommendation?.evidence ?? [])}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {backendRecommendation && backendRecommendation.evidence.length > 0 && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #bae6fd', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '20px 22px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: '#ecfeff', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 800 }}>i</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Fuentes consultadas</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Documentos que respaldan la orientación presentada.</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10, marginTop: 14 }}>
                  {backendRecommendation.evidence.map((source, index) => {
                    const pages = formatCitationPages(source);
                    const title = source.title ?? source.sourceFilename ?? `Fuente documental ${index + 1}`;
                    return (
                      <div key={source.fragmentId} style={{ background: '#f8fafc', border: '1px solid #e0f2fe', borderRadius: 12, padding: '13px 15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 7 }}>
                          <span style={{ background: '#cffafe', color: '#0e7490', fontSize: 10, fontWeight: 800, padding: '4px 8px', borderRadius: 999 }}>{source.organization ?? 'Documento técnico'}</span>
                          <span style={{ color: '#64748b', fontSize: 11, fontWeight: 700 }}>Fuente {index + 1}</span>
                        </div>
                        <div style={{ color: '#0f172a', fontSize: 13, fontWeight: 800, lineHeight: 1.45 }}>{normalizeBackendText(title)}</div>
                        {pages && <div style={{ color: '#64748b', fontSize: 11, marginTop: 6 }}>{pages}</div>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recomendaciones por brecha */}
            {gapRecommendations.length > 0 && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 22px', marginBottom: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Acciones recomendadas por limitación</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                  {gapRecommendations.slice(0, 5).map((item, index) => {
                    const recommendationText = String(item.recommendation ?? item.mapping_validation_note ?? 'Recomendacion pendiente de evidencia suficiente.');
                    const criterion = String(item.criterion_label ?? item.criterion_name ?? item.gap_key ?? `Brecha ${index + 1}`);
                    const support = supportLevel(item.confidence ? String(item.confidence) : null);
                    return (
                      <div key={`${criterion}-${index}`} style={{ background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: 12, padding: '14px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>{normalizeBackendText(criterion)}</div>
                        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.65, margin: 0 }}>{normalizeBackendText(recommendationText)}</p>
                        <div title="Cuan directa es la evidencia en las fuentes consultadas para esta recomendacion." style={{ display: 'inline-flex', marginTop: 10, background: support.bg, color: support.color, fontSize: 11, fontWeight: 800, padding: '4px 9px', borderRadius: 999 }}>
                          Respaldo documental: {support.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </>
        )}
        <style>{`@keyframes recommendation-dot { 0%, 60%, 100% { opacity: .25; transform: translateY(0); } 30% { opacity: 1; transform: translateY(-2px); } }`}</style>
      </main>
    </div>
  );
}
