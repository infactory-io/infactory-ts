import { fetchApi } from './client';
import { Secret, CreateSecretParams, ApiResponse } from './types';

export const secretsApi = {
  getSecrets: async (): Promise<ApiResponse<Secret[]>> => {
    return fetchApi<Secret[]>('/v1/secrets');
  },

  getProjectSecrets: async (
    projectId: string
  ): Promise<ApiResponse<Secret[]>> => {
    return fetchApi<Secret[]>(`/v1/projects/${projectId}/secrets`);
  },

  getSecret: async (secretId: string): Promise<ApiResponse<Secret>> => {
    return fetchApi<Secret>(`/v1/secrets/${secretId}`);
  },

  createSecret: async (
    params: CreateSecretParams
  ): Promise<ApiResponse<Secret>> => {
    return fetchApi<Secret>('/v1/secrets', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  updateSecret: async (
    secretId: string,
    params: Partial<CreateSecretParams>
  ): Promise<ApiResponse<Secret>> => {
    return fetchApi<Secret>(`/v1/secrets/${secretId}`, {
      method: 'PATCH',
      body: JSON.stringify(params)
    });
  },

  deleteSecret: async (secretId: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/v1/secrets/${secretId}`, {
      method: 'DELETE'
    });
  }
};
