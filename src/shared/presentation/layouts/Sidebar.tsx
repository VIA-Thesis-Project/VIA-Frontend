import { BarChart3, LayoutDashboard, LogOut, Map, Plus, Settings } from 'lucide-react';
import { NavigateFn, Screen } from '@/app/navigation/navigation';
import { clearAuthSession, readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';
import { UserRole } from '@/features/auth/domain/authSession';
import { ViaMark } from '@/shared/presentation/components/ViaMark';

interface Props {
  active: Screen;
  navigate: NavigateFn;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', screen: 'dashboard' as Screen },
  { icon: Plus, label: 'Nueva evaluacion', screen: 'new-evaluation' as Screen },
  { icon: Map, label: 'Parcelas', screen: 'parcels' as Screen },
  { icon: BarChart3, label: 'Resultados', screen: 'results' as Screen },
  { icon: Settings, label: 'Configuracion', screen: 'settings' as Screen },
];

const roleLabels: Record<string, string> = {
  ADMINISTRADOR: 'Administrador',
  ESPECIALISTA_TECNICO: 'Especialista tecnico',
  USUARIO_AGRICOLA: 'Usuario agricola',
};

function roleLabel(role: UserRole): string {
  return roleLabels[role] ?? role.replace(/_/g, ' ').toLowerCase();
}

function emailInitials(email: string): string {
  const localPart = email.split('@')[0] ?? '';
  const words = localPart.split(/[._-]+/).filter(Boolean);
  const initials = words.length >= 2
    ? `${words[0][0]}${words[1][0]}`
    : localPart.slice(0, 2);
  return initials.toUpperCase() || 'VIA';
}

export default function Sidebar({ active, navigate }: Props) {
  const session = readAuthSession();
  const email = session?.user.email ?? 'Sesion no iniciada';
  const role = session ? roleLabel(session.user.role) : 'Inicia sesion para continuar';
  const initials = session ? emailInitials(session.user.email) : '—';

  const handleLogout = () => {
    clearAuthSession();
    navigate('login');
  };

  return (
    <aside
      className="flex flex-col bg-white border-r border-slate-200"
      style={{ width: 240, minHeight: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 40 }}
    >
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <ViaMark size={36} />
          <div>
            <div className="text-slate-900" style={{ fontSize: 14, fontWeight: 800 }}>VIA</div>
            <div className="text-slate-400" style={{ fontSize: 11 }}>Viabilidad Agricola - Lima, Peru</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3" style={{ paddingTop: 12 }}>
        <div className="mb-2 px-3" style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Menu principal
        </div>
        <div className="space-y-0.5">
          {navItems.map(({ icon: Icon, label, screen }) => {
            const isActive = active === screen;
            return (
              <button
                key={label}
                onClick={() => navigate(screen)}
                className="w-full flex items-center gap-3 rounded-lg transition-all"
                style={{
                  padding: '9px 12px',
                  background: isActive ? '#f0fdf4' : 'transparent',
                  color: isActive ? '#15803d' : '#64748b',
                  fontSize: 13,
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
                {label === 'Nueva evaluacion' && (
                  <span
                    className="ml-auto rounded-full text-white"
                    style={{ fontSize: 10, background: '#16a34a', padding: '1px 6px', fontWeight: 600 }}
                  >
                    +
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="flex items-center justify-center rounded-full text-white"
            style={{ width: 34, height: 34, background: '#0891b2', fontSize: 13, fontWeight: 700, flexShrink: 0 }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-slate-900 truncate" style={{ fontSize: 13, fontWeight: 600 }} title={email}>{email}</div>
            <div className="text-slate-400 truncate" style={{ fontSize: 11 }}>{role}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          style={{ padding: '7px 10px', fontSize: 12, background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <LogOut style={{ width: 14, height: 14 }} />
          Cerrar sesion
        </button>
      </div>
    </aside>
  );
}
