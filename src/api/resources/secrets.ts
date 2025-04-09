import type { Secret, CreateSecretParams } from '@/types/common.js';
import { sharedClient, type ApiResponse } from '@/core/shared-client.js';

export const secretsApi = {
  getSecrets: async (): Promise<ApiResponse<Secret[]>> => {
    return await sharedClient.get<Secret[]>('/v1/secrets');
  },

  getProjectSecrets: async (
    projectId: string,
  ): Promise<ApiResponse<Secret[]>> => {
    return await sharedClient.get<Secret[]>(
      `/v1/projects/${projectId}/secrets`,
    );
  },

  getSecret: async (secretId: string): Promise<ApiResponse<Secret>> => {
    return await sharedClient.get<Secret>(`/v1/secrets/${secretId}`);
  },

  createSecret: async (
    params: CreateSecretParams,
  ): Promise<ApiResponse<Secret>> => {
    return await sharedClient.post<Secret>('/v1/secrets', params);
  },

  updateSecret: async (
    secretId: string,
    params: Partial<CreateSecretParams>,
  ): Promise<ApiResponse<Secret>> => {
    return await sharedClient.patch<Secret>(`/v1/secrets/${secretId}`, params);
  },

  deleteSecret: async (secretId: string): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(`/v1/secrets/${secretId}`);
  },
};
