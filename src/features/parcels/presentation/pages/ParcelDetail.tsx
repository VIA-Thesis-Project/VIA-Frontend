import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Polygon, TileLayer } from 'react-leaflet';
import { AlertTriangle, ArrowLeft, Check, Edit3, History, MapPin, Play, X } from 'lucide-react';
import { NavigateFn } from '@/app/navigation/navigation';
import { readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';
import { getCropLabel } from '@/features/evaluations/application/cropCatalog';
import { EvaluationSummary } from '@/features/evaluations/domain/evaluation';
import { GeoJsonGeometry, Parcel } from '@/features/evaluations/domain/parcel';
import { EvaluationApiRepository } from '@/features/evaluations/infrastructure/api/evaluationApiRepository';
import { ParcelApiRepository } from '@/features/evaluations/infrastructure/api/parcelApiRepository';
import { saveCurrentEvaluation } from '@/features/evaluations/infrastructure/session/currentEvaluationStorage';
import { readDetailParcelId, saveSelectedParcelId } from '@/features/evaluations/infrastructure/session/selectedParcelStorage';
import { calculateAreaHa, geoJsonToPoints, ParcelDrawMap, pointsToGeoJson } from '@/features/evaluations/presentation/components/ParcelDrawMap';
import Sidebar from '@/shared/presentation/layouts/Sidebar';

interface Props { navigate: NavigateFn; }

const parcelRepository = new ParcelApiRepository();
const evaluationRepository = new EvaluationApiRepository();

const READY_STATUSES = new Set(['EVALUACION_COMPLETADA', 'RECOMENDACION_COMPLETADA']);
const IN_PROGRESS_STATUSES = new Set(['INICIADA', 'EXTRACCION_COMPLETADA']);

const statusLabels: Record<string, { label: string; bg: string; color: string }> = {
  INICIADA: { label: 'En proceso', bg: '#eff6ff', color: '#2563eb' },
  EXTRACCION_COMPLETADA: { label: 'En proceso', bg: '#eff6ff', color: '#2563eb' },
  EVALUACION_COMPLETADA: { label: 'Completada', bg: '#f0fdf4', color: '#15803d' },
  RECOMENDACION_COMPLETADA: { label: 'Completada', bg: '#f0fdf4', color: '#15803d' },
  FALLIDA: { label: 'Fallida', bg: '#fef2f2', color: '#dc2626' },
};

function statusChip(status: string) {
  return statusLabels[status] ?? { label: status, bg: '#f8fafc', color: '#64748b' };
}

function formatDate(value: string | null): string {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
}

function updateAreaInDescription(description: string, areaHa: number): string {
  const areaText = `Area estimada: ${areaHa.toFixed(2)}`;
  if (/Area estimada:\s*[0-9.,]+/i.test(description)) {
    return description.replace(/Area estimada:\s*[0-9.,]+/i, areaText);
  }
  return description ? `${description} - ${areaText}` : areaText;
}

export default function ParcelDetail({ navigate }: Props) {
  const parcelId = readDetailParcelId();
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [history, setHistory] = useState<EvaluationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [editingGeometry, setEditingGeometry] = useState(false);
  const [draftPoints, setDraftPoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [draftGeometry, setDraftGeometry] = useState<GeoJsonGeometry | null>(null);
  const [confirmingSave, setConfirmingSave] = useState(false);
  const [saving, setSaving] = useState(false);

  const session = readAuthSession();

  const viewPoints = useMemo(() => (parcel ? geoJsonToPoints(parcel.geometry) : []), [parcel]);
  const mapCenter = useMemo<[number, number]>(() => {
    if (viewPoints.length === 0) return [-12.0464, -77.0428];
    const lat = viewPoints.reduce((sum, point) => sum + point.lat, 0) / viewPoints.length;
    const lng = viewPoints.reduce((sum, point) => sum + point.lng, 0) / viewPoints.length;
    return [lat, lng];
  }, [viewPoints]);

  useEffect(() => {
    if (!parcelId || !session) {
      setError(parcelId ? 'Inicia sesion para ver la parcela.' : 'Selecciona una parcela desde la lista.');
      setLoading(false);
      setHistoryLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const loaded = await parcelRepository.getParcel(parcelId, session.accessToken);
        if (!cancelled) setParcel(loaded);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudo cargar la parcela.');
      } finally {
        if (!cancelled) setLoading(false);
      }

      try {
        const summaries = await evaluationRepository.listEvaluationsForParcel(parcelId);
        if (!cancelled) setHistory(summaries);
      } catch {
        if (!cancelled) setHistory([]);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    void load();
    return () => { cancelled = true; };
  }, [parcelId]);

  const startGeometryEdit = () => {
    setDraftPoints(viewPoints);
    setDraftGeometry(parcel?.geometry ?? null);
    setEditingGeometry(true);
    setNotice(null);
    setError(null);
  };

  const cancelGeometryEdit = () => {
    setEditingGeometry(false);
    setConfirmingSave(false);
    setDraftPoints([]);
    setDraftGeometry(null);
  };

  const requestSaveGeometry = () => {
    if (!draftGeometry || draftPoints.length < 3) {
      setError('La nueva geometria necesita al menos 3 vertices.');
      return;
    }
    setError(null);
    setConfirmingSave(true);
  };

  const saveGeometry = async () => {
    if (!session || !parcel || !draftGeometry) return;

    setSaving(true);
    setError(null);
    try {
      const newAreaHa = calculateAreaHa(draftPoints);
      const updated = await parcelRepository.updateParcel(
        parcel.id,
        {
          geometry: draftGeometry,
          metadata: {
            name: parcel.metadata.name,
            description: updateAreaInDescription(parcel.metadata.description, newAreaHa),
            crs: parcel.metadata.crs,
          },
        },
        session.accessToken,
      );
      setParcel(updated);
      setNotice(
        history.length > 0
          ? 'Geometria actualizada. Las evaluaciones anteriores corresponden a la geometria previa; considera reevaluar.'
          : 'Geometria actualizada correctamente.',
      );
      cancelGeometryEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la geometria.');
      setConfirmingSave(false);
    } finally {
      setSaving(false);
    }
  };

  const startEvaluation = () => {
    if (!parcel) return;
    saveSelectedParcelId(parcel.id);
    navigate('new-evaluation');
  };

  const openEvaluation = (summary: EvaluationSummary) => {
    if (!parcel) return;
    saveCurrentEvaluation({
      parcelId: parcel.id,
      parcelName: parcel.metadata.name,
      parcelLocation: parcel.metadata.description,
      areaHa: 'Area no registrada',
      evaluationId: summary.evaluationId,
      cropCandidates: summary.cropCandidates.map((cropId) => ({ id: cropId, label: getCropLabel(cropId) })),
    });
    navigate(READY_STATUSES.has(summary.status) ? 'results' : 'processing');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <Sidebar active="parcels" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, padding: '28px 32px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <button onClick={() => navigate('parcels')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: 12, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ArrowLeft style={{ width: 12, height: 12 }} />
                Parcelas
              </button>
              <span style={{ color: '#e2e8f0' }}>/</span>
              <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>{parcel?.metadata.name ?? 'Detalle'}</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, marginBottom: 4 }}>
              {parcel?.metadata.name ?? 'Detalle de parcela'}
            </h1>
            <p style={{ fontSize: 13.5, color: '#64748b', margin: 0 }}>{parcel?.metadata.description ?? 'Cargando informacion de la parcela...'}</p>
          </div>
          {parcel && !editingGeometry && (
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={startGeometryEdit}
                style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '9px 14px', borderRadius: 9, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
              >
                <Edit3 style={{ width: 15, height: 15 }} />
                Editar geometria
              </button>
              <button
                onClick={startEvaluation}
                style={{ background: '#16a34a', color: 'white', border: 'none', padding: '9px 18px', borderRadius: 9, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7 }}
              >
                <Play style={{ width: 15, height: 15 }} />
                Nueva evaluacion
              </button>
            </div>
          )}
        </div>

        {(error || notice) && (
          <div style={{ marginBottom: 16, borderRadius: 12, padding: '12px 14px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, border: `1px solid ${error ? '#fecaca' : '#fde68a'}`, background: error ? '#fef2f2' : '#fffbeb', color: error ? '#991b1b' : '#92400e' }}>
            {error ? <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} /> : <Check style={{ width: 16, height: 16, flexShrink: 0 }} />}
            {error ?? notice}
          </div>
        )}

        {loading && <div style={{ color: '#64748b', fontSize: 13 }}>Cargando parcela...</div>}

        {!loading && parcel && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, marginBottom: 18 }}>
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 7 }}>
                    <MapPin style={{ width: 15, height: 15, color: '#16a34a' }} />
                    {editingGeometry ? 'Editando geometria' : 'Geometria registrada'}
                  </div>
                  {editingGeometry && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={cancelGeometryEdit} style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '7px 12px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                        Cancelar
                      </button>
                      <button onClick={requestSaveGeometry} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '7px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>
                        Guardar geometria
                      </button>
                    </div>
                  )}
                </div>
                <div style={{ height: 380 }}>
                  {editingGeometry ? (
                    <ParcelDrawMap
                      points={draftPoints}
                      onPointsChange={setDraftPoints}
                      onGeometryChange={setDraftGeometry}
                      onAreaChange={() => undefined}
                    />
                  ) : (
                    <MapContainer center={mapCenter} zoom={viewPoints.length > 0 ? 15 : 10} style={{ width: '100%', height: '100%' }} scrollWheelZoom>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {viewPoints.length >= 3 && (
                        <Polygon
                          positions={viewPoints.map((point) => [point.lat, point.lng] as [number, number])}
                          pathOptions={{ color: '#15803d', weight: 3, fillColor: '#16a34a', fillOpacity: 0.24 }}
                        />
                      )}
                    </MapContainer>
                  )}
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 18, alignSelf: 'start' }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', marginBottom: 14 }}>Datos de la parcela</div>
                {[
                  { label: 'Area registrada', value: `${calculateAreaHa(viewPoints).toFixed(2)} ha` },
                  { label: 'Geometria', value: `${parcel.geometry.type} · ${viewPoints.length} vertices` },
                  { label: 'CRS', value: parcel.metadata.crs },
                  { label: 'ID backend', value: parcel.id },
                  { label: 'Registrada', value: formatDate(parcel.createdAt) },
                  { label: 'Evaluaciones', value: historyLoading ? '...' : String(history.length) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ marginBottom: 11 }}>
                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 600, wordBreak: 'break-all' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
                <History style={{ width: 16, height: 16, color: '#16a34a' }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Historial de evaluaciones</div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>Todas las evaluaciones que solicitaste para esta parcela, de la mas reciente a la mas antigua.</div>
                </div>
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#fafafa' }}>
                    {['Fecha', 'Estado', 'Cultivos evaluados', 'Mejor cultivo', 'Acciones'].map((header) => (
                      <th key={header} style={{ padding: '11px 18px', textAlign: 'left', fontSize: 11.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {historyLoading && (
                    <tr><td colSpan={5} style={{ padding: 20, color: '#64748b', fontSize: 13 }}>Consultando evaluaciones...</td></tr>
                  )}
                  {!historyLoading && history.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: 28, textAlign: 'center' }}>
                        <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 700, marginBottom: 4 }}>Esta parcela aun no tiene evaluaciones</div>
                        <div style={{ fontSize: 12.5, color: '#64748b' }}>Inicia una nueva evaluacion para conocer su viabilidad agricola.</div>
                      </td>
                    </tr>
                  )}
                  {!historyLoading && history.map((summary) => {
                    const chip = statusChip(summary.status);
                    return (
                      <tr key={summary.evaluationId} style={{ borderTop: '1px solid #f8fafc' }}>
                        <td style={{ padding: '13px 18px', fontSize: 13, color: '#475569', whiteSpace: 'nowrap' }}>{formatDate(summary.createdAt)}</td>
                        <td style={{ padding: '13px 18px' }}>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: chip.bg, color: chip.color }}>{chip.label}</span>
                        </td>
                        <td style={{ padding: '13px 18px', fontSize: 12.5, color: '#475569', maxWidth: 260 }}>
                          {summary.cropCandidates.map(getCropLabel).join(', ') || '—'}
                        </td>
                        <td style={{ padding: '13px 18px', fontSize: 13 }}>
                          {summary.topCropId ? (
                            <span style={{ color: '#15803d', fontWeight: 700 }}>
                              {getCropLabel(summary.topCropId)}
                              {summary.topScore !== null && <span style={{ color: '#64748b', fontWeight: 600 }}> · {summary.topScore.toFixed(3)}</span>}
                            </span>
                          ) : (
                            <span style={{ color: '#94a3b8' }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '13px 18px' }}>
                          {(READY_STATUSES.has(summary.status) || IN_PROGRESS_STATUSES.has(summary.status)) && (
                            <button
                              onClick={() => openEvaluation(summary)}
                              style={{ border: '1px solid #dbeafe', background: '#eff6ff', color: '#2563eb', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}
                            >
                              {READY_STATUSES.has(summary.status) ? 'Ver resultados' : 'Ver progreso'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>

      {confirmingSave && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', zIndex: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: 'min(480px, 100%)', background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 20px 45px rgba(15,23,42,0.22)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle style={{ width: 17, height: 17, color: '#d97706' }} />
                Confirmar cambio de geometria
              </div>
              <button onClick={() => setConfirmingSave(false)} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 7, cursor: 'pointer', color: '#64748b' }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>
            <div style={{ padding: 20, fontSize: 13.5, color: '#475569', lineHeight: 1.6 }}>
              {history.length > 0 ? (
                <>
                  Esta parcela tiene <strong>{history.length} {history.length === 1 ? 'evaluacion' : 'evaluaciones'}</strong> realizada{history.length === 1 ? '' : 's'} con la geometria actual.
                  Al guardar el nuevo poligono, esos resultados <strong>seguiran correspondiendo a la geometria anterior</strong> y dejaran
                  de describir la parcela vigente. Te recomendamos iniciar una nueva evaluacion despues de guardar.
                </>
              ) : (
                <>Se reemplazara el poligono registrado de la parcela. Esta accion queda registrada en el historial de versiones.</>
              )}
            </div>
            <div style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button onClick={() => setConfirmingSave(false)} style={{ background: 'white', color: '#475569', border: '1.5px solid #e2e8f0', padding: '9px 14px', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => void saveGeometry()} disabled={saving} style={{ background: '#d97706', color: 'white', border: 'none', padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Guardando...' : 'Guardar nueva geometria'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
