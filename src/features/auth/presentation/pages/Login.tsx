import { useState } from 'react';
import { Leaf, Eye, EyeOff, Shield, Users, Lock } from 'lucide-react';
import { NavigateFn } from '@/app/navigation/navigation';
import { authenticateUser } from '@/features/auth/application/authenticateUser';
import { AuthApiRepository } from '@/features/auth/infrastructure/api/authApiRepository';
import { saveAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';

interface Props { navigate: NavigateFn; }

const authRepository = new AuthApiRepository();

export default function Login({ navigate }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      const session = await authenticateUser(authRepository, { email, password });
      saveAuthSession(session);
      navigate('dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfeff 50%, #f8fafc 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Background pattern */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.3 }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="loginGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#16a34a" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#loginGrid)" />
        </svg>
      </div>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440 }}>
        {/* Card */}
        <div style={{ background: 'white', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {/* Header strip */}
          <div style={{ background: 'linear-gradient(135deg, #15803d, #0891b2)', padding: '28px 32px', textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Leaf style={{ width: 28, height: 28, color: 'white' }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 4 }}>AgroViabilidad DSS</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Sistema de apoyo a decisiones agrícolas</div>
          </div>

          {/* Form */}
          <div style={{ padding: '32px' }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Correo electrónico</div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void handleLogin(); }}
                placeholder="usuario@agro.pe"
                style={{
                  width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
                  fontSize: 14, color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
                onFocus={e => (e.target.style.borderColor = '#16a34a')}
                onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Contraseña</div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') void handleLogin(); }}
                  placeholder="••••••••"
                  style={{
                    width: '100%', padding: '11px 44px 11px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
                    fontSize: 14, color: '#0f172a', background: '#f8fafc', outline: 'none', boxSizing: 'border-box',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#16a34a')}
                  onBlur={e => (e.target.style.borderColor = '#e2e8f0')}
                />
                <button
                  onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
                >
                  {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: 6 }}>
                <a href="#" style={{ fontSize: 12, color: '#16a34a', textDecoration: 'none', fontWeight: 500 }}>¿Olvidaste tu contraseña?</a>
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 9, background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12.5, lineHeight: 1.45 }}>
                {error}
              </div>
            )}

            <button
              onClick={() => void handleLogin()}
              disabled={loading}
              style={{
                width: '100%', background: loading ? '#86efac' : '#16a34a', color: 'white', border: 'none',
                padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s',
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Verificando...
                </>
              ) : (
                <>
                  <Lock style={{ width: 15, height: 15 }} />
                  Ingresar al sistema
                </>
              )}
            </button>

            <div style={{ position: 'relative', margin: '20px 0', textAlign: 'center' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: '#f1f5f9' }} />
              <span style={{ position: 'relative', background: 'white', padding: '0 12px', fontSize: 12, color: '#94a3b8' }}>o</span>
            </div>

            <button
              onClick={() => navigate('dashboard')}
              style={{
                width: '100%', background: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0',
                padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              }}
            >
              Continuar como demo
            </button>

            <div style={{ marginTop: 24, padding: 14, background: '#f0fdf4', borderRadius: 10, border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <Users style={{ width: 15, height: 15, color: '#16a34a', marginTop: 1, flexShrink: 0 }} />
                <p style={{ fontSize: 12.5, color: '#166534', lineHeight: 1.55, margin: 0 }}>
                  Acceso para <strong>productores, técnicos agrónomos</strong> y equipo de validación. Rol determinado automáticamente al ingresar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Shield style={{ width: 12, height: 12, color: '#94a3b8' }} />
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Conexión segura · Datos protegidos · Acceso autenticado</span>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
