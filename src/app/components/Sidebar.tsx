import { LayoutDashboard, Plus, Map, BarChart3, FileText, Settings, Leaf, LogOut } from 'lucide-react';
import { Screen, NavigateFn } from '../App';

interface Props {
  active: Screen;
  navigate: NavigateFn;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', screen: 'dashboard' as Screen },
  { icon: Plus, label: 'Nueva evaluación', screen: 'new-evaluation' as Screen },
  { icon: Map, label: 'Parcelas', screen: 'dashboard' as Screen },
  { icon: BarChart3, label: 'Resultados', screen: 'results' as Screen },
  { icon: FileText, label: 'Reportes', screen: 'report' as Screen },
  { icon: Settings, label: 'Configuración', screen: 'dashboard' as Screen },
];

export default function Sidebar({ active, navigate }: Props) {
  return (
    <aside
      className="flex flex-col bg-white border-r border-slate-200"
      style={{ width: 240, minHeight: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 40 }}
    >
      {/* Logo */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-xl"
            style={{ width: 36, height: 36, background: 'linear-gradient(135deg, #16a34a, #0891b2)' }}
          >
            <Leaf className="text-white" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <div className="text-slate-900" style={{ fontSize: 14, fontWeight: 700 }}>AgroViabilidad</div>
            <div className="text-slate-400" style={{ fontSize: 11 }}>DSS Agrícola · Lima, Perú</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3" style={{ paddingTop: 12 }}>
        <div className="mb-2 px-3" style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Principal
        </div>
        <div className="space-y-0.5">
          {navItems.map(({ icon: Icon, label, screen }) => {
            const isActive = active === screen && label !== 'Parcelas' && label !== 'Configuración';
            return (
              <button
                key={label}
                onClick={() => navigate(screen)}
                className="w-full flex items-center gap-3 rounded-lg transition-all"
                style={{
                  padding: '9px 12px',
                  background: isActive ? '#f0fdf4' : 'transparent',
                  color: isActive ? '#15803d' : '#64748b',
                  fontSize: 13.5,
                  fontWeight: isActive ? 600 : 400,
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Icon
                  style={{
                    width: 16,
                    height: 16,
                    color: isActive ? '#16a34a' : '#94a3b8',
                    flexShrink: 0,
                  }}
                />
                {label}
                {label === 'Nueva evaluación' && (
                  <span
                    className="ml-auto rounded-full text-white"
                    style={{ fontSize: 9, background: '#16a34a', padding: '1px 6px', fontWeight: 600 }}
                  >
                    +
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 mb-2 px-3" style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Admin
        </div>
        <button
          onClick={() => navigate('admin')}
          className="w-full flex items-center gap-3 rounded-lg transition-all"
          style={{
            padding: '9px 12px',
            background: active === 'admin' ? '#f0fdf4' : 'transparent',
            color: active === 'admin' ? '#15803d' : '#64748b',
            fontSize: 13.5,
            fontWeight: active === 'admin' ? 600 : 400,
            border: 'none',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Settings style={{ width: 16, height: 16, color: active === 'admin' ? '#16a34a' : '#94a3b8', flexShrink: 0 }} />
          Panel técnico
          <span className="ml-auto rounded" style={{ fontSize: 9, background: '#fee2e2', color: '#dc2626', padding: '1px 5px', fontWeight: 600 }}>Admin</span>
        </button>
      </nav>

      {/* User profile */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="flex items-center justify-center rounded-full text-white"
            style={{ width: 34, height: 34, background: '#0891b2', fontSize: 13, fontWeight: 700, flexShrink: 0 }}
          >
            JR
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-slate-900 truncate" style={{ fontSize: 13, fontWeight: 600 }}>Juan Ramírez</div>
            <div className="text-slate-400 truncate" style={{ fontSize: 11 }}>Técnico agrónomo</div>
          </div>
        </div>
        <button
          onClick={() => navigate('landing')}
          className="w-full flex items-center gap-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          style={{ padding: '7px 10px', fontSize: 12.5, background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <LogOut style={{ width: 14, height: 14 }} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
