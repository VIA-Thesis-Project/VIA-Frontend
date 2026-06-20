import { ArrowLeft, FileText, ChevronLeft, Sprout, Droplets, Satellite, AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { recommendationBlocks, recommendationSources } from '@/features/evaluations/infrastructure/mock/recommendationsData';
import Sidebar from '@/shared/presentation/layouts/Sidebar';
import { NavigateFn } from '@/app/navigation/navigation';

interface Props { navigate: NavigateFn; }


export default function Recommendations({ navigate }: Props) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="results" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <button onClick={() => navigate('crop-detail')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#94a3b8', fontSize: 12, marginBottom: 10 }}>
              <ChevronLeft style={{ width: 13, height: 13 }} /> Volver a detalle de cultivo
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: 6 }}>Recomendaciones agronómicas</h1>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontSize: 16 }}>🍠</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Camote</span>
              </div>
              <div style={{ height: 14, width: 1, background: '#e2e8f0' }} />
              <div style={{ fontSize: 13, color: '#64748b' }}>Parcela: <strong>Fundo Loreto - Lote A</strong></div>
              <div style={{ height: 14, width: 1, background: '#e2e8f0' }} />
              <div style={{ background: '#dcfce7', color: '#16a34a', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20 }}>Score: 86%</div>
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

        {/* LLM recommendation summary */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '24px 28px', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sprout style={{ width: 18, height: 18, color: '#16a34a' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Síntesis de recomendación (generada con LLM/RAG)</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Basada en brechas MCDA y documentos técnicos recuperados</div>
            </div>
          </div>
          <div style={{ background: '#fafafa', borderRadius: 12, padding: '18px 20px', border: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: 14.5, color: '#334155', lineHeight: 1.75, margin: 0 }}>
              "Priorizar prácticas de <strong style={{ color: '#15803d' }}>manejo orientadas a mejorar la retención de humedad del suelo</strong>, dado que el principal factor limitante identificado en la parcela es la humedad estimada (18%), que se encuentra por debajo del umbral óptimo para camote (25-40%). La condición de pendiente baja (4.2%), NDVI activo (0.62) y temperatura media adecuada (21.4°C) favorecen el cultivo. Se recomienda implementar riego por goteo localizado, aplicar cobertura vegetal (mulching) y realizar enmiendas orgánicas para mejorar la capacidad de retención hídrica del suelo franco-arenoso. Evaluar el pH (7.8) periódicamente y seleccionar variedades tolerantes a alcalinidad moderada."
            </p>
          </div>
        </div>

        {/* Recommendation blocks */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {recommendationBlocks.map(({ icon: Icon, color, bg, border, title, items }) => (
            <div key={title} style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ background: bg, borderBottom: `1.5px solid ${border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${border}` }}>
                  <Icon style={{ width: 16, height: 16, color }} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{title}</div>
              </div>
              <div style={{ padding: '16px 20px' }}>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < items.length - 1 ? 12 : 0 }}>
                    <CheckCircle2 style={{ width: 14, height: 14, color, flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Traceability section */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '22px 28px', marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>Trazabilidad de la recomendación</div>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Recomendación sustentada en brechas MCDA identificadas y documentos técnicos recuperados mediante RAG.</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
            {recommendationSources.map(({ name, desc, color, bg }) => (
              <div key={name} style={{ display: 'flex', align: 'center', gap: 8, background: bg, border: `1px solid ${color}22`, borderRadius: 10, padding: '8px 14px', cursor: 'pointer' }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color, marginBottom: 1 }}>{name}</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>{desc}</div>
                </div>
                <ExternalLink style={{ width: 12, height: 12, color, flexShrink: 0, marginLeft: 6, alignSelf: 'center' }} />
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Brechas identificadas que fundamentan esta recomendación:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Humedad: 18% (brecha 7%)', color: '#d97706', bg: '#fef3c7' },
                { label: 'Precipitación: 35 mm (brecha alta)', color: '#dc2626', bg: '#fee2e2' },
                { label: 'pH: 7.8 (brecha moderada)', color: '#d97706', bg: '#fef3c7' },
              ].map(({ label, color, bg }) => (
                <div key={label} style={{ background: bg, color, fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 20 }}>{label}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 14, padding: '14px 20px', display: 'flex', gap: 12 }}>
          <AlertTriangle style={{ width: 18, height: 18, color: '#d97706', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#92400e', marginBottom: 4 }}>Aviso importante</div>
            <p style={{ fontSize: 13, color: '#78350f', margin: 0, lineHeight: 1.65 }}>
              Esta recomendación es <strong>orientativa</strong> y ha sido generada automáticamente con apoyo de modelos de lenguaje e información técnica. Debe ser <strong>revisada y validada por un especialista agrónomo</strong> antes de su implementación. El sistema AgroViabilidad DSS es una herramienta de apoyo a la decisión, no reemplaza el criterio profesional.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
