import { useState } from 'react';
import { MapPin, Layers, ZoomIn, ZoomOut, Trash2, Edit3, Upload, HelpCircle, ChevronRight, Square } from 'lucide-react';
import { cropOptions } from '@/features/evaluations/infrastructure/mock/newEvaluationData';
import Sidebar from '@/shared/presentation/layouts/Sidebar';
import { NavigateFn } from '@/app/navigation/navigation';
import { startEvaluationWorkflow } from '@/features/evaluations/application/startEvaluationWorkflow';
import { EvaluationApiRepository } from '@/features/evaluations/infrastructure/api/evaluationApiRepository';
import { ParcelApiRepository } from '@/features/evaluations/infrastructure/api/parcelApiRepository';
import { demoParcelGeometry } from '@/features/evaluations/infrastructure/mock/demoParcelGeometry';
import { saveCurrentEvaluation } from '@/features/evaluations/infrastructure/session/currentEvaluationStorage';

interface Props { navigate: NavigateFn; }

const parcelRepository = new ParcelApiRepository();
const evaluationRepository = new EvaluationApiRepository();


function InteractiveMap({ drawn }: { drawn: boolean }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden', background: '#dff0d8' }}>
      <svg width="100%" height="100%" viewBox="0 0 680 520" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="newEvalGrid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M 28 0 L 0 0 0 28" fill="none" stroke="#a7c7a0" strokeWidth="0.7" opacity="0.5" />
          </pattern>
        </defs>
        <rect width="680" height="520" fill="#e0eedd" />
        <rect width="680" height="520" fill="url(#newEvalGrid)" />
        <ellipse cx="150" cy="430" rx="200" ry="100" fill="#c8e6b5" opacity="0.5" />
        <ellipse cx="550" cy="120" rx="160" ry="100" fill="#bddcaa" opacity="0.5" />
        <path d="M 0 340 Q 180 315 340 345 Q 500 375 680 330 L 680 520 L 0 520 Z" fill="#c5e0b0" opacity="0.45" />
        <path d="M 80 195 Q 160 180 250 198 Q 330 216 420 195" stroke="#7db3d8" strokeWidth="5.5" fill="none" opacity="0.7" strokeLinecap="round" />
        <path d="M 0 380 Q 80 370 160 382" stroke="#7db3d8" strokeWidth="3.5" fill="none" opacity="0.5" strokeLinecap="round" />
        {/* Other fields - adjacent parcels */}
        <polygon points="30,60 110,50 125,115 95,140 25,130 18,85" fill="#a3c77a" fillOpacity="0.25" stroke="#78a54a" strokeWidth="1.5" strokeDasharray="4,3" />
        <polygon points="460,300 560,285 575,370 540,400 450,390 435,345" fill="#a3c77a" fillOpacity="0.2" stroke="#78a54a" strokeWidth="1.5" strokeDasharray="4,3" />
        {drawn ? (
          <>
            <polygon
              points="220,100 430,78 475,235 400,298 210,280 182,175"
              fill="#16a34a" fillOpacity="0.25"
              stroke="#15803d" strokeWidth="2.8"
            />
            {[[220,100],[430,78],[475,235],[400,298],[210,280],[182,175]].map(([x,y],i) => (
              <circle key={i} cx={x} cy={y} r="7" fill="#15803d" stroke="white" strokeWidth="2.5" />
            ))}
            <rect x="268" y="170" width="148" height="40" rx="10" fill="white" fillOpacity="0.93" />
            <text x="342" y="193" textAnchor="middle" fill="#15803d" fontSize="13" fontWeight="700">📍 2.4 ha</text>
            <text x="342" y="208" textAnchor="middle" fill="#64748b" fontSize="10">Fundo Loreto - Lote A</text>
          </>
        ) : null}
        <rect x="18" y="490" width="80" height="7" rx="3" fill="#64748b" />
        <text x="58" y="485" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="500">200 m</text>
        <g transform="translate(652, 496)">
          <circle r="20" fill="white" fillOpacity="0.88" />
          <text y="5" textAnchor="middle" fill="#15803d" fontSize="14" fontWeight="800">N</text>
        </g>
      </svg>

      {/* Map controls */}
      <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[{ icon: ZoomIn, title: '+' }, { icon: ZoomOut, title: '−' }, { icon: Layers, title: 'Capas' }].map(({ icon: Icon, title }) => (
          <button key={title} title={title} style={{ width: 36, height: 36, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <Icon style={{ width: 16, height: 16, color: '#475569' }} />
          </button>
        ))}
      </div>

      {/* Layer toggle */}
      <div style={{ position: 'absolute', top: 12, left: 12, background: 'white', borderRadius: 10, padding: '8px 12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Capas</div>
        {[{ l: 'Satélite', active: true }, { l: 'Topografía', active: false }, { l: 'NDVI', active: false }].map(({ l, active }) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: active ? '#16a34a' : '#e2e8f0', border: active ? 'none' : '1px solid #cbd5e1' }} />
            <span style={{ fontSize: 11.5, color: active ? '#15803d' : '#94a3b8', fontWeight: active ? 600 : 400 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NewEvaluation({ navigate }: Props) {
  const [name, setName] = useState('Parcela Fundo Loreto - Lote A');
  const [district, setDistrict] = useState('Lurín, Lima');
  const [area, setArea] = useState('2.4');
  const [method, setMethod] = useState('draw');
  const [drawn, setDrawn] = useState(true);
  const [selectedCrops, setSelectedCrops] = useState<string[]>(['demo_maiz', 'demo_papa', 'demo_quinua']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleCrop = (c: string) => {
    setSelectedCrops(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="new-evaluation" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Header */}
        <div style={{ background: 'white', borderBottom: '1px solid #f1f5f9', padding: '16px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }} onClick={() => navigate('dashboard')}>Dashboard</div>
              <span style={{ color: '#e2e8f0' }}>/</span>
              <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Nueva evaluación</div>
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', margin: 0 }}>Delimitación de parcela</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {['Delimitar parcela', 'Procesar variables', 'Ver resultados'].map((s, i) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: i === 0 ? '#16a34a' : '#e2e8f0', color: i === 0 ? 'white' : '#94a3b8', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                  <span style={{ fontSize: 12, color: i === 0 ? '#15803d' : '#94a3b8', fontWeight: i === 0 ? 600 : 400 }}>{s}</span>
                  {i < 2 && <div style={{ width: 20, height: 1, background: '#e2e8f0', margin: '0 4px' }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main split layout */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '380px 1fr', gap: 0, minHeight: 0 }}>
          {/* Form panel */}
          <div style={{ background: 'white', borderRight: '1px solid #f1f5f9', overflowY: 'auto', padding: '24px 24px' }}>
            {/* Help notice */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 14px', marginBottom: 20, display: 'flex', gap: 10 }}>
              <HelpCircle style={{ width: 16, height: 16, color: '#16a34a', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12.5, color: '#166534', margin: 0, lineHeight: 1.6 }}>
                Dibuja o carga el polígono de tu parcela para iniciar la evaluación de viabilidad de cultivos.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin style={{ width: 15, height: 15, color: '#16a34a' }} />
                Datos de la parcela
              </div>

              {[
                { label: 'Nombre de parcela', value: name, setter: setName, placeholder: 'Ej: Parcela Cañete 01' },
                { label: 'Ubicación / Distrito', value: district, setter: setDistrict, placeholder: 'Ej: Huaral, Lima' },
                { label: 'Área estimada (ha)', value: area, setter: setArea, placeholder: 'Ej: 3.2' },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 6 }}>{label}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={e => setter(e.target.value)}
                    placeholder={placeholder}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13.5, color: '#0f172a', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={e => (e.target.style.borderColor = '#16a34a')}
                    onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 10 }}>Método de ingreso de parcela</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { id: 'draw', label: 'Dibujar polígono en mapa', icon: Edit3 },
                  { id: 'upload', label: 'Cargar archivo GeoJSON / KML', icon: Upload },
                  { id: 'select', label: 'Seleccionar parcela existente', icon: Square },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setMethod(id); if (id === 'draw') setDrawn(true); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 9, border: `1.5px solid ${method === id ? '#16a34a' : '#e2e8f0'}`,
                      background: method === id ? '#f0fdf4' : 'white', cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${method === id ? '#16a34a' : '#cbd5e1'}`, background: method === id ? '#16a34a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {method === id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />}
                    </div>
                    <Icon style={{ width: 14, height: 14, color: method === id ? '#16a34a' : '#94a3b8' }} />
                    <span style={{ fontSize: 13, color: method === id ? '#15803d' : '#475569', fontWeight: method === id ? 600 : 400 }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 10 }}>Cultivos a evaluar</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {cropOptions.map(c => {
                  const selected = selectedCrops.includes(c.id);
                  return (
                    <button
                      key={c}
                      onClick={() => toggleCrop(c)}
                      style={{
                        padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        border: `1.5px solid ${selected ? '#16a34a' : '#e2e8f0'}`,
                        background: selected ? '#f0fdf4' : 'white',
                        color: selected ? '#15803d' : '#64748b',
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
              <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 8 }}>Seleccionados: {selectedCrops.map(cropId => cropOptions.find(c => c.id === cropId)?.label ?? cropId).join(', ') || 'ninguno'}</div>
            </div>

            {error && (
              <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 9, background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12.5, lineHeight: 1.45 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                style={{ background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0', padding: '11px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer' }}
              >
                Guardar parcela
              </button>
              <button
                onClick={() => void handleStartEvaluation()}
                disabled={loading}
                style={{ background: loading ? '#86efac' : '#16a34a', color: 'white', border: 'none', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {loading ? 'Registrando e iniciando evaluacion...' : 'Procesar variables agroambientales'}
                <ChevronRight style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>

          {/* Map panel */}
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column' }}>
            {/* Drawing toolbar */}
            <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 10, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              {[
                { icon: Edit3, label: 'Dibujar polígono', active: true, color: '#16a34a', bg: '#f0fdf4' },
                { icon: Edit3, label: 'Editar vértices', active: false, color: '#475569', bg: '#f8fafc' },
                { icon: Trash2, label: 'Borrar selección', active: false, color: '#dc2626', bg: '#fff' },
              ].map(({ icon: Icon, label, active, color, bg }) => (
                <button key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: `1px solid ${active ? '#bbf7d0' : '#e2e8f0'}`, background: bg, cursor: 'pointer', fontSize: 12.5, color, fontWeight: active ? 600 : 400 }}>
                  <Icon style={{ width: 13, height: 13 }} />
                  {label}
                </button>
              ))}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                {drawn && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '6px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
                    📍 Parcela delimitada: 2.4 ha
                  </div>
                )}
              </div>
            </div>

            {/* Map container */}
            <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', minHeight: 400 }}>
              <InteractiveMap drawn={drawn} />
            </div>

            <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: '#16a34a', opacity: 0.5 }} />
                Parcela delimitada
              </div>
              <div style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 2, background: '#78a54a', opacity: 0.4, border: '1px dashed #78a54a' }} />
                Parcelas adyacentes
              </div>
              <div style={{ fontSize: 11.5, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 16, height: 3, background: '#7db3d8', borderRadius: 1 }} />
                Cursos de agua
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
