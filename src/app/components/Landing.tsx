import { Leaf, MapPin, BarChart3, AlertTriangle, FileCheck, ChevronRight, Satellite, Droplets, Mountain, FlaskConical, ArrowRight, CheckCircle2 } from 'lucide-react';
import { NavigateFn } from '../App';

interface Props { navigate: NavigateFn; }

function MapSVGHero() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 580 440" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="heroGrid" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#a7c7a0" strokeWidth="0.6" opacity="0.5" />
        </pattern>
        <filter id="blur2">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <rect width="580" height="440" fill="#dff0d8" />
      <rect width="580" height="440" fill="url(#heroGrid)" />
      <ellipse cx="120" cy="380" rx="150" ry="90" fill="#c8e6b5" opacity="0.6" />
      <ellipse cx="460" cy="100" rx="130" ry="80" fill="#bddcaa" opacity="0.5" />
      <path d="M 0 280 Q 140 260 290 290 Q 430 320 580 275 L 580 440 L 0 440 Z" fill="#c8e6b5" opacity="0.45" />
      <path d="M 60 160 Q 120 148 190 162 Q 250 176 310 160" stroke="#7db3d8" strokeWidth="5" fill="none" opacity="0.6" strokeLinecap="round" />
      <path d="M 0 310 Q 60 302 120 312" stroke="#7db3d8" strokeWidth="3.5" fill="none" opacity="0.5" strokeLinecap="round" />
      <path d="M 420 340 Q 490 330 560 340" stroke="#7db3d8" strokeWidth="3" fill="none" opacity="0.5" strokeLinecap="round" />
      <polygon
        points="195,105 370,88 410,218 345,272 185,255 160,168"
        fill="#16a34a" fillOpacity="0.22"
        stroke="#15803d" strokeWidth="2.8"
      />
      {[[195,105],[370,88],[410,218],[345,272],[185,255],[160,168]].map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="6" fill="#15803d" stroke="white" strokeWidth="2.5" />
      ))}
      <rect x="243" y="168" width="96" height="30" rx="8" fill="white" fillOpacity="0.92" />
      <text x="291" y="188" textAnchor="middle" fill="#15803d" fontSize="12" fontWeight="700">▲ 2.4 ha</text>
      <rect x="16" y="412" width="72" height="6" rx="3" fill="#64748b" />
      <text x="52" y="408" textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="500">200 m</text>
      <g transform="translate(546, 408)">
        <circle r="20" fill="white" fillOpacity="0.88" />
        <text y="5" textAnchor="middle" fill="#15803d" fontSize="14" fontWeight="800">N</text>
      </g>
    </svg>
  );
}

export default function Landing({ navigate }: Props) {
  const benefits = [
    { icon: MapPin, title: 'Evaluación por parcela', desc: 'Delimita tu parcela en mapa y obtén análisis geoespacial preciso por hectárea', color: '#16a34a', bg: '#f0fdf4' },
    { icon: BarChart3, title: 'Ranking de cultivos', desc: 'Ordena cultivos por score MCDA difuso con criterios ponderados técnicamente', color: '#0891b2', bg: '#ecfeff' },
    { icon: AlertTriangle, title: 'Factores limitantes', desc: 'Visualiza qué variables restringen la viabilidad y qué tan críticas son', color: '#d97706', bg: '#fffbeb' },
    { icon: FileCheck, title: 'Recomendaciones trazables', desc: 'Recomendaciones basadas en brechas MCDA y fuentes técnicas verificables', color: '#7c3aed', bg: '#faf5ff' },
  ];

  const steps = [
    'Delimita la parcela en el mapa',
    'El sistema procesa variables agroambientales',
    'Analiza con MCDA difuso / Fuzzy AHP',
    'Visualiza el ranking de cultivos viables',
    'Recibe recomendaciones explicadas',
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header style={{ borderBottom: '1px solid #f1f5f9', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #16a34a, #0891b2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Leaf style={{ width: 20, height: 20, color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>AgroViabilidad DSS</div>
            </div>
          </div>

          <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {['Inicio', 'Evaluar parcela', 'Resultados', 'Reportes'].map(item => (
              <a key={item} href="#" style={{ fontSize: 14, color: '#64748b', textDecoration: 'none', fontWeight: 500 }}
                onMouseOver={e => (e.currentTarget.style.color = '#16a34a')}
                onMouseOut={e => (e.currentTarget.style.color = '#64748b')}>
                {item}
              </a>
            ))}
          </nav>

          <button
            onClick={() => navigate('login')}
            style={{ background: '#16a34a', color: 'white', border: 'none', padding: '9px 20px', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            Ingresar al sistema <ArrowRight style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '72px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          {/* Left */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f0fdf4', color: '#15803d', padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 600, marginBottom: 24, border: '1px solid #bbf7d0' }}>
              <Satellite style={{ width: 13, height: 13 }} />
              MCDA Difuso · Datos Satelitales · IA Explicable
            </div>

            <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.15, marginBottom: 20 }}>
              Evalúa la viabilidad de{' '}
              <span style={{ color: '#16a34a' }}>cultivos a nivel de parcela</span>
            </h1>

            <p style={{ fontSize: '1.1rem', color: '#475569', lineHeight: 1.75, marginBottom: 36, maxWidth: 500 }}>
              Integra datos de suelo, clima y satélite con <strong style={{ color: '#15803d' }}>análisis multicriterio difuso (Fuzzy AHP)</strong> y recomendaciones agronómicas explicables para Lima, Perú.
            </p>

            <div style={{ display: 'flex', gap: 12, marginBottom: 48 }}>
              <button
                onClick={() => navigate('login')}
                style={{ background: '#16a34a', color: 'white', border: 'none', padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                Iniciar evaluación <ChevronRight style={{ width: 16, height: 16 }} />
              </button>
              <button
                onClick={() => navigate('login')}
                style={{ background: 'white', color: '#334155', border: '1.5px solid #e2e8f0', padding: '13px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
              >
                Ver demo
              </button>
            </div>

            {/* How it works mini steps */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Cómo funciona</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#f0fdf4', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#16a34a', flexShrink: 0 }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 13.5, color: '#475569' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: map visual */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', border: '1.5px solid #e2e8f0', boxShadow: '0 20px 60px rgba(0,0,0,0.1)', height: 460 }}>
              <MapSVGHero />

              {[
                { icon: FlaskConical, label: 'pH del suelo', value: '7.8', tag: 'Tolerable', tagColor: '#d97706', tagBg: '#fef3c7', iconColor: '#d97706', iconBg: '#fffbeb', top: 16, left: 16 },
                { icon: Satellite, label: 'NDVI', value: '0.62', tag: 'Óptimo', tagColor: '#16a34a', tagBg: '#dcfce7', iconColor: '#16a34a', iconBg: '#f0fdf4', top: 16, right: 16 },
                { icon: Droplets, label: 'Humedad', value: '18 %', tag: 'Tolerable', tagColor: '#d97706', tagBg: '#fef3c7', iconColor: '#0891b2', iconBg: '#ecfeff', bottom: 56, left: 16 },
                { icon: Mountain, label: 'Pendiente', value: '4.2 %', tag: 'Óptimo', tagColor: '#16a34a', tagBg: '#dcfce7', iconColor: '#78716c', iconBg: '#fafaf9', bottom: 56, right: 16 },
              ].map(({ icon: Icon, label, value, tag, tagColor, tagBg, iconColor, iconBg, ...pos }) => (
                <div key={label} style={{ position: 'absolute', ...pos, background: 'white', borderRadius: 12, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10, zIndex: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon style={{ width: 16, height: 16, color: iconColor }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{value}</div>
                  </div>
                  <div style={{ background: tagBg, color: tagColor, fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20 }}>{tag}</div>
                </div>
              ))}

              <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: '#15803d', color: 'white', padding: '8px 18px', borderRadius: 100, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(21,128,61,0.4)' }}>
                <MapPin style={{ width: 13, height: 13 }} />
                Fundo Loreto · 2.4 ha delimitadas
              </div>
            </div>

            {/* Decorative badge */}
            <div style={{ position: 'absolute', top: -16, right: -16, background: 'white', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: '10px 16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>Cultivo mejor rankeado</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: 6 }}>
                🍠 Camote — 86%
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits grid */}
      <section style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '64px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Capacidades del sistema</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Un DSS diseñado para el productor y el técnico</h2>
            <p style={{ fontSize: 15, color: '#64748b', maxWidth: 560, margin: '0 auto' }}>
              No reemplaza al experto agrónomo. Funciona como herramienta de apoyo a decisiones basada en datos y MCDA difuso.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {benefits.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} style={{ background: 'white', borderRadius: 16, padding: 24, border: '1.5px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Icon style={{ width: 22, height: 22, color }} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section style={{ padding: '32px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Sustentado en fuentes técnicas:</div>
          {['INIA Perú', 'FAO', 'SENAMHI', 'Fuzzy AHP', 'LLM / RAG', 'GEE Sentinel-2'].map(org => (
            <div key={org} style={{ fontSize: 14, fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.02em' }}>{org}</div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#0f172a', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #16a34a, #0891b2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Leaf style={{ width: 16, height: 16, color: 'white' }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>AgroViabilidad DSS</span>
        </div>
        <p style={{ fontSize: 13, color: '#475569' }}>Prototipo académico · Tesis Ingeniería de Software · Lima, Perú · 2025</p>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 6 }}>
          <CheckCircle2 style={{ width: 14, height: 14, color: '#16a34a' }} />
          <span style={{ fontSize: 12, color: '#475569' }}>Sistema de apoyo a decisiones · No reemplaza al especialista agrónomo</span>
        </div>
      </footer>
    </div>
  );
}
