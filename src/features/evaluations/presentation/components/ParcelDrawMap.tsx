import { useMemo } from 'react';
import { CircleMarker, MapContainer, Polygon, Polyline, TileLayer, Tooltip, useMapEvents } from 'react-leaflet';
import { Trash2 } from 'lucide-react';
import { GeoJsonGeometry } from '@/features/evaluations/domain/parcel';

type LatLngPoint = {
  lat: number;
  lng: number;
};

type Props = {
  points: LatLngPoint[];
  onPointsChange: (points: LatLngPoint[]) => void;
  onGeometryChange: (geometry: GeoJsonGeometry | null) => void;
  onAreaChange: (areaHa: string) => void;
};

const LIMA_CENTER: [number, number] = [-12.0464, -77.0428];

function DrawingEvents({ points, onPointsChange }: Omit<Props, 'onGeometryChange' | 'onAreaChange'>) {
  useMapEvents({
    click(event) {
      onPointsChange([...points, { lat: event.latlng.lat, lng: event.latlng.lng }]);
    },
  });

  return null;
}

export function pointsToGeoJson(points: LatLngPoint[]): GeoJsonGeometry | null {
  if (points.length < 3) {
    return null;
  }

  const ring = points.map((point) => [point.lng, point.lat]);
  ring.push([points[0].lng, points[0].lat]);

  return {
    type: 'Polygon',
    coordinates: [ring],
  };
}

export function geoJsonToPoints(geometry: GeoJsonGeometry): LatLngPoint[] {
  const firstRing = geometry.type === 'Polygon'
    ? geometry.coordinates[0]
    : Array.isArray(geometry.coordinates[0]) ? geometry.coordinates[0][0] : [];

  if (!Array.isArray(firstRing)) {
    return [];
  }

  return firstRing
    .filter((coordinate): coordinate is [number, number] => (
      Array.isArray(coordinate)
      && coordinate.length >= 2
      && typeof coordinate[0] === 'number'
      && typeof coordinate[1] === 'number'
    ))
    .map(([lng, lat]) => ({ lat, lng }))
    .filter((point, index, allPoints) => {
      const isClosingPoint = index === allPoints.length - 1
        && allPoints.length > 1
        && point.lat === allPoints[0].lat
        && point.lng === allPoints[0].lng;
      return !isClosingPoint;
    });
}

export function calculateAreaHa(points: LatLngPoint[]): number {
  if (points.length < 3) {
    return 0;
  }

  const earthRadiusMeters = 6378137;
  const meanLatRadians = points.reduce((sum, point) => sum + point.lat, 0) / points.length * Math.PI / 180;
  const projected = points.map((point) => ({
    x: earthRadiusMeters * point.lng * Math.PI / 180 * Math.cos(meanLatRadians),
    y: earthRadiusMeters * point.lat * Math.PI / 180,
  }));

  const doubleArea = projected.reduce((sum, point, index) => {
    const next = projected[(index + 1) % projected.length];
    return sum + point.x * next.y - next.x * point.y;
  }, 0);

  return Math.abs(doubleArea) / 2 / 10000;
}

export function ParcelDrawMap({ points, onPointsChange, onGeometryChange, onAreaChange }: Props) {
  const polygonPositions = useMemo(() => points.map((point) => [point.lat, point.lng] as [number, number]), [points]);
  const areaHa = useMemo(() => calculateAreaHa(points), [points]);

  const updatePoints = (nextPoints: LatLngPoint[]) => {
    onPointsChange(nextPoints);
    onGeometryChange(pointsToGeoJson(nextPoints));
    const nextArea = calculateAreaHa(nextPoints);
    if (nextArea > 0) {
      onAreaChange(nextArea.toFixed(2));
    }
  };

  const removePoint = (indexToRemove: number) => {
    updatePoints(points.filter((_, index) => index !== indexToRemove));
  };

  const clearPolygon = () => {
    updatePoints([]);
    onAreaChange('');
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={points[0] ? [points[0].lat, points[0].lng] : LIMA_CENTER}
        zoom={points.length > 0 ? 15 : 10}
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <DrawingEvents points={points} onPointsChange={updatePoints} />

        {points.length >= 2 && points.length < 3 && (
          <Polyline positions={polygonPositions} pathOptions={{ color: '#15803d', weight: 3 }} />
        )}

        {points.length >= 3 && (
          <Polygon
            positions={polygonPositions}
            pathOptions={{ color: '#15803d', weight: 3, fillColor: '#16a34a', fillOpacity: 0.24 }}
          />
        )}

        {points.map((point, index) => (
          <CircleMarker
            key={`${point.lat}-${point.lng}-${index}`}
            center={[point.lat, point.lng]}
            radius={7}
            pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#15803d', fillOpacity: 1 }}
            eventHandlers={{ click: () => removePoint(index) }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              Vertice {index + 1}. Click para eliminar.
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      <div style={{ position: 'absolute', top: 12, left: 58, zIndex: 500, background: 'white', borderRadius: 10, padding: '10px 12px', boxShadow: '0 2px 10px rgba(15,23,42,0.14)', border: '1px solid #e2e8f0', width: 300, maxWidth: 'calc(100% - 150px)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Delimitacion de parcela</div>
        <div style={{ fontSize: 11.5, color: '#64748b', lineHeight: 1.45 }}>
          Haz click sobre el mapa para marcar los puntos del perimetro. Con 3 o mas puntos la parcela queda lista para evaluar.
        </div>
      </div>

      <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 500, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          onClick={clearPolygon}
          type="button"
          style={{ background: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 9, padding: '8px 11px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 10px rgba(15,23,42,0.12)' }}
        >
          <Trash2 style={{ width: 14, height: 14 }} />
          Limpiar
        </button>
      </div>

      <div style={{ position: 'absolute', left: 12, bottom: 12, zIndex: 500, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '7px 12px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, boxShadow: '0 2px 10px rgba(15,23,42,0.12)' }}>
          Vertices: {points.length}
        </div>
        <div style={{ background: points.length >= 3 ? '#f0fdf4' : '#f8fafc', border: `1px solid ${points.length >= 3 ? '#bbf7d0' : '#e2e8f0'}`, color: points.length >= 3 ? '#15803d' : '#64748b', padding: '7px 12px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, boxShadow: '0 2px 10px rgba(15,23,42,0.12)' }}>
          Area aprox.: {areaHa > 0 ? areaHa.toFixed(2) : '--'} ha
        </div>
      </div>
    </div>
  );
}
