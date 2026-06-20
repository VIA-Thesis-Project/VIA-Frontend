import { Download, Share2, Plus, Printer, CheckCircle2, MapPin, FlaskConical, Mountain, Droplets, Satellite, Thermometer, CloudRain, Layers } from 'lucide-react';
import Sidebar from '@/shared/presentation/layouts/Sidebar';
import { NavigateFn } from '@/app/navigation/navigation';

interface Props { navigate: NavigateFn; }

function MiniMapReport() {
  return (
    <svg width="100%" height="120" viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice" style={{ borderRadius: 8 }}>
      <rect width="400" height="120" fill="#e0eedd" />
      <defs>
        <pattern id="reportGrid" width="18" height="18" patternUnits="userSpaceOnUse">
          <path d="M 18 0 L 0 0 0 18" fill="none" stroke="#a7c7a0" strokeWidth="0.5" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="400" height="120" fill="url(#reportGrid)" />
      <polygon points="140,20 260,14 280,80 240,102 130,96 115,56" fill="#16a34a" fillOpacity="0.3" stroke="#15803d" strokeWidth="2" />
      <text x="200" y="62" textAnchor="middle" fill="#15803d" fontSize="11" fontWeight="700">2.4 ha</text>
      <circle cx="196" cy="54" r="12" fill="none" stroke="#15803d" strokeWidth="1.5" strokeDasharray="2,2" />
      <text x="60" y="110" fill="#64748b" fontSize="8">Lurín, Lima</text>
    </svg>
  );
}

export default function Report({ navigate }: Props) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="report" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }} onClick={() => navigate('dashboard')}>Dashboard</div>
              <span style={{ color: '#e2e8f0' }}>/</span>
              <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Reporte de evaluación</div>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0 }}>Vista previa del reporte de evaluación</h1>
            <p style={{ fontSize: 13.5, color: '#64748b', marginTop: 4 }}>Parcela Fundo Loreto - Lote A · 08 junio 2025</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => navigate('new-evaluation')} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '9px 16px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Plus style={{ width: 14, height: 14 }} /> Nueva evaluación
            </button>
            <button onClick={() => navigate('dashboard')} style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '9px 16px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              Volver al dashboard
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20 }}>
          {/* PDF Preview */}
          <div>
            <div style={{ background: 'white', borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              {/* Report header */}
              <div style={{ background: 'linear-gradient(135deg, #15803d, #0891b2)', padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'white', marginBottom: 4 }}>AgroViabilidad DSS</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>Informe de evaluación de viabilidad de cultivos · Lima, Perú</div>
                </div>
                <div style={{ textAlign: 'right', color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>
                  <div>Generado: 08 jun 2025</div>
                  <div style={{ fontWeight: 600, color: 'white' }}>ID: EVL-2025-0047</div>
                </div>
              </div>

              <div style={{ padding: '28px 32px' }}>
                {/* Section 1: Parcel data */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 4, height: 18, background: '#16a34a', borderRadius: 2 }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>1. Datos de la parcela</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    {[
                      { label: 'Nombre de parcela', value: 'Fundo Loreto - Lote A' },
                      { label: 'Ubicación', value: 'Lurín, Lima, Perú' },
                      { label: 'Área total', value: '2.4 hectáreas' },
                      { label: 'Fecha de evaluación', value: '08 junio 2025' },
                      { label: 'Técnico responsable', value: 'Juan Ramírez' },
                      { label: 'Cultivos evaluados', value: 'Camote, Maíz, Tomate, Papa, Arándano' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px' }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <MiniMapReport />
                </div>

                {/* Section 2: Variables */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 4, height: 18, background: '#0891b2', borderRadius: 2 }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>2. Variables agroambientales procesadas</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {[
                      { icon: FlaskConical, label: 'pH', value: '7.8', status: 'Tolerable', color: '#d97706', bg: '#fef3c7' },
                      { icon: Mountain, label: 'Pendiente', value: '4.2%', status: 'Óptimo', color: '#16a34a', bg: '#dcfce7' },
                      { icon: Droplets, label: 'Humedad', value: '18%', status: 'Tolerable', color: '#d97706', bg: '#fef3c7' },
                      { icon: Satellite, label: 'NDVI', value: '0.62', status: 'Óptimo', color: '#16a34a', bg: '#dcfce7' },
                      { icon: Thermometer, label: 'Temperatura', value: '21.4°C', status: 'Óptimo', color: '#16a34a', bg: '#dcfce7' },
                      { icon: CloudRain, label: 'Precipitación', value: '35 mm', status: 'Tolerable', color: '#d97706', bg: '#fef3c7' },
                      { icon: Layers, label: 'Textura', value: 'Franc-ar.', status: 'Óptimo', color: '#16a34a', bg: '#dcfce7' },
                      { icon: MapPin, label: 'Salinidad', value: '0.8 dS/m', status: 'Óptimo', color: '#16a34a', bg: '#dcfce7' },
                    ].map(({ icon: Icon, label, value, status, color, bg }) => (
                      <div key={label} style={{ background: '#fafafa', borderRadius: 9, padding: 12, border: '1px solid #f1f5f9', textAlign: 'center' }}>
                        <Icon style={{ width: 15, height: 15, color, marginBottom: 6, display: 'block', margin: '0 auto 6px' }} />
                        <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{value}</div>
                        <div style={{ background: bg, color, fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 8, display: 'inline-block' }}>{status}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Ranking */}
                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 4, height: 18, background: '#d97706', borderRadius: 2 }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>3. Ranking de viabilidad de cultivos (MCDA Fuzzy AHP)</div>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        {['#', 'Cultivo', 'Score MCDA', 'Categoría', 'Factor limitante principal'].map(h => (
                          <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { n: 1, emoji: '🍠', name: 'Camote', score: 86, cat: 'Alta', catColor: '#16a34a', catBg: '#dcfce7', limit: 'Humedad (18%)' },
                        { n: 2, emoji: '🌽', name: 'Maíz', score: 78, cat: 'Media-alta', catColor: '#0891b2', catBg: '#cffafe', limit: 'Precipitación baja' },
                        { n: 3, emoji: '🍅', name: 'Tomate', score: 64, cat: 'Media', catColor: '#d97706', catBg: '#fef3c7', limit: 'Humedad y pH' },
                        { n: 4, emoji: '🥔', name: 'Papa', score: 51, cat: 'Baja-media', catColor: '#7c3aed', catBg: '#ede9fe', limit: 'Temperatura alta' },
                        { n: 5, emoji: '🫐', name: 'Arándano', score: 39, cat: 'Baja', catColor: '#dc2626', catBg: '#fee2e2', limit: 'pH 7.8 (requiere ácido)' },
                      ].map(row => (
                        <tr key={row.n} style={{ borderBottom: '1px solid #f8fafc' }}>
                          <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>#{row.n}</td>
                          <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{row.emoji} {row.name}</td>
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 48, height: 5, background: '#f1f5f9', borderRadius: 3 }}>
                                <div style={{ width: `${row.score}%`, height: '100%', background: row.catColor, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: row.catColor }}>{row.score}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '10px 12px' }}><div style={{ background: row.catBg, color: row.catColor, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 12, display: 'inline-block' }}>{row.cat}</div></td>
                          <td style={{ padding: '10px 12px', fontSize: 12, color: '#64748b' }}>{row.limit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section 4: Recommendations summary */}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                    <div style={{ width: 4, height: 18, background: '#7c3aed', borderRadius: 2 }} />
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>4. Recomendaciones principales (Camote)</div>
                  </div>
                  {['Implementar riego por goteo para compensar humedad deficitaria (18%).', 'Aplicar mulching para reducir evaporación superficial.', 'Monitorear NDVI cada 5 días con imágenes Sentinel-2.', 'Seleccionar variedades tolerantes a pH ligeramente alcalino (7.8).', 'Realizar análisis de suelo completo antes de la primera siembra.'].map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                      <CheckCircle2 style={{ width: 14, height: 14, color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.55 }}>{r}</span>
                    </div>
                  ))}
                </div>

                {/* Sources */}
                <div style={{ background: '#f8fafc', borderRadius: 10, padding: '14px 18px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Fuentes de sustento técnico:</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['INIA Perú', 'FAO (Crop Requirements)', 'SENAMHI Lima', 'Rulebook Camote v1.2', 'GEE Sentinel-2'].map(s => (
                      <div key={s} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '4px 10px', fontSize: 11.5, color: '#64748b', fontWeight: 500 }}>{s}</div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>AgroViabilidad DSS · Prototipo académico · Este reporte es orientativo y debe ser validado por un especialista agrónomo.</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Pág. 1 / 3</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '20px' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>Acciones del reporte</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button style={{ background: '#16a34a', color: 'white', border: 'none', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Download style={{ width: 16, height: 16 }} /> Descargar PDF
                </button>
                <button style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '11px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Share2 style={{ width: 15, height: 15 }} /> Compartir reporte
                </button>
                <button style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '11px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Printer style={{ width: 15, height: 15 }} /> Imprimir
                </button>
                <button onClick={() => navigate('new-evaluation')} style={{ background: 'white', color: '#16a34a', border: '1.5px solid #bbf7d0', padding: '11px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Plus style={{ width: 15, height: 15 }} /> Nueva evaluación
                </button>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: '18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Contenido del reporte</div>
              {['Datos de la parcela', 'Mapa de ubicación', 'Variables agroambientales', 'Ranking de cultivos', 'Score MCDA por cultivo', 'Brechas identificadas', 'Recomendaciones', 'Fuentes de sustento'].map((item, i) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <CheckCircle2 style={{ width: 13, height: 13, color: '#16a34a', flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, color: '#475569' }}>{item}</span>
                </div>
              ))}
            </div>

            <div style={{ background: '#f0fdf4', borderRadius: 14, border: '1px solid #bbf7d0', padding: '14px 16px' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#15803d', marginBottom: 6 }}>Reporte ID: EVL-2025-0047</div>
              <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.6 }}>3 páginas · Generado automáticamente · Incluye trazabilidad completa de fuentes RAG</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
