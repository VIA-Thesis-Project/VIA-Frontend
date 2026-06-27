import { ParcelRepository } from '@/features/evaluations/application/evaluationRepositories';
import { CreateParcelInput, Parcel } from '@/features/evaluations/domain/parcel';
import { apiRequest } from '@/shared/infrastructure/http/apiClient';

type ParcelResponse = {
  id: string;
  owner_id: string;
  geometry: Parcel['geometry'];
  metadata: {
    name: string;
    description: string;
    crs: string;
  };
};

export class ParcelApiRepository implements ParcelRepository {
  async listParcels(accessToken: string): Promise<Parcel[]> {
    const response = await apiRequest<ParcelResponse[]>('/parcelas', {
      token: accessToken,
    });

    return response.map(toParcel);
  }

  async createParcel(input: CreateParcelInput, accessToken: string): Promise<Parcel> {
    const response = await apiRequest<ParcelResponse>('/parcelas', {
      method: 'POST',
      token: accessToken,
      body: {
        geometry: input.geometry,
        metadata: input.metadata,
      },
    });

    return toParcel(response);
  }

  async getParcel(parcelId: string, accessToken: string): Promise<Parcel> {
    const response = await apiRequest<ParcelResponse>(`/parcelas/${parcelId}`, {
      token: accessToken,
    });

    return toParcel(response);
  }

  async updateParcel(parcelId: string, input: Partial<CreateParcelInput>, accessToken: string): Promise<Parcel> {
    const response = await apiRequest<ParcelResponse>(`/parcelas/${parcelId}`, {
      method: 'PATCH',
      token: accessToken,
      body: {
        geometry: input.geometry,
        metadata: input.metadata,
      },
    });

    return toParcel(response);
  }

  async deleteParcel(parcelId: string, accessToken: string): Promise<void> {
    await apiRequest<void>(`/parcelas/${parcelId}`, {
      method: 'DELETE',
      token: accessToken,
    });
  }
}

function toParcel(response: ParcelResponse): Parcel {
  return {
    id: response.id,
    ownerId: response.owner_id,
    geometry: response.geometry,
    metadata: response.metadata,
  };
}
