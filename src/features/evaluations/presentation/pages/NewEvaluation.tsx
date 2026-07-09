import { ChangeEvent, useEffect, useState } from 'react';
import { ChevronRight, Edit3, MapPin, Square, Upload } from 'lucide-react';
import { NavigateFn } from '@/app/navigation/navigation';
import { cropCatalog } from '@/features/evaluations/application/cropCatalog';
import { startEvaluationWorkflow } from '@/features/evaluations/application/startEvaluationWorkflow';
import { EvaluationApiRepository } from '@/features/evaluations/infrastructure/api/evaluationApiRepository';
import { ParcelApiRepository } from '@/features/evaluations/infrastructure/api/parcelApiRepository';
import { readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';
import { saveCurrentEvaluation } from '@/features/evaluations/infrastructure/session/currentEvaluationStorage';
import { clearSelectedParcelId, readSelectedParcelId } from '@/features/evaluations/infrastructure/session/selectedParcelStorage';
import { GeoJsonGeometry, Parcel } from '@/features/evaluations/domain/parcel';
import { geoJsonToPoints, ParcelDrawMap } from '@/features/evaluations/presentation/components/ParcelDrawMap';
import Sidebar from '@/shared/presentation/layouts/Sidebar';

interface Props { navigate: NavigateFn; }

type InputMethod = 'draw' | 'upload' | 'select';

const parcelRepository = new ParcelApiRepository();
const evaluationRepository = new EvaluationApiRepository();
const cropOptions = cropCatalog;

function extractGeoJsonGeometry(payload: unknown): GeoJsonGeometry {
  if (!payload || typeof payload !== 'object') {
    throw new Error('El archivo no contiene JSON valido.');
  }

  const candidate = payload as {
    type?: string;
    geometry?: unknown;
    features?: unknown[];
    coordinates?: unknown[];
  };

  if (candidate.type === 'Feature' && candidate.geometry) {
    return extractGeoJsonGeometry(candidate.geometry);
  }

  if (candidate.type === 'FeatureCollection' && Array.isArray(candidate.features) && candidate.features[0]) {
    return extractGeoJsonGeometry(candidate.features[0]);
  }

  if ((candidate.type === 'Polygon' || candidate.type === 'MultiPolygon') && Array.isArray(candidate.coordinates)) {
    return {
      type: candidate.type,
      coordinates: candidate.coordinates,
    };
  }

  throw new Error('Solo se aceptan geometria Polygon o MultiPolygon en formato GeoJSON.');
}

export default function NewEvaluation({ navigate }: Props) {
  const selectedParcelFromList = readSelectedParcelId();
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [area, setArea] = useState('');
  const [method, setMethod] = useState<InputMethod>(selectedParcelFromList ? 'select' : 'draw');
  const [mapPoints, setMapPoints] = useState<Array<{ lat: number; lng: number }>>([]);
  const [geometry, setGeometry] = useState<GeoJsonGeometry | null>(null);
  const [existingParcels, setExistingParcels] = useState<Parcel[]>([]);
  const [selectedParcelId, setSelectedParcelId] = useState('');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [parcelsLoading, setParcelsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasValidGeometry = geometry !== null;
  const selectedParcel = existingParcels.find((parcel) => parcel.id === selectedParcelId) ?? null;

  useEffect(() => {
    if (method !== 'select') return undefined;

    const session = readAuthSession();
    if (!session) {
      setError('Inicia sesion para listar tus parcelas.');
      return undefined;
    }

    let cancelled = false;
    const loadParcels = async () => {
      setParcelsLoading(true);
      try {
        const parcels = await parcelRepository.listParcels(session.accessToken);
        if (!cancelled) {
          const preferredParcelId = readSelectedParcelId();
          const preferredParcel = preferredParcelId && parcels.some((parcel) => parcel.id === preferredParcelId)
            ? preferredParcelId
            : '';
          setExistingParcels(parcels);
          setSelectedParcelId((current) => current || preferredParcel || parcels[0]?.id || '');
          clearSelectedParcelId();
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudieron cargar las parcelas existentes.');
      } finally {
        if (!cancelled) setParcelsLoading(false);
      }
    };

    void loadParcels();
    return () => {
      cancelled = true;
    };
  }, [method]);

  const toggleCrop = (cropId: string) => {
    setSelectedCrops((prev) => prev.includes(cropId) ? prev.filter((id) => id !== cropId) : [...prev, cropId]);
  };

  const handleMethodChange = (nextMethod: InputMethod) => {
    setMethod(nextMethod);
    setError(null);
  };

  const handleGeoJsonUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const rawContent = await file.text();
      const parsed = JSON.parse(rawContent) as unknown;
      const nextGeometry = extractGeoJsonGeometry(parsed);
      const nextPoints = geoJsonToPoints(nextGeometry);

      if (nextPoints.length < 3) {
        throw new Error('El GeoJSON debe tener al menos 3 vertices.');
      }

      setGeometry(nextGeometry);
      setMapPoints(nextPoints);
      setMethod('upload');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo leer el archivo GeoJSON.');
    } finally {
      event.target.value = '';
    }
  };

  const handleStartEvaluation = async () => {
    if (method === 'select' && !selectedParcel) {
      setError('Selecciona una parcela existente antes de iniciar la evaluacion.');
      return;
    }

    if (method !== 'select' && !hasValidGeometry) {
      setError('Delimita una parcela en el mapa o carga un GeoJSON antes de iniciar la evaluacion.');
      return;
    }

    if (method !== 'select' && !name.trim()) {
      setError('Ingresa el nombre de la parcela antes de iniciar la evaluacion.');
      return;
    }

    if (selectedCrops.length === 0) {
      setError('Selecciona al menos un cultivo.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await startEvaluationWorkflow(
        parcelRepository,
        evaluationRepository,
        {
          name,
          district,
          areaHa: area || 'Area no calculada',
          selectedCropIds: selectedCrops,
          geometry,
          existingParcel: method === 'select' ? selectedParcel : null,
        },
      );

      saveCurrentEvaluation(result);
      navigate('processing');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar evaluacion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>
      <Sidebar active="new-evaluation" navigate={navigate} />

      <main style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ background: 'white', borderBottom: '1px solid #f1f5f9', padding: '12px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: 12, color: '#94a3b8', cursor: 'pointer' }} onClick={() => navigate('dashboard')}>Dashboard</div>
              <span style={{ color: '#e2e8f0' }}>/</span>
              <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Nueva evaluacion</div>
            </div>
            <h1 style={{ fontSize: 17, fontWeight: 700, color: '#0f172a', margin: 0 }}>Delimitacion de parcela</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {['Delimitar parcela', 'Procesar variables', 'Ver resultados'].map((step, index) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: index === 0 ? '#16a34a' : '#e2e8f0', color: index === 0 ? 'white' : '#94a3b8', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{index + 1}</div>
                <span style={{ fontSize: 12, color: index === 0 ? '#15803d' : '#94a3b8', fontWeight: index === 0 ? 600 : 400 }}>{step}</span>
                {index < 2 && <div style={{ width: 20, height: 1, background: '#e2e8f0', margin: '0 4px' }} />}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '380px 1fr', gap: 0, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ background: 'white', borderRight: '1px solid #f1f5f9', overflowY: 'auto', padding: '16px 20px' }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin style={{ width: 15, height: 15, color: '#16a34a' }} />
                Datos de la parcela
              </div>

              {[
                { label: 'Nombre de parcela', value: name, setter: setName, placeholder: 'Ej: Parcela Canete 01' },
                { label: 'Ubicacion / Distrito', value: district, setter: setDistrict, placeholder: 'Ej: Huaral, Lima' },
                { label: 'Area estimada (ha)', value: area, setter: setArea, placeholder: 'Se calcula al delimitar' },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 4 }}>{label}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(event) => setter(event.target.value)}
                    placeholder={placeholder}
                    style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13.5, color: '#0f172a', background: '#fafafa', outline: 'none', boxSizing: 'border-box' }}
                    onFocus={(event) => (event.target.style.borderColor = '#16a34a')}
                    onBlur={(event) => (event.target.style.borderColor = '#e2e8f0')}
                  />
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Metodo de ingreso de parcela</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[
                  { id: 'draw' as InputMethod, label: 'Dibujar poligono en mapa', icon: Edit3 },
                  { id: 'upload' as InputMethod, label: 'Cargar archivo GeoJSON', icon: Upload },
                  { id: 'select' as InputMethod, label: 'Seleccionar parcela existente', icon: Square },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleMethodChange(id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 9, border: `1.5px solid ${method === id ? '#16a34a' : '#e2e8f0'}`,
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

              {method === 'upload' && (
                <label style={{ display: 'block', marginTop: 8, background: '#f8fafc', border: '1.5px dashed #cbd5e1', borderRadius: 10, padding: '10px', cursor: 'pointer', textAlign: 'center', color: '#475569', fontSize: 13, fontWeight: 600 }}>
                  Cargar GeoJSON
                  <input type="file" accept=".json,.geojson,application/geo+json,application/json" onChange={handleGeoJsonUpload} style={{ display: 'none' }} />
                </label>
              )}

              {method === 'select' && (
                <div style={{ marginTop: 8, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10 }}>
                  {parcelsLoading && <div style={{ fontSize: 12.5, color: '#64748b' }}>Consultando parcelas registradas...</div>}
                  {!parcelsLoading && existingParcels.length === 0 && (
                    <div style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.5 }}>No hay parcelas registradas para este usuario. Usa dibujo o carga GeoJSON.</div>
                  )}
                  {!parcelsLoading && existingParcels.length > 0 && (
                    <>
                      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 6 }}>Parcela existente</label>
                      <select
                        value={selectedParcelId}
                        onChange={(event) => setSelectedParcelId(event.target.value)}
                        style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#0f172a', background: 'white', outline: 'none' }}
                      >
                        {existingParcels.map((parcel) => (
                          <option key={parcel.id} value={parcel.id}>{parcel.metadata.name}</option>
                        ))}
                      </select>
                      {selectedParcel && (
                        <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 8, lineHeight: 1.45 }}>
                          {selectedParcel.metadata.description} · {selectedParcel.metadata.crs} · ID {selectedParcel.id.slice(0, 8)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: '#475569', marginBottom: 8 }}>Cultivos a evaluar</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {cropOptions.map((crop) => {
                  const selected = selectedCrops.includes(crop.id);
                  return (
                    <button
                      key={crop.id}
                      type="button"
                      onClick={() => toggleCrop(crop.id)}
                      style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                        border: `1.5px solid ${selected ? '#16a34a' : '#e2e8f0'}`,
                        background: selected ? '#f0fdf4' : 'white',
                        color: selected ? '#15803d' : '#64748b',
                      }}
                    >
                      {crop.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: 10, background: hasValidGeometry || selectedParcel ? '#f0fdf4' : '#f8fafc', border: `1px solid ${hasValidGeometry || selectedParcel ? '#bbf7d0' : '#e2e8f0'}`, borderRadius: 10, padding: '8px 12px' }}>
              <div style={{ fontSize: 12.5, color: hasValidGeometry || selectedParcel ? '#15803d' : '#64748b', fontWeight: 700 }}>
                {selectedParcel ? 'Parcela existente lista para evaluar' : hasValidGeometry ? 'Parcela delimitada correctamente' : 'Parcela pendiente de delimitar'}
              </div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>
                {selectedParcel ? `ID ${selectedParcel.id.slice(0, 8)} · ${selectedParcel.metadata.crs}` : `Vertices: ${mapPoints.length} ${area ? `- Area aprox.: ${area} ha` : ''}`}
              </div>
            </div>

            {error && (
              <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 9, background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 12.5, lineHeight: 1.45 }}>
                {error}
              </div>
            )}

            <button
              onClick={() => void handleStartEvaluation()}
              disabled={loading}
              style={{ width: '100%', background: loading ? '#86efac' : '#16a34a', color: 'white', border: 'none', padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              {loading ? 'Registrando e iniciando evaluacion...' : 'Procesar variables agroambientales'}
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
          </div>

          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            <div style={{ background: 'white', border: '1px solid #f1f5f9', borderRadius: 10, padding: '8px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', flexShrink: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Mapa de delimitacion</div>
            </div>

            <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: '1.5px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', minHeight: 0 }}>
              <ParcelDrawMap
                points={mapPoints}
                onPointsChange={setMapPoints}
                onGeometryChange={setGeometry}
                onAreaChange={setArea}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
