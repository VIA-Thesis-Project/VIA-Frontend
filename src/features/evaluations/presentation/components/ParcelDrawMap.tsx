import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Trash2 } from 'lucide-react';
import { GeoJsonGeometry } from '@/features/evaluations/domain/parcel';
import huauraBoundary from '@/shared/infrastructure/mapbox/huaura_province.json';

type LatLngPoint = {
  lat: number;
  lng: number;
};

type Props = {
  points: LatLngPoint[];
  onPointsChange?: (points: LatLngPoint[]) => void;
  onGeometryChange?: (geometry: GeoJsonGeometry | null) => void;
  editable?: boolean;
};

const MAPBOX_ACCESS_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const HUAURA_CENTER: [number, number] = [-77.12, -11.08];
const HUAURA_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [-77.78, -11.52],
  [-76.50, -10.55],
];

export function pointsToGeoJson(points: LatLngPoint[]): GeoJsonGeometry | null {
  if (points.length < 3) return null;

  const ring = points.map((point) => [point.lng, point.lat]);
  ring.push([points[0].lng, points[0].lat]);

  return { type: 'Polygon', coordinates: [ring] };
}

export function geoJsonToPoints(geometry: GeoJsonGeometry): LatLngPoint[] {
  const firstRing = geometry.type === 'Polygon'
    ? geometry.coordinates[0]
    : Array.isArray(geometry.coordinates[0]) ? geometry.coordinates[0][0] : [];

  if (!Array.isArray(firstRing)) return [];

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
  if (points.length < 3) return 0;

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

function parcelData(points: LatLngPoint[]): GeoJSON.FeatureCollection {
  const coordinates = points.map((point) => [point.lng, point.lat] as GeoJSON.Position);
  const features: GeoJSON.Feature[] = [];

  if (points.length >= 2) {
    features.push({
      type: 'Feature',
      properties: { kind: 'line' },
      geometry: { type: 'LineString', coordinates: points.length >= 3 ? [...coordinates, coordinates[0]] : coordinates },
    });
  }

  if (points.length >= 3) {
    features.push({
      type: 'Feature',
      properties: { kind: 'polygon' },
      geometry: { type: 'Polygon', coordinates: [[...coordinates, coordinates[0]]] },
    });
  }

  return { type: 'FeatureCollection', features };
}

function vertexData(points: LatLngPoint[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: points.map((point, index) => ({
      type: 'Feature',
      properties: { index },
      geometry: { type: 'Point', coordinates: [point.lng, point.lat] },
    })),
  };
}

function updateSourceData(map: mapboxgl.Map, points: LatLngPoint[]) {
  const parcelSource = map.getSource('parcel-drawing') as mapboxgl.GeoJSONSource | undefined;
  const vertexSource = map.getSource('parcel-vertices') as mapboxgl.GeoJSONSource | undefined;
  parcelSource?.setData(parcelData(points));
  vertexSource?.setData(vertexData(points));
}

function setTerrain(map: mapboxgl.Map, enabled: boolean) {
  if (enabled) {
    map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.15 });
    map.easeTo({ pitch: 48, duration: 600 });
  } else {
    map.setTerrain(null);
    map.easeTo({ pitch: 0, bearing: 0, duration: 600 });
  }
}

export function ParcelDrawMap({
  points,
  onPointsChange,
  onGeometryChange,
  editable = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const pointsRef = useRef(points);
  const callbacksRef = useRef({ onPointsChange, onGeometryChange });
  const [terrainEnabled, setTerrainEnabled] = useState(true);

  useEffect(() => {
    pointsRef.current = points;
    callbacksRef.current = { onPointsChange, onGeometryChange };
    if (mapRef.current?.isStyleLoaded()) updateSourceData(mapRef.current, points);
  }, [points, onPointsChange, onGeometryChange]);

  useEffect(() => {
    if (!MAPBOX_ACCESS_TOKEN || !containerRef.current) return undefined;

    mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: points[0] ? [points[0].lng, points[0].lat] : HUAURA_CENTER,
      zoom: points.length > 0 ? 15 : 10,
      pitch: 48,
      maxBounds: HUAURA_BOUNDS,
      attributionControl: true,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

    map.once('load', () => {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14,
      });
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.15 });

      map.addSource('huaura-boundary', {
        type: 'geojson',
        data: huauraBoundary as GeoJSON.GeoJSON,
      });
      map.addLayer({
        id: 'huaura-boundary-fill',
        type: 'fill',
        source: 'huaura-boundary',
        paint: { 'fill-color': '#0f766e', 'fill-opacity': 0.06 },
      });
      map.addLayer({
        id: 'huaura-boundary-line',
        type: 'line',
        source: 'huaura-boundary',
        paint: { 'line-color': '#0f766e', 'line-width': 2, 'line-dasharray': [2, 2], 'line-opacity': 0.9 },
      });

      map.addSource('parcel-drawing', { type: 'geojson', data: parcelData(pointsRef.current) });
      map.addLayer({
        id: 'parcel-fill',
        type: 'fill',
        source: 'parcel-drawing',
        filter: ['==', ['get', 'kind'], 'polygon'],
        paint: { 'fill-color': '#16a34a', 'fill-opacity': 0.28 },
      });
      map.addLayer({
        id: 'parcel-line',
        type: 'line',
        source: 'parcel-drawing',
        filter: ['==', ['get', 'kind'], 'line'],
        paint: { 'line-color': '#15803d', 'line-width': 3, 'line-opacity': 0.95 },
      });

      map.addSource('parcel-vertices', { type: 'geojson', data: vertexData(pointsRef.current) });
      map.addLayer({
        id: 'parcel-vertices',
        type: 'circle',
        source: 'parcel-vertices',
        paint: {
          'circle-radius': 7,
          'circle-color': '#15803d',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });

      map.on('click', (event) => {
        if (!editable) return;

        const vertex = map.queryRenderedFeatures(event.point, { layers: ['parcel-vertices'] })[0];
        if (vertex) {
          const index = Number(vertex.properties?.index);
          if (Number.isInteger(index)) {
            const nextPoints = pointsRef.current.filter((_, pointIndex) => pointIndex !== index);
            pointsRef.current = nextPoints;
            callbacksRef.current.onPointsChange?.(nextPoints);
            callbacksRef.current.onGeometryChange?.(pointsToGeoJson(nextPoints));
          }
          return;
        }

        const insideHuaura = map.queryRenderedFeatures(event.point, { layers: ['huaura-boundary-fill'] }).length > 0;
        if (!insideHuaura) return;

        const nextPoints = [...pointsRef.current, { lat: event.lngLat.lat, lng: event.lngLat.lng }];
        pointsRef.current = nextPoints;
        callbacksRef.current.onPointsChange?.(nextPoints);
        callbacksRef.current.onGeometryChange?.(pointsToGeoJson(nextPoints));
      });

      map.on('mouseenter', 'parcel-vertices', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'parcel-vertices', () => { map.getCanvas().style.cursor = ''; });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [editable]);

  const clearPolygon = () => {
    pointsRef.current = [];
    onPointsChange?.([]);
    onGeometryChange?.(null);
  };

  const toggleTerrain = () => {
    const map = mapRef.current;
    if (!map) return;
    const nextEnabled = !terrainEnabled;
    setTerrainEnabled(nextEnabled);
    if (map.isStyleLoaded()) setTerrain(map, nextEnabled);
  };

  if (!MAPBOX_ACCESS_TOKEN) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', padding: 24, background: '#f8fafc', color: '#475569', textAlign: 'center', fontSize: 13 }}>
        Configura <code>VITE_MAPBOX_ACCESS_TOKEN</code> para mostrar el mapa de Huaura.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: 320 }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2, background: 'rgba(255,255,255,0.96)', borderRadius: 8, padding: '10px 12px', boxShadow: '0 2px 10px rgba(15,23,42,0.14)', border: '1px solid #e2e8f0', width: 300, maxWidth: 'calc(100% - 130px)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Provincia de Huaura, Lima</div>
        <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.45 }}>
          {editable ? 'Haz click sobre el mapa para marcar el perimetro de la parcela.' : 'Geometria registrada de la parcela.'}
        </div>
      </div>

      <div style={{ position: 'absolute', right: 12, top: 12, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button type="button" onClick={toggleTerrain} style={{ background: 'white', color: '#0f172a', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 11px', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 10px rgba(15,23,42,0.12)' }}>
          {terrainEnabled ? '2D' : '3D'}
        </button>
        {editable && (
          <button type="button" onClick={clearPolygon} style={{ background: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 11px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 10px rgba(15,23,42,0.12)' }}>
            <Trash2 style={{ width: 14, height: 14 }} />
            Limpiar
          </button>
        )}
      </div>

      {editable && (
        <div style={{ position: 'absolute', left: 12, bottom: 12, zIndex: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, boxShadow: '0 2px 10px rgba(15,23,42,0.12)' }}>
            Vertices: {points.length}
          </div>
        </div>
      )}
    </div>
  );
}

export function ParcelMapView({ points }: { points: LatLngPoint[] }) {
  return <ParcelDrawMap points={points} editable={false} />;
}
