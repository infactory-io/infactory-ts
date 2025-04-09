import type { Credential, CreateCredentialParams } from '@/types/common.js';
import { sharedClient, type ApiResponse } from '@/core/shared-client.js';

export const credentialsApi = {
  getCredentials: async (): Promise<ApiResponse<Credential[]>> => {
    return await sharedClient.get<Credential[]>('/v1/credentials');
  },

  getProjectCredentials: async (
    projectId: string,
  ): Promise<ApiResponse<Credential[]>> => {
    return await sharedClient.get<Credential[]>(
      `/v1/projects/${projectId}/credentials`,
    );
  },

  getCredential: async (
    credentialId: string,
  ): Promise<ApiResponse<Credential>> => {
    return await sharedClient.get<Credential>(
      `/v1/credentials/${credentialId}`,
    );
  },

  createCredential: async (
    params: CreateCredentialParams,
  ): Promise<ApiResponse<Credential>> => {
    return await sharedClient.post<Credential>('/v1/credentials', params);
  },

  updateCredential: async (
    credentialId: string,
    params: Partial<CreateCredentialParams>,
  ): Promise<ApiResponse<Credential>> => {
    return await sharedClient.patch<Credential>(
      `/v1/credentials/${credentialId}`,
      params,
    );
  },

  deleteCredential: async (
    credentialId: string,
  ): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(`/v1/credentials/${credentialId}`);
  },
};
