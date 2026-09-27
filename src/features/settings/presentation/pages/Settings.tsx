import { useEffect, useState } from 'react';
import { Check, RotateCcw, Save, SlidersHorizontal } from 'lucide-react';
import { NavigateFn } from '@/app/navigation/navigation';
import { readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';
import { getViabilityPolicy, updateViabilityPolicy, ViabilityPolicy } from '@/features/settings/infrastructure/viabilityPolicyApi';
import { ApiError } from '@/shared/infrastructure/http/apiClient';
import Sidebar from '@/shared/presentation/layouts/Sidebar';

interface Props { navigate: NavigateFn; }

export default function Settings({ navigate }: Props) {
  const [policy, setPolicy] = useState<ViabilityPolicy | null>(null);
  const [viablePct, setViablePct] = useState(0);
  const [condicionalPct, setCondicionalPct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canEdit = readAuthSession()?.user.role === 'admin';

  const showPolicy = (snapshot: ViabilityPolicy) => {
    setPolicy(snapshot);
    setViablePct(snapshot.viable_from);
    setCondicionalPct(snapshot.conditional_from);
  };

  useEffect(() => {
    let active = true;
    getViabilityPolicy()
      .then((snapshot) => { if (active) showPolicy(snapshot); })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'No se pudo cargar la política.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const isConsistent = Number.isFinite(condicionalPct) && Number.isFinite(viablePct)
    && condicionalPct >= 0 && viablePct <= 100 && condicionalPct < viablePct;

  const save = async () => {
    if (!policy || !canEdit || !isConsistent || saving) return;
    setNotice(null);
    setError(null);
    setSaving(true);
    try {
      showPolicy(await updateViabilityPolicy(policy, condicionalPct, viablePct));
      setNotice('Umbrales guardados para las próximas evaluaciones.');
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 409) {
        try {
          showPolicy(await getViabilityPolicy());
          setError('Otro administrador cambió los umbrales. Se cargó la configuración vigente.');
        } catch {
          setError('Otro administrador cambió los umbrales. Recarga la pantalla.');
        }
      } else if (reason instanceof ApiError && reason.status === 403) {
        setError('Solo un administrador puede modificar los umbrales.');
      } else {
        setError(reason instanceof Error ? reason.message : 'No se pudieron guardar los umbrales.');
      }
    } finally {
      setSaving(false);
    }
  };

  const restoreDefaults = () => {
    if (!policy || !canEdit) return;
    setViablePct(policy.default_configuration.viable_from);
    setCondicionalPct(policy.default_configuration.conditional_from);
    setError(null);
    setNotice('Valores iniciales cargados en el formulario. Pulsa Guardar para aplicarlos.');
  };

  const zones = [
    { label: 'No viable', from: 0, to: condicionalPct, color: '#dc2626', bg: '#fee2e2' },
    { label: 'Condicional', from: condicionalPct, to: viablePct, color: '#d97706', bg: '#fde68a' },
    { label: 'Viable', from: viablePct, to: 100, color: '#15803d', bg: '#bbf7d0' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="settings" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <button onClick={() => navigate('dashboard')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', padding: 0 }}>Dashboard</button>
            <span style={{ color: '#e2e8f0' }}>/</span>
            <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>Umbral de viabilidad</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: 0, marginBottom: 4 }}>Umbral de viabilidad</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, maxWidth: 640 }}>
            Define los rangos de score que determinan la categoria de viabilidad de cada cultivo.
          </p>
        </div>

        {(error || notice) && (
          <div style={{ marginBottom: 16, borderRadius: 12, padding: '12px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, maxWidth: 720, border: `1px solid ${error ? '#fecaca' : '#bbf7d0'}`, background: error ? '#fef2f2' : '#f0fdf4', color: error ? '#991b1b' : '#166534' }}>
            <Check style={{ width: 16, height: 16, flexShrink: 0 }} />
            {error ?? notice}
          </div>
        )}

        {loading && <p role="status">Cargando umbrales...</p>}
        {!loading && !policy && <button onClick={() => window.location.reload()}>Reintentar carga</button>}
        {!loading && policy && !canEdit && (
          <div style={{ maxWidth: 720, width: '100%', boxSizing: 'border-box', margin: '0 auto 16px', padding: '12px 14px', border: '1px solid #dbeafe', borderRadius: 10, background: '#eff6ff', color: '#1e40af', fontSize: 13, lineHeight: 1.5, fontWeight: 600 }}>
            Los umbrales globales están disponibles en modo de solo lectura para tu cuenta.
          </div>
        )}

        {policy && <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 24, width: '100%', maxWidth: 720, boxSizing: 'border-box', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}>
            <SlidersHorizontal style={{ width: 16, height: 16, color: '#16a34a' }} />
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>Configuración del umbral</div>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px', lineHeight: 1.55 }}>
            Cada cultivo recibe un score entre 0% y 100%. El score define su categoria segun estos
            umbrales: <strong>viable</strong> desde el umbral superior, <strong>condicional</strong> entre
            ambos, y <strong>no viable</strong> por debajo. Los cambios aplican a las evaluaciones que
            inicies a partir de ahora; los resultados ya calculados no se modifican.
          </p>

          {/* Vista previa de rangos */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', height: 34, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              {zones.map((zone) => {
                const width = Math.max(zone.to - zone.from, 0);
                return (
                  <div key={zone.label} style={{ width: `${width}%`, background: zone.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0, transition: 'width 160ms ease' }}>
                    {width >= 12 && (
                      <span style={{ fontSize: 11, fontWeight: 800, color: zone.color, whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {zone.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>0%</span>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>100%</span>
            </div>
          </div>

          {/* Controles */}
          {[
            {
              label: 'Umbral viable',
              hint: 'Score minimo para que un cultivo sea VIABLE.',
              value: viablePct,
              setValue: setViablePct,
              color: '#15803d',
              min: 1,
              max: 100,
            },
            {
              label: 'Umbral condicional',
              hint: 'Score minimo para que un cultivo sea CONDICIONAL. Debe ser menor que el umbral viable.',
              value: condicionalPct,
              setValue: setCondicionalPct,
              color: '#d97706',
              min: 0,
              max: 99,
            },
          ].map(({ label, hint, value, setValue, color, min, max }) => (
            <div key={label} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{label}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{hint}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={value}
                    disabled={!canEdit || saving}
                    onChange={(event) => setValue(Number(event.target.value))}
                    style={{ width: 64, padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, fontWeight: 700, color, textAlign: 'right', outline: 'none' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>%</span>
                </div>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                value={value}
                disabled={!canEdit || saving}
                onChange={(event) => setValue(Number(event.target.value))}
                style={{ width: '100%', accentColor: color }}
              />
            </div>
          ))}

          {canEdit && !isConsistent && (
            <div style={{ marginBottom: 16, borderRadius: 8, padding: '10px 12px', fontSize: 12, border: '1px solid #fecaca', background: '#fef2f2', color: '#991b1b' }}>
              El umbral condicional debe ser menor que el viable, y ambos estar entre 0% y 100%.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {canEdit && <button
              onClick={save}
              disabled={!isConsistent || saving}
              style={{ background: isConsistent ? '#16a34a' : '#e2e8f0', color: isConsistent ? 'white' : '#94a3b8', border: 'none', padding: '10px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: isConsistent ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <Save style={{ width: 14, height: 14 }} />
              {saving ? 'Guardando...' : 'Guardar umbrales'}
            </button>}
            {canEdit && <button
              onClick={restoreDefaults}
              disabled={saving}
              style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <RotateCcw style={{ width: 14, height: 14 }} />
              Restaurar por defecto
            </button>}
            {viablePct === policy.default_configuration.viable_from && condicionalPct === policy.default_configuration.conditional_from && (
              <span style={{ fontSize: 12, color: '#94a3b8' }}>Valores iniciales: {policy.default_configuration.viable_from}% / {policy.default_configuration.conditional_from}%.</span>
            )}
          </div>
        </div>}
      </main>
    </div>
  );
}
