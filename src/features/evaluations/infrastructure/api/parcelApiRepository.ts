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
  async createParcel(input: CreateParcelInput, accessToken: string): Promise<Parcel> {
    const response = await apiRequest<ParcelResponse>('/parcelas', {
      method: 'POST',
      token: accessToken,
      body: {
        geometry: input.geometry,
        metadata: input.metadata,
      },
    });

    return {
      id: response.id,
      ownerId: response.owner_id,
      geometry: response.geometry,
      metadata: response.metadata,
    };
  }
}
