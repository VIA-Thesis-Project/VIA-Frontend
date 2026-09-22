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
  projectId: string;
  ownerId: string;
  currentVersion: number;
  versions: ParcelVersion[];
  geometry: GeoJsonGeometry;
  metadata: ParcelMetadata;
  createdAt: string;
};

export type ParcelVersion = {
  number: number;
  geometry: GeoJsonGeometry;
  createdAt: string;
};

export type Project = {
  id: string;
  name: string;
  createdAt: string;
};

export type CreateParcelInput = {
  geometry: GeoJsonGeometry;
  metadata: ParcelMetadata;
};
