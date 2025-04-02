import { get, post, patch, del } from '@/core/client.js';
import { Secret, CreateSecretParams, ApiResponse } from '@/types/common.js';

export const secretsApi = {
  getSecrets: async (): Promise<ApiResponse<Secret[]>> => {
    return await get<Secret[]>('/v1/secrets');
  },

  getProjectSecrets: async (
    projectId: string,
  ): Promise<ApiResponse<Secret[]>> => {
    return await get<Secret[]>(`/v1/projects/${projectId}/secrets`);
  },

  getSecret: async (secretId: string): Promise<ApiResponse<Secret>> => {
    return await get<Secret>(`/v1/secrets/${secretId}`);
  },

  createSecret: async (
    params: CreateSecretParams,
  ): Promise<ApiResponse<Secret>> => {
    return await post<Secret>('/v1/secrets', { body: params });
  },

  updateSecret: async (
    secretId: string,
    params: Partial<CreateSecretParams>,
  ): Promise<ApiResponse<Secret>> => {
    return await patch<Secret>(`/v1/secrets/${secretId}`, { body: params });
  },

  deleteSecret: async (secretId: string): Promise<ApiResponse<void>> => {
    return await del<void>(`/v1/secrets/${secretId}`);
  },
};
