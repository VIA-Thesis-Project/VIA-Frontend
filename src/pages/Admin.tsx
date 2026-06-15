import { useState } from 'react';
import { Shield, Upload, RefreshCw, CheckCircle2, Clock, AlertTriangle, Database, BookOpen, FileText, Settings, Plus, Search, Filter } from 'lucide-react';
import { adminNav, adminStats, ragDocs, rulebooks } from '../data/adminData';
import { NavigateFn } from '../types/navigation';

interface Props { navigate: NavigateFn; }


export default function Admin({ navigate }: Props) {
  const [activeTab, setActiveTab] = useState('rulebooks');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Admin sidebar */}
      <aside style={{ width: 240, background: '#0f172a', minHeight: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 40, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #16a34a, #0891b2)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield style={{ width: 18, height: 18, color: 'white' }} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Panel técnico</div>
              <div style={{ fontSize: 11, color: '#475569' }}>AgroViabilidad DSS</div>
            </div>
          </div>
          <div style={{ marginTop: 12, background: 'rgba(220,38,38,0.15)', border: '1px solid rgba(220,38,38,0.3)', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield style={{ width: 11, height: 11, color: '#f87171' }} />
            <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>Acceso restringido · Admin</span>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {adminNav.map(({ id, icon: Icon, label, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', marginBottom: 3, textAlign: 'left',
                background: activeTab === id ? 'rgba(22,163,74,0.15)' : 'transparent',
                color: activeTab === id ? '#4ade80' : '#94a3b8',
                fontSize: 13.5, fontWeight: activeTab === id ? 600 : 400,
              }}
            >
              <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
              {label}
              {count !== null && (
                <span style={{ marginLeft: 'auto', background: activeTab === id ? 'rgba(22,163,74,0.2)' : 'rgba(255,255,255,0.06)', color: activeTab === id ? '#4ade80' : '#64748b', fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 12 }}>{count}</span>
              )}
            </button>
          ))}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '12px 0', paddingTop: 12 }}>
            <button
              onClick={() => navigate('dashboard')}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: '#64748b', fontSize: 13.5, textAlign: 'left' }}
            >
              <Database style={{ width: 15, height: 15 }} />
              Volver al dashboard
            </button>
          </div>
        </nav>

        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, background: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
              MA
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: 'white' }}>María Alvarez</div>
              <div style={{ fontSize: 11, color: '#475569' }}>Administradora técnica</div>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: 20, fontSize: 11.5, fontWeight: 600, marginBottom: 10, border: '1px solid #fecaca' }}>
              <Shield style={{ width: 12, height: 12 }} /> Acceso restringido al equipo técnico
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#0f172a', margin: 0, marginBottom: 4 }}>Panel de administración técnica</h1>
            <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>Gestión de rulebooks, documentos RAG, validaciones y configuración del sistema DSS.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '9px 14px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              <RefreshCw style={{ width: 14, height: 14 }} /> Sincronizar
            </button>
            <button style={{ background: '#16a34a', color: 'white', border: 'none', padding: '9px 16px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Upload style={{ width: 14, height: 14 }} /> Cargar archivo
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { icon: BookOpen, label: 'Rulebooks activos', value: '4', sub: '2 en revisión', color: '#16a34a', bg: '#f0fdf4', iconBg: '#dcfce7' },
            { icon: FileText, label: 'Documentos indexados', value: '4', sub: '1 procesando, 1 error', color: '#0891b2', bg: '#ecfeff', iconBg: '#cffafe' },
            { icon: Database, label: 'Fragmentos RAG', value: '365', sub: 'Listos para recuperación', color: '#7c3aed', bg: '#faf5ff', iconBg: '#ede9fe' },
            { icon: CheckCircle2, label: 'Validaciones pendientes', value: '3', sub: 'Por experto agrónomo', color: '#d97706', bg: '#fffbeb', iconBg: '#fef3c7' },
          ].map(({ icon: Icon, label, value, sub, color, bg, iconBg }) => (
            <div key={label} style={{ background: 'white', borderRadius: 14, padding: '16px 20px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Icon style={{ width: 18, height: 18, color }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{value}</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 11, color, fontWeight: 600 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {adminNav.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                padding: '8px 16px', borderRadius: 9, border: `1.5px solid ${activeTab === id ? '#16a34a' : '#e2e8f0'}`,
                background: activeTab === id ? '#f0fdf4' : 'white',
                color: activeTab === id ? '#15803d' : '#64748b',
                fontSize: 13.5, fontWeight: activeTab === id ? 600 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Icon style={{ width: 14, height: 14 }} /> {label}
            </button>
          ))}
        </div>

        {activeTab === 'rulebooks' && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
              <BookOpen style={{ width: 16, height: 16, color: '#16a34a' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Rulebooks de evaluación</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative' }}>
                  <Search style={{ width: 14, height: 14, color: '#94a3b8', position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <input placeholder="Buscar cultivo..." style={{ paddingLeft: 32, padding: '7px 12px 7px 32px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', width: 180 }} />
                </div>
                <button style={{ background: '#16a34a', color: 'white', border: 'none', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus style={{ width: 13, height: 13 }} /> Cargar rulebook
                </button>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Cultivo', 'Versión', 'N° criterios', 'Estado', 'Última actualización', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rulebooks.map((rb, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{rb.cultivo}</td>
                    <td style={{ padding: '13px 16px' }}><code style={{ background: '#f8fafc', padding: '3px 8px', borderRadius: 6, fontSize: 12.5, color: '#475569', fontFamily: 'monospace' }}>{rb.version}</code></td>
                    <td style={{ padding: '13px 16px', fontSize: 13.5, color: '#475569', fontWeight: 600 }}>{rb.criterios} criterios</td>
                    <td style={{ padding: '13px 16px' }}><div style={{ background: rb.estadoBg, color: rb.estadoColor, fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20, display: 'inline-block' }}>{rb.estado}</div></td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748b' }}>{rb.updated}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#475569' }}>Editar</button>
                        <button style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#16a34a' }}>Ver</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'docs' && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
              <FileText style={{ width: 16, height: 16, color: '#0891b2' }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>Documentos de base de conocimiento RAG</div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13, color: '#475569', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Filter style={{ width: 13, height: 13 }} /> Filtrar
                </button>
                <button style={{ background: '#0891b2', color: 'white', border: 'none', padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Upload style={{ width: 13, height: 13 }} /> Cargar documento
                </button>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  {['Nombre del documento', 'Fuente', 'Estado de indexación', 'Fragmentos generados', 'Actualizado', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ragDocs.map((doc, i) => (
                  <tr key={i} style={{ borderTop: '1px solid #f8fafc' }}>
                    <td style={{ padding: '13px 16px', maxWidth: 280 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0f172a' }}>{doc.name}</div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#475569', fontWeight: 500 }}>{doc.source}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {doc.estado === 'Indexado' ? <CheckCircle2 style={{ width: 13, height: 13, color: '#16a34a' }} /> : doc.estado === 'Procesando' ? <Clock style={{ width: 13, height: 13, color: '#d97706' }} /> : <AlertTriangle style={{ width: 13, height: 13, color: '#dc2626' }} />}
                        <div style={{ background: doc.estadoBg, color: doc.estadoColor, fontSize: 11.5, fontWeight: 600, padding: '3px 9px', borderRadius: 20 }}>{doc.estado}</div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13.5, fontWeight: 700, color: doc.fragmentos > 0 ? '#0891b2' : '#94a3b8' }}>
                      {doc.fragmentos > 0 ? `${doc.fragmentos} frags.` : '—'}
                    </td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748b' }}>{doc.updated}</td>
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {doc.estado === 'Error' && (
                          <button style={{ background: '#fee2e2', border: 'none', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <RefreshCw style={{ width: 11, height: 11 }} /> Reintentar
                          </button>
                        )}
                        <button style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, padding: '5px 10px', cursor: 'pointer', fontSize: 12, color: '#475569' }}>Ver</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {(activeTab === 'validations' || activeTab === 'settings') && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '40px', textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              {activeTab === 'validations' ? <CheckCircle2 style={{ width: 28, height: 28, color: '#94a3b8' }} /> : <Settings style={{ width: 28, height: 28, color: '#94a3b8' }} />}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>
              {activeTab === 'validations' ? 'Panel de validaciones' : 'Configuración del sistema'}
            </div>
            <div style={{ fontSize: 14, color: '#64748b' }}>
              {activeTab === 'validations' ? '3 evaluaciones pendientes de validación por el equipo técnico.' : 'Parámetros de configuración del motor MCDA y modelos LLM.'}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
