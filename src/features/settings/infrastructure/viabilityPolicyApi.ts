import { readAuthSession } from '@/features/auth/infrastructure/session/authSessionStorage';
import { apiRequest } from '@/shared/infrastructure/http/apiClient';

export type ViabilityPolicy = {
  identifier: string;
  version: string;
  conditional_from: number;
  viable_from: number;
  default_configuration: {
    conditional_from: number;
    viable_from: number;
  };
};

const path = '/v1/decision-support/my-viability-policy';

export function getViabilityPolicy(): Promise<ViabilityPolicy> {
  return apiRequest<ViabilityPolicy>(path, {
    token: readAuthSession()?.accessToken,
  });
}

export function updateViabilityPolicy(
  current: ViabilityPolicy,
  conditionalFrom: number,
  viableFrom: number,
): Promise<ViabilityPolicy> {
  return apiRequest<ViabilityPolicy>(path, {
    method: 'PUT',
    token: readAuthSession()?.accessToken,
    body: {
      conditional_from: conditionalFrom,
      viable_from: viableFrom,
      expected_identifier: current.identifier,
      expected_version: current.version,
    },
  });
}
