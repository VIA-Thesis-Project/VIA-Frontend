import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Copy, Edit3, Eye, MapPin, Plus, RefreshCcw, Search, Trash2, X } from 'lucide-react';
import { NavigateFn } from '@/app/navigation/navigation';
import { readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';
import { Parcel } from '@/features/evaluations/domain/parcel';
import { ParcelApiRepository } from '@/features/evaluations/infrastructure/api/parcelApiRepository';
import { saveDetailParcelId } from '@/features/evaluations/infrastructure/session/selectedParcelStorage';
import Sidebar from '@/shared/presentation/layouts/Sidebar';

interface Props { navigate: NavigateFn; }

type AreaFilter = 'all' | 'with-area' | 'without-area';

type EditForm = {
  name: string;
  description: string;
  crs: string;
};

const parcelRepository = new ParcelApiRepository();

function extractAreaHa(parcel: Parcel): number | null {
  const match = parcel.metadata.description.match(/Area estimada:\s*([0-9.,]+)/i);
  if (!match) return null;
  const value = Number(match[1].replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

function formatArea(parcel: Parcel): string {
  const area = extractAreaHa(parcel);
  return area === null ? 'Sin area registrada' : `${area.toFixed(2)} ha`;
}

function countGeometryPoints(parcel: Parcel): number {
  const [firstRing] = parcel.geometry.coordinates;
  if (!Array.isArray(firstRing)) return 0;
  const ring = parcel.geometry.type === 'MultiPolygon' ? firstRing[0] : firstRing;
  return Array.isArray(ring) ? ring.length : 0;
}

export default function Parcels({ navigate }: Props) {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('all');
  const [editingParcel, setEditingParcel] = useState<Parcel | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ name: '', description: '', crs: 'EPSG:4326' });

  const session = readAuthSession();

  const loadParcels = async () => {
    if (!session) {
      setError('Inicia sesion para consultar tus parcelas registradas.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await parcelRepository.listParcels(session.accessToken);
      setParcels(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las parcelas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadParcels();
  }, []);

  const areaValues = useMemo(() => parcels.map(extractAreaHa).filter((area): area is number => area !== null), [parcels]);
  const totalArea = areaValues.reduce((sum, area) => sum + area, 0);
  const parcelsWithArea = areaValues.length;
  const parcelsWithoutArea = Math.max(parcels.length - parcelsWithArea, 0);

  const filteredParcels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return parcels.filter((parcel) => {
      const area = extractAreaHa(parcel);
      const matchesArea = areaFilter === 'all'
        || (areaFilter === 'with-area' && area !== null)
        || (areaFilter === 'without-area' && area === null);

      const searchable = [
        parcel.metadata.name,
        parcel.metadata.description,
        parcel.metadata.crs,
        parcel.id,
      ].join(' ').toLowerCase();

      return matchesArea && (!normalizedQuery || searchable.includes(normalizedQuery));
    });
  }, [areaFilter, parcels, query]);

  const openEdit = (parcel: Parcel) => {
    setEditingParcel(parcel);
    setEditForm({
      name: parcel.metadata.name,
      description: parcel.metadata.description,
      crs: parcel.metadata.crs,
    });
    setError(null);
    setNotice(null);
  };

  const closeEdit = () => {
    setEditingParcel(null);
    setSaving(false);
  };

  const saveEdit = async () => {
    if (!session || !editingParcel) return;

    if (!editForm.name.trim()) {
      setError('El nombre de la parcela es obligatorio.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await parcelRepository.updateParcel(
        editingParcel.id,
        {
          metadata: {
            name: editForm.name.trim(),
            description: editForm.description.trim() || 'Sin descripcion registrada',
            crs: editForm.crs.trim() || 'EPSG:4326',
          },
        },
        session.accessToken,
      );

      setParcels((current) => current.map((parcel) => parcel.id === updated.id ? updated : parcel));
      setNotice('Parcela actualizada correctamente.');
      closeEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la parcela.');
    } finally {
      setSaving(false);
    }
  };

  const deleteParcel = async (parcel: Parcel) => {
    if (!session) return;
    const confirmed = window.confirm(`Eliminar "${parcel.metadata.name}"? Esta accion no se puede deshacer.`);
    if (!confirmed) return;

    setDeletingId(parcel.id);
    setError(null);
    setNotice(null);
    try {
      await parcelRepository.deleteParcel(parcel.id, session.accessToken);
      setParcels((current) => current.filter((item) => item.id !== parcel.id));
      setNotice('Parcela eliminada correctamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo eliminar la parcela. Verifica si el backend expone DELETE /parcelas/:id.');
    } finally {
      setDeletingId(null);
    }
  };

  const copyParcelId = async (parcelId: string) => {
    await navigator.clipboard?.writeText(parcelId);
    setNotice('ID de parcela copiado.');
  };

  const openParcelDetail = (parcel: Parcel) => {
    saveDetailParcelId(parcel.id);
    navigate('parcel-detail');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="parcels" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <button onClick={() => navigate('dashboard')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', padding: 0 }}>Dashboard</button>
              <span style={{ color: '#e2e8f0' }}>/</span>
              <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>Parcelas</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, marginBottom: 4 }}>Parcelas registradas</h1>
            <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>Gestion de parcelas conectada al backend desplegado de VIA.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={loadParcels}
              disabled={loading}
              style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '9px 14px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <RefreshCcw style={{ width: 15, height: 15 }} />
              Sincronizar
            </button>
            <button
              onClick={() => navigate('new-evaluation')}
              title="Delimita una parcela nueva e inicia su evaluacion"
              style={{ background: '#16a34a', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
            >
              <Plus style={{ width: 15, height: 15 }} />
              Nueva evaluacion
            </button>
          </div>
        </div>

        {(error || notice) && (
          <div style={{ marginBottom: 16, borderRadius: 12, padding: '12px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${error ? '#fecaca' : '#bbf7d0'}`, background: error ? '#fef2f2' : '#f0fdf4', color: error ? '#991b1b' : '#166534' }}>
            {error ? <AlertTriangle style={{ width: 16, height: 16 }} /> : <Check style={{ width: 16, height: 16 }} />}
            {error ?? notice}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 18 }}>
          {[
            { label: 'Total parcelas', value: parcels.length, color: '#16a34a', sub: 'desde /parcelas' },
            { label: 'Area registrada', value: `${totalArea.toFixed(2)} ha`, color: '#0891b2', sub: `${parcelsWithArea} con area` },
            { label: 'Sin area', value: parcelsWithoutArea, color: '#d97706', sub: 'requieren revision' },
            { label: 'Resultados filtrados', value: filteredParcels.length, color: '#7c3aed', sub: 'vista actual' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'white', borderRadius: 14, padding: 18, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 26, color: '#0f172a', fontWeight: 800 }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: stat.color, fontWeight: 700, marginTop: 4 }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Lista de parcelas</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Edita metadatos, copia IDs o elimina registros del backend.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Search style={{ width: 15, height: 15, color: '#94a3b8', position: 'absolute', left: 12, top: 10 }} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar parcela..."
                  style={{ width: 230, padding: '9px 12px 9px 34px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, outline: 'none', color: '#0f172a' }}
                />
              </div>
              <select
                value={areaFilter}
                onChange={(event) => setAreaFilter(event.target.value as AreaFilter)}
                style={{ padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#475569', background: 'white', outline: 'none' }}
              >
                <option value="all">Todas</option>
                <option value="with-area">Con area</option>
                <option value="without-area">Sin area</option>
              </select>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                {['Parcela', 'Area', 'Geometria', 'CRS', 'ID backend', 'Acciones'].map((header) => (
                  <th key={header} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} style={{ padding: 20, color: '#64748b', fontSize: 13 }}>Consultando parcelas...</td>
                </tr>
              )}
              {!loading && filteredParcels.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: 28, textAlign: 'center' }}>
                    <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 700, marginBottom: 4 }}>No hay parcelas para mostrar</div>
                    <div style={{ fontSize: 12.5, color: '#64748b' }}>Prueba limpiar filtros o registra una nueva parcela.</div>
                  </td>
                </tr>
              )}
              {!loading && filteredParcels.map((parcel) => (
                <tr key={parcel.id} style={{ borderTop: '1px solid #f8fafc' }}>
                  <td style={{ padding: '14px 18px', maxWidth: 340 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <MapPin style={{ width: 17, height: 17, color: '#16a34a' }} />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{parcel.metadata.name}</div>
                        <div style={{ fontSize: 11.5, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{parcel.metadata.description}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 13, color: extractAreaHa(parcel) === null ? '#d97706' : '#15803d', fontWeight: 700 }}>{formatArea(parcel)}</td>
                  <td style={{ padding: '14px 18px', fontSize: 13, color: '#475569' }}>
                    {parcel.geometry.type}
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{countGeometryPoints(parcel)} puntos</div>
                  </td>
                  <td style={{ padding: '14px 18px', fontSize: 13, color: '#475569', fontWeight: 600 }}>{parcel.metadata.crs}</td>
                  <td style={{ padding: '14px 18px' }}>
                    <button onClick={() => copyParcelId(parcel.id)} style={{ border: '1px solid #e2e8f0', background: 'white', borderRadius: 8, padding: '6px 9px', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                      <Copy style={{ width: 12, height: 12 }} />
                      {parcel.id.slice(0, 8)}
                    </button>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <button onClick={() => openParcelDetail(parcel)} title="Ver detalle y evaluaciones" style={{ border: '1px solid #dbeafe', background: '#eff6ff', color: '#2563eb', borderRadius: 8, padding: 7, cursor: 'pointer' }}>
                        <Eye style={{ width: 14, height: 14 }} />
                      </button>
                      <button onClick={() => openEdit(parcel)} title="Editar metadatos" style={{ border: '1px solid #e2e8f0', background: 'white', color: '#475569', borderRadius: 8, padding: 7, cursor: 'pointer' }}>
                        <Edit3 style={{ width: 14, height: 14 }} />
                      </button>
                      <button onClick={() => deleteParcel(parcel)} disabled={deletingId === parcel.id} title="Eliminar parcela" style={{ border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', borderRadius: 8, padding: 7, cursor: deletingId === parcel.id ? 'not-allowed' : 'pointer', opacity: deletingId === parcel.id ? 0.6 : 1 }}>
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {editingParcel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 'min(560px, 100%)', background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 20px 45px rgba(15,23,42,0.22)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Editar parcela</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>ID {editingParcel.id}</div>
              </div>
              <button onClick={closeEdit} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 7, cursor: 'pointer', color: '#64748b' }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 13 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, color: '#475569', fontWeight: 700 }}>
                Nombre
                <input value={editForm.name} onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))} style={{ padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13.5, color: '#0f172a', outline: 'none' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, color: '#475569', fontWeight: 700 }}>
                Descripcion
                <textarea value={editForm.description} onChange={(event) => setEditForm((current) => ({ ...current, description: event.target.value }))} rows={4} style={{ padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13.5, color: '#0f172a', outline: 'none', resize: 'vertical' }} />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5, color: '#475569', fontWeight: 700 }}>
                CRS
                <input value={editForm.crs} onChange={(event) => setEditForm((current) => ({ ...current, crs: event.target.value }))} style={{ padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13.5, color: '#0f172a', outline: 'none' }} />
              </label>
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={closeEdit} style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={saveEdit} disabled={saving} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
