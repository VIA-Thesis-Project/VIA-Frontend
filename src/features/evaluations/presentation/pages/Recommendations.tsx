import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronLeft, ExternalLink, FileText, Sprout } from 'lucide-react';
import { NavigateFn } from '@/app/navigation/navigation';
import { toUserFriendlyFailureReason } from '@/features/evaluations/application/backendFailureMessages';
import { getCropLabel } from '@/features/evaluations/application/cropCatalog';
import { isEvaluationPending } from '@/features/evaluations/application/evaluationStatus';
import {
  CropEvaluationResult,
  EvaluationMcdaResult,
  FinalRecommendationResult,
} from '@/features/evaluations/domain/evaluation';
import { EvaluationApiRepository } from '@/features/evaluations/infrastructure/api/evaluationApiRepository';
import { readCurrentEvaluation } from '@/features/evaluations/infrastructure/session/currentEvaluationStorage';
import Sidebar from '@/shared/presentation/layouts/Sidebar';

interface Props { navigate: NavigateFn; }

const evaluationRepository = new EvaluationApiRepository();

function toPercent(score: number | null): number {
  if (score === null) return 0;
  return Math.round(score <= 1 ? score * 100 : score);
}

function sortResults(results: CropEvaluationResult[]): CropEvaluationResult[] {
  return [...results].sort((a, b) => (a.rankPosition ?? 999) - (b.rankPosition ?? 999));
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
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
  const [allRecommendations, setAllRecommendations] = useState<FinalRecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(currentEvaluation ? null : 'No hay una evaluacion activa.');

  useEffect(() => {
    if (!currentEvaluation) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const loadRecommendation = async () => {
      try {
        const [mcda, finalRecommendation] = await Promise.all([
          evaluationRepository.getMcdaResult(currentEvaluation.evaluationId),
          evaluationRepository.getFinalRecommendation(currentEvaluation.evaluationId),
        ]);
        const recommendations = await evaluationRepository.getRecommendationsForEvaluation(currentEvaluation.evaluationId);

        if (!cancelled) {
          setMcdaResult(mcda);
          setRecommendation(finalRecommendation);
          setAllRecommendations(recommendations.map((item) => ({ status: 'available' as const, recommendation: item })));
          setError(toUserFriendlyFailureReason(mcda.failureReason));
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
  const backendRecommendation = recommendation?.status === 'available' ? recommendation.recommendation : null;
  const pendingDetail = recommendation?.status === 'pending' ? recommendation.detail : null;
  const mcdaPending = isEvaluationPending(mcdaResult?.status);

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
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>Consulta real a /evaluaciones/:id/recomendacion-final</div>
                </div>
              </div>
              <div style={{ background: '#fafafa', borderRadius: 12, padding: '18px 20px', border: '1px solid #f1f5f9' }}>
                {backendRecommendation ? (
                  <>
                    <p style={{ fontSize: 14.5, color: '#334155', lineHeight: 1.75, margin: 0, marginBottom: 10 }}>
                      <strong>{backendRecommendation.title}</strong>
                    </p>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ background: '#f0fdf4', color: '#15803d', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>Estado: {backendRecommendation.status}</div>
                      <div style={{ background: '#ecfeff', color: '#0891b2', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>Proveedor: {backendRecommendation.provider}</div>
                      <div style={{ background: '#faf5ff', color: '#7c3aed', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>Evidencias: {backendRecommendation.evidence.length}</div>
                      <div style={{ background: '#f8fafc', color: '#475569', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20 }}>Recomendaciones: {allRecommendations.length}</div>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: 14.5, color: '#334155', lineHeight: 1.75, margin: 0 }}>
                    {pendingDetail ?? 'La recomendacion aun no esta disponible en el backend.'} Mientras tanto, se muestran acciones derivadas del resultado MCDA real.
                  </p>
                )}
              </div>
            </div>

            {allRecommendations.length > 1 && (
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '18px 22px', marginBottom: 20 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Recomendaciones persistidas</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {allRecommendations.map((item) => item.status === 'available' && (
                    <div key={item.recommendation.recommendationId} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, background: '#fafafa', border: '1px solid #f1f5f9', borderRadius: 10, padding: '10px 12px' }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.recommendation.title}</div>
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{getCropLabel(item.recommendation.cropId)} · {item.recommendation.provider}</div>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#94a3b8', whiteSpace: 'nowrap' }}>{new Date(item.recommendation.createdAt).toLocaleDateString()}</div>
                    </div>
                  ))}
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
                El backend de recomendaciones esta conectado, pero el router actual no devuelve secciones de texto. La evidencia se muestra cuando existe una recomendacion persistida.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                {(backendRecommendation?.evidence ?? []).map(({ fragmentId }) => (
                  <div key={fragmentId} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#faf5ff', border: '1px solid #ede9fe', borderRadius: 10, padding: '8px 14px' }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#7c3aed', marginBottom: 1 }}>Fragmento RAG</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{fragmentId.slice(0, 8)}</div>
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
                  Esta salida es orientativa. Cuando el backend devuelva una recomendacion persistida con secciones completas, la pantalla deberia priorizar ese texto sobre las acciones derivadas localmente.
                </p>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
