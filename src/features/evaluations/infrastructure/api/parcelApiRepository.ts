import { ParcelRepository } from '@/features/evaluations/application/evaluationRepositories';
import { CreateParcelInput, Parcel, ParcelVersion, Project } from '@/features/evaluations/domain/parcel';
import { ApiError, apiRequest } from '@/shared/infrastructure/http/apiClient';

type ProjectResponse = {
  id: string;
  name: string;
  created_at: string;
};

type ParcelVersionResponse = {
  number: number;
  geometry: Parcel['geometry'];
  created_at: string;
};

type ParcelResponse = {
  id: string;
  project_id: string;
  name: string;
  current_version: number;
  versions: ParcelVersionResponse[];
  created_at: string;
};

export class ParcelApiRepository implements ParcelRepository {
  async listProjects(accessToken: string): Promise<Project[]> {
    const response = await apiRequest<ProjectResponse[]>('/projects/', { token: accessToken });
    return response.map(toProject);
  }

  async listParcels(accessToken: string): Promise<Parcel[]> {
    const projects = await this.listProjects(accessToken);
    const parcels = await Promise.all(
      projects.map((project) => this.listParcelsForProject(project.id, accessToken)),
    );
    return parcels.flat();
  }

  async createParcel(input: CreateParcelInput, accessToken: string): Promise<Parcel> {
    const projects = await this.listProjects(accessToken);
    const project = projects[0] ?? await this.createProject('Mi proyecto agricola', accessToken);
    const response = await apiRequest<ParcelResponse>(`/projects/${project.id}/parcels`, {
      method: 'POST',
      token: accessToken,
      body: {
        name: input.metadata.name.trim() || 'Parcela sin nombre',
        geometry: input.geometry,
      },
    });
    return toParcel(response);
  }

  async getParcel(parcelId: string, accessToken: string): Promise<Parcel> {
    const parcel = (await this.listParcels(accessToken)).find((item) => item.id === parcelId);
    if (!parcel) throw new ApiError('No se encontro la parcela solicitada.', 404);
    return parcel;
  }

  async updateParcel(parcelId: string, input: Partial<CreateParcelInput>, accessToken: string): Promise<Parcel> {
    if (!input.geometry) {
      throw new ApiError(
        'El backend actual solo permite revisar la geometria creando una nueva version de la parcela.',
        405,
      );
    }

    const parcel = await this.getParcel(parcelId, accessToken);
    const response = await apiRequest<ParcelResponse>(
      `/projects/${parcel.projectId}/parcels/${parcel.id}/versions`,
      {
        method: 'POST',
        token: accessToken,
        body: { geometry: input.geometry },
      },
    );
    return toParcel(response);
  }

  async deleteParcel(_parcelId: string, _accessToken: string): Promise<void> {
    throw new ApiError('El backend actual no expone eliminacion de parcelas.', 405);
  }

  private async listParcelsForProject(projectId: string, accessToken: string): Promise<Parcel[]> {
    const response = await apiRequest<ParcelResponse[]>(`/projects/${projectId}/parcels`, {
      token: accessToken,
    });
    return response.map(toParcel);
  }

  private async createProject(name: string, accessToken: string): Promise<Project> {
    const response = await apiRequest<ProjectResponse>('/projects/', {
      method: 'POST',
      token: accessToken,
      body: { name },
    });
    return toProject(response);
  }
}

function toProject(response: ProjectResponse): Project {
  return {
    id: response.id,
    name: response.name,
    createdAt: response.created_at,
  };
}

function toParcel(response: ParcelResponse): Parcel {
  const versions = response.versions.map(toParcelVersion);
  const current = versions.find((version) => version.number === response.current_version) ?? versions.at(-1);
  if (!current) throw new Error('El backend devolvio una parcela sin versiones de geometria.');

  return {
    id: response.id,
    projectId: response.project_id,
    ownerId: '',
    currentVersion: response.current_version,
    versions,
    geometry: current.geometry,
    metadata: {
      name: response.name,
      description: `Proyecto ${response.project_id} · Version ${response.current_version}`,
      crs: 'EPSG:4326',
    },
    createdAt: response.created_at,
  };
}

function toParcelVersion(response: ParcelVersionResponse): ParcelVersion {
  return {
    number: response.number,
    geometry: response.geometry,
    createdAt: response.created_at,
  };
}
