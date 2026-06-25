import { useEffect, useMemo, useState } from 'react';
import { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, FileText, MapPin, Plus, Printer, Sprout, TrendingUp } from 'lucide-react';
import Sidebar from '@/shared/presentation/layouts/Sidebar';
import { NavigateFn } from '@/app/navigation/navigation';
import { toUserFriendlyFailureReason } from '@/features/evaluations/application/backendFailureMessages';
import { getCropLabel } from '@/features/evaluations/application/cropCatalog';
import { CropEvaluationResult, EvaluationMcdaResult, FinalRecommendationResult } from '@/features/evaluations/domain/evaluation';
import { Parcel } from '@/features/evaluations/domain/parcel';
import { EvaluationApiRepository } from '@/features/evaluations/infrastructure/api/evaluationApiRepository';
import { ParcelApiRepository } from '@/features/evaluations/infrastructure/api/parcelApiRepository';
import { readCurrentEvaluation } from '@/features/evaluations/infrastructure/session/currentEvaluationStorage';
import { readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';

interface Props { navigate: NavigateFn; }

const evaluationRepository = new EvaluationApiRepository();
const parcelRepository = new ParcelApiRepository();

function sortResults(results: CropEvaluationResult[]): CropEvaluationResult[] {
  return [...results].sort((a, b) => (a.rankPosition ?? 999) - (b.rankPosition ?? 999));
}

function toPercent(score: number | null): number {
  if (score === null) return 0;
  return Math.round(score <= 1 ? score * 100 : score);
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function categoryStyle(category: string) {
  const normalized = category.toUpperCase();
  if (normalized.includes('VIABLE') && !normalized.includes('NO')) {
    return { color: '#16a34a', bg: '#dcfce7' };
  }
  if (normalized.includes('CONDICIONAL')) {
    return { color: '#d97706', bg: '#fef3c7' };
  }
  return { color: '#dc2626', bg: '#fee2e2' };
}

export default function Report({ navigate }: Props) {
  const [currentEvaluation] = useState(() => readCurrentEvaluation());
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [mcdaResult, setMcdaResult] = useState<EvaluationMcdaResult | null>(null);
  const [recommendation, setRecommendation] = useState<FinalRecommendationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(currentEvaluation ? null : 'No hay una evaluacion activa para generar reporte.');

  useEffect(() => {
    if (!currentEvaluation) {
      setLoading(false);
      return;
    }

    const session = readAuthSession();
    let cancelled = false;

    const loadReport = async () => {
      try {
        const [mcda, finalRecommendation, parcelDetail] = await Promise.all([
          evaluationRepository.getMcdaResult(currentEvaluation.evaluationId),
          evaluationRepository.getFinalRecommendation(currentEvaluation.evaluationId),
          session ? parcelRepository.getParcel(currentEvaluation.parcelId, session.accessToken) : Promise.resolve(null),
        ]);

        if (!cancelled) {
          setMcdaResult(mcda);
          setRecommendation(finalRecommendation);
          setParcel(parcelDetail);
          setError(toUserFriendlyFailureReason(mcda.failureReason));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo consultar el reporte.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadReport();
    return () => {
      cancelled = true;
    };
  }, [currentEvaluation]);

  const results = useMemo(() => sortResults(mcdaResult?.results ?? []), [mcdaResult]);
  const topCrop = results[0] ?? null;
  const backendRecommendation = recommendation?.status === 'available' ? recommendation.recommendation : null;
  const topGaps = results.flatMap((result) => result.gaps.slice(0, 3).map((gap) => ({ cropId: result.cropId, gap }))).slice(0, 8);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="report" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }} onClick={() => navigate('dashboard')}>Dashboard</div>
              <span style={{ color: '#e2e8f0' }}>/</span>
              <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Reporte de evaluacion</div>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Reporte conectado al backend</h1>
            <p style={{ fontSize: 13.5, color: '#64748b', marginTop: 4 }}>
              {currentEvaluation?.parcelName ?? 'Sin parcela'} · {mcdaResult?.status ?? 'Consultando estado'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('new-evaluation')} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '9px 16px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Plus style={{ width: 14, height: 14 }} /> Nueva evaluacion
            </button>
            <button onClick={() => navigate('dashboard')} style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '9px 16px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}>
              Volver al dashboard
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
            Consultando datos reales del reporte...
          </div>
        )}

        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
            <div style={{ background: 'white', borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <div style={{ background: 'linear-gradient(135deg, #15803d, #0891b2)', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 4 }}>AgroViabilidad DSS</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Informe de evaluacion de viabilidad agricola</div>
                </div>
                <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                  <div>Generado: {new Date().toLocaleDateString()}</div>
                  <div style={{ fontWeight: 600, color: 'white' }}>ID: {currentEvaluation?.evaluationId.slice(0, 8) ?? '-'}</div>
                </div>
              </div>

              <div style={{ padding: '28px 32px' }}>
                <section style={{ marginBottom: 28 }}>
                  <ReportSectionTitle color="#16a34a" title="1. Datos de la parcela" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Nombre de parcela', value: parcel?.metadata.name ?? currentEvaluation?.parcelName ?? '-' },
                      { label: 'Ubicacion', value: currentEvaluation?.parcelLocation ?? parcel?.metadata.description ?? '-' },
                      { label: 'Area registrada', value: currentEvaluation?.areaHa ?? 'No registrada' },
                      { label: 'CRS', value: parcel?.metadata.crs ?? 'EPSG:4326' },
                      { label: 'Evaluacion', value: currentEvaluation?.evaluationId ?? '-' },
                      { label: 'Cultivos evaluados', value: currentEvaluation?.cropCandidates.map((crop) => crop.label).join(', ') ?? '-' },
                    ].map(({ label, value }) => (
                      <InfoBox key={label} label={label} value={value} />
                    ))}
                  </div>
                </section>

                <section style={{ marginBottom: 28 }}>
                  <ReportSectionTitle color="#0891b2" title="2. Ranking MCDA" />
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #f1f5f9' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['#', 'Cultivo', 'Score', 'Categoria', 'Brechas', 'Limitantes'].map((header) => (
                          <th key={header} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.length === 0 && (
                        <tr><td colSpan={6} style={{ padding: 14, color: '#64748b', fontSize: 13 }}>El backend aun no devuelve resultados MCDA para esta evaluacion.</td></tr>
                      )}
                      {results.map((result, index) => {
                        const style = categoryStyle(result.viabilityCategory);
                        return (
                          <tr key={result.cropId} style={{ borderTop: '1px solid #f8fafc' }}>
                            <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 800, color: '#94a3b8' }}>#{result.rankPosition ?? index + 1}</td>
                            <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{getCropLabel(result.cropId)}</td>
                            <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 800, color: style.color }}>{toPercent(result.score)}%</td>
                            <td style={{ padding: '10px 12px' }}><span style={{ background: style.bg, color: style.color, fontSize: 11.5, fontWeight: 700, padding: '4px 9px', borderRadius: 12 }}>{result.viabilityCategory}</span></td>
                            <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b' }}>{result.gaps.length}</td>
                            <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b' }}>{result.limitingFactors.length}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>

                <section style={{ marginBottom: 28 }}>
                  <ReportSectionTitle color="#d97706" title="3. Brechas principales" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {topGaps.length === 0 && <div style={{ fontSize: 13, color: '#64748b' }}>Sin brechas disponibles.</div>}
                    {topGaps.map(({ cropId, gap }) => (
                      <div key={`${cropId}-${gap.criterionId}-${gap.phaseId}-${gap.mostLimitingPeriod}`} style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 12px' }}>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: '#92400e' }}>{getCropLabel(cropId)} · {gap.criterionId}</div>
                        <div style={{ fontSize: 12, color: '#78350f', marginTop: 4 }}>Fase {gap.phaseId}, brecha {formatNumber(gap.gapValue)}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <ReportSectionTitle color="#7c3aed" title="4. Recomendacion final" />
                  {backendRecommendation ? (
                    <div style={{ background: '#faf5ff', border: '1px solid #ede9fe', borderRadius: 12, padding: '14px 16px' }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#4c1d95', marginBottom: 6 }}>{backendRecommendation.title}</div>
                      <div style={{ fontSize: 12.5, color: '#6d28d9', marginBottom: 10 }}>
                        Cultivo: {getCropLabel(backendRecommendation.cropId)} · Estado: {backendRecommendation.status} · Proveedor: {backendRecommendation.provider}
                      </div>
                      {backendRecommendation.sections.length > 0 ? backendRecommendation.sections.map((section) => (
                        <p key={`${section.sectionType}-${section.title}`} style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: '0 0 8px' }}>
                          <strong>{section.title}:</strong> {section.content}
                        </p>
                      )) : (
                        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
                          El backend persistio la recomendacion, pero no envio secciones textuales. Se muestran ranking, brechas y trazabilidad disponibles.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: '#64748b' }}>
                      La recomendacion final aun no esta disponible.
                    </div>
                  )}
                </section>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <SideCard title="Resumen">
                {[
                  { icon: MapPin, label: 'Parcela', value: parcel?.metadata.name ?? currentEvaluation?.parcelName ?? '-' },
                  { icon: TrendingUp, label: 'Estado MCDA', value: mcdaResult?.status ?? '-' },
                  { icon: Sprout, label: 'Mejor cultivo', value: topCrop ? getCropLabel(topCrop.cropId) : '-' },
                  { icon: FileText, label: 'Recomendacion', value: backendRecommendation?.status ?? 'Pendiente' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', gap: 9, alignItems: 'center', marginBottom: 10 }}>
                    <Icon style={{ width: 15, height: 15, color: '#16a34a' }} />
                    <div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{label}</div>
                      <div style={{ fontSize: 12.5, color: '#0f172a', fontWeight: 700 }}>{value}</div>
                    </div>
                  </div>
                ))}
              </SideCard>

              <SideCard title="Acciones">
                <button onClick={() => window.print()} style={{ width: '100%', background: '#16a34a', color: 'white', border: 'none', padding: '11px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
                  <Printer style={{ width: 15, height: 15 }} /> Imprimir vista
                </button>
                <button disabled style={{ width: '100%', background: '#f8fafc', color: '#94a3b8', border: '1.5px solid #e2e8f0', padding: '11px', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'not-allowed' }}>
                  PDF pendiente de endpoint
                </button>
              </SideCard>

              <div style={{ background: '#fffbeb', borderRadius: 14, border: '1px solid #fde68a', padding: '14px 16px', display: 'flex', gap: 10 }}>
                <AlertTriangle style={{ width: 16, height: 16, color: '#d97706', flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.6 }}>
                  Reporte generado desde endpoints publicos actuales. No simula variables crudas ni descarga PDF.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ReportSectionTitle({ color, title }: { color: string; title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <div style={{ width: 4, height: 18, background: color, borderRadius: 2 }} />
      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{title}</div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflowWrap: 'anywhere' }}>{value}</div>
    </div>
  );
}

function SideCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 18 }}>
      <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>{title}</div>
      {children}
    </div>
  );
}
