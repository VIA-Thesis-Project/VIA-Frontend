import { useEffect, useState } from 'react';
import { CheckCircle2, ChevronRight, Circle, Loader2, XCircle } from 'lucide-react';
import Sidebar from '@/shared/presentation/layouts/Sidebar';
import { NavigateFn } from '@/app/navigation/navigation';
import { isNoRankedCropFailure, toUserFriendlyFailureReason } from '@/features/evaluations/application/backendFailureMessages';
import { formatBackendStatus } from '@/features/evaluations/application/displayFormatters';
import { EvaluationMcdaResult, EvaluationStatusSnapshot } from '@/features/evaluations/domain/evaluation';
import { hasRecommendableCrop, isEvaluationFailed, isMcdaReadyStatus, isRecommendationReadyStatus } from '@/features/evaluations/application/evaluationStatus';
import { EvaluationApiRepository } from '@/features/evaluations/infrastructure/api/evaluationApiRepository';
import { readCurrentEvaluation } from '@/features/evaluations/infrastructure/session/currentEvaluationStorage';

interface Props { navigate: NavigateFn; }

const evaluationRepository = new EvaluationApiRepository();
const processingSteps = [
  { id: 1, label: 'Evaluacion iniciada', sub: 'La evaluacion fue registrada correctamente' },
  { id: 2, label: 'Extraccion agroambiental', sub: 'Se analizan los datos climaticos y de suelo de tu parcela' },
  { id: 3, label: 'Evaluacion MCDA', sub: 'Se calcula la viabilidad de cada cultivo y se identifican las brechas' },
  { id: 4, label: 'Recomendacion', sub: 'Se genera la recomendacion agronomica para los cultivos viables' },
];
const stepByStatus: Record<string, number> = {
  INICIADA: 1,
  EXTRACCION_COMPLETADA: 2,
  EVALUACION_COMPLETADA: processingSteps.length - 1,
  RECOMENDACION_COMPLETADA: processingSteps.length - 1,
};

function inferFailureStep(snapshot: EvaluationStatusSnapshot | null): number {
  const text = `${snapshot?.currentPhase ?? ''} ${snapshot?.failureReason ?? ''}`.toLowerCase();
  if (text.includes('extraccion') || text.includes('extraction') || text.includes('gee') || text.includes('agroenv')) {
    return 1;
  }
  if (text.includes('recomend') || text.includes('llm') || text.includes('openai') || text.includes('rag')) {
    return 3;
  }
  if (text.includes('evaluacion') || text.includes('mcda') || text.includes('rulebook')) {
    return 2;
  }
  return 0;
}

export default function Processing({ navigate }: Props) {
  const [currentEvaluation] = useState(() => readCurrentEvaluation());
  const [status, setStatus] = useState<EvaluationStatusSnapshot | null>(null);
  const [mcdaResult, setMcdaResult] = useState<EvaluationMcdaResult | null>(null);
  const [error, setError] = useState<string | null>(currentEvaluation ? null : 'No hay una evaluacion activa. Inicia una nueva evaluacion.');

  useEffect(() => {
    if (!currentEvaluation) return undefined;

    let cancelled = false;
    let timeoutId: number | undefined;

    const scheduleNextFetch = (nextStatus: string) => {
      if (cancelled || isEvaluationFailed(nextStatus) || isRecommendationReadyStatus(nextStatus)) return;
      const delayMs = isMcdaReadyStatus(nextStatus) ? 10000 : 3000;
      timeoutId = window.setTimeout(() => void fetchStatus(), delayMs);
    };

    const fetchStatus = async () => {
      try {
        const snapshot = await evaluationRepository.getEvaluationStatus(currentEvaluation.evaluationId);
        if (cancelled) return;
        setStatus(snapshot);
        setError(toUserFriendlyFailureReason(snapshot.failureReason));
        scheduleNextFetch(snapshot.status);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo consultar el estado de la evaluacion.');
          timeoutId = window.setTimeout(() => void fetchStatus(), 5000);
        }
      }
    };

    void fetchStatus();
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [currentEvaluation]);

  useEffect(() => {
    if (!currentEvaluation || !isMcdaReadyStatus(status?.status) || mcdaResult) return undefined;

    let cancelled = false;
    const fetchMcdaResult = async () => {
      try {
        const result = await evaluationRepository.getMcdaResult(currentEvaluation.evaluationId);
        if (!cancelled) setMcdaResult(result);
      } catch {
        if (!cancelled) setMcdaResult(null);
      }
    };

    void fetchMcdaResult();
    return () => {
      cancelled = true;
    };
  }, [currentEvaluation, status?.status, mcdaResult]);

  const currentStep = status ? stepByStatus[status.status] ?? 1 : 0;
  const done = isMcdaReadyStatus(status?.status);
  const recommendationDone = isRecommendationReadyStatus(status?.status);
  const failed = isEvaluationFailed(status?.status);
  const failedStep = failed ? inferFailureStep(status) : null;
  const visualStep = failedStep ?? currentStep;
  const noRecommendableCrops = Boolean(done && mcdaResult && mcdaResult.results.length > 0 && !hasRecommendableCrop(mcdaResult.results));
  const noRankedCropFailure = isNoRankedCropFailure(status?.failureReason);
  const progress = failed ? Math.round((visualStep / (processingSteps.length - 1)) * 100) : done ? 100 : Math.round((currentStep / (processingSteps.length - 1)) * 100);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="new-evaluation" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, padding: '32px', minWidth: 0 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <div style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }} onClick={() => navigate('dashboard')}>Dashboard</div>
            <span style={{ color: '#e2e8f0' }}>/</span>
            <div style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }} onClick={() => navigate('new-evaluation')}>Nueva evaluacion</div>
            <span style={{ color: '#e2e8f0' }}>/</span>
            <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Procesamiento</div>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', margin: 0 }}>Procesamiento de variables agroambientales</h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Parcela: <strong style={{ color: '#0f172a' }}>{currentEvaluation?.parcelName ?? 'Sin parcela activa'}</strong>
            {' '}· {currentEvaluation?.parcelLocation ?? '-'} · {currentEvaluation?.areaHa ?? '-'} ha
          </p>
          {status && (
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Estado: <strong>{formatBackendStatus(status.status)}</strong> · Evaluacion: {status.evaluationId}
            </p>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
          <div>
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 20 }}>Progreso del analisis</div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Progreso general</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: failed ? '#dc2626' : '#16a34a' }}>{failed ? 'Error' : `${progress}%`}</span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${failed ? 100 : progress}%`, background: failed ? '#dc2626' : 'linear-gradient(90deg, #16a34a, #0891b2)', borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {processingSteps.map((step, i) => {
                  const failedHere = failed && i === visualStep;
                  const completed = failed ? i < visualStep : recommendationDone || i < currentStep;
                  const active = !failed && !noRecommendableCrops && ((done && !recommendationDone && i === processingSteps.length - 1) || (!done && i === currentStep));
                  const iconBg = failedHere ? '#fee2e2' : completed ? '#f0fdf4' : active ? '#ecfeff' : '#f8fafc';
                  const iconBorder = failedHere ? '#dc2626' : completed ? '#16a34a' : active ? '#0891b2' : '#e2e8f0';
                  const labelColor = failedHere ? '#dc2626' : completed ? '#15803d' : active ? '#0891b2' : '#94a3b8';
                  return (
                    <div key={step.id} style={{ display: 'flex', gap: 14 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: iconBg,
                          border: `2px solid ${iconBorder}`,
                        }}>
                          {failedHere ? <XCircle style={{ width: 16, height: 16, color: '#dc2626' }} /> : completed ? <CheckCircle2 style={{ width: 16, height: 16, color: '#16a34a' }} /> : active ? <Loader2 style={{ width: 16, height: 16, color: '#0891b2', animation: 'spin 1s linear infinite' }} /> : <Circle style={{ width: 16, height: 16, color: '#cbd5e1' }} />}
                        </div>
                        {i < processingSteps.length - 1 && <div style={{ width: 2, height: 32, background: completed ? '#bbf7d0' : '#f1f5f9', margin: '3px 0' }} />}
                      </div>
                      <div style={{ paddingBottom: i < processingSteps.length - 1 ? 16 : 0, paddingTop: 5 }}>
                        <div style={{ fontSize: 13, fontWeight: completed || active || failedHere ? 600 : 400, color: labelColor }}>{step.label}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{step.sub}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Detalle del proceso</div>
              <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 18 }}>
                Informacion sobre el estado actual del analisis de tu parcela.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {[
                  { label: 'Evaluacion', value: currentEvaluation?.evaluationId ?? '-' },
                  { label: 'Estado', value: status?.status ? formatBackendStatus(status.status) : 'Consultando...' },
                  { label: 'Fase actual', value: status?.currentPhase ? formatBackendStatus(status.currentPhase) : '-' },
                  { label: 'Ultima transicion', value: status?.lastTransition ? new Date(status.lastTransition).toLocaleString() : '-' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: '#fafafa', borderRadius: 12, padding: 14, border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
                    <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 700, overflowWrap: 'anywhere' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: failed ? '#fee2e2' : 'linear-gradient(135deg, #f0fdf4, #ecfeff)', borderRadius: 16, border: failed ? '1px solid #fecaca' : '1px solid #bbf7d0', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: failed ? '#991b1b' : '#0f172a', marginBottom: 6 }}>
                  {failed ? 'Evaluacion fallida' : recommendationDone ? 'Analisis y recomendacion completados' : noRecommendableCrops ? 'MCDA completado sin cultivos recomendables' : done ? 'MCDA completado, recomendacion en proceso' : 'Procesando analisis MCDA...'}
                </div>
                <div style={{ fontSize: 13, color: '#475569' }}>
                  {recommendationDone ? 'Resultado y recomendacion disponibles para consulta' : noRecommendableCrops ? 'Solo se generan recomendaciones para cultivos con viabilidad VIABLE o CONDICIONAL' : done ? 'Puedes ver el ranking mientras se prepara la recomendacion' : status ? `Estado actual: ${formatBackendStatus(status.status)}` : 'Iniciando analisis...'}
                </div>
                {error && <div style={{ fontSize: 12, color: failed ? '#991b1b' : '#92400e', marginTop: 8 }}>{error}</div>}
              </div>
              {failed && noRankedCropFailure && (
                <button
                  onClick={() => navigate('new-evaluation')}
                  style={{ background: '#991b1b', color: 'white', border: 'none', padding: '12px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                >
                  Nueva evaluacion
                </button>
              )}
              {done && (
                <button
                  onClick={() => navigate('results')}
                  style={{ background: '#16a34a', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
                >
                  Ver resultados <ChevronRight style={{ width: 16, height: 16 }} />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
