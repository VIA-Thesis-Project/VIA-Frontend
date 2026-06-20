export type GeoJsonGeometry = {
  type: 'Polygon' | 'MultiPolygon';
  coordinates: unknown[];
};

export type ParcelMetadata = {
  name: string;
  description: string;
  crs: string;
};

export type Parcel = {
  id: string;
  ownerId: string;
  geometry: GeoJsonGeometry;
  metadata: ParcelMetadata;
};

export type CreateParcelInput = {
  geometry: GeoJsonGeometry;
  metadata: ParcelMetadata;
};
