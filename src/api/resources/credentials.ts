import { get, post, patch, del } from '@/core/client.js';
import {
  Credential,
  CreateCredentialParams,
  ApiResponse,
} from '@/types/common.js';

export const credentialsApi = {
  getCredentials: async (): Promise<ApiResponse<Credential[]>> => {
    return await get<Credential[]>('/v1/credentials');
  },

  getProjectCredentials: async (
    projectId: string,
  ): Promise<ApiResponse<Credential[]>> => {
    return await get<Credential[]>(`/v1/projects/${projectId}/credentials`);
  },

  getCredential: async (
    credentialId: string,
  ): Promise<ApiResponse<Credential>> => {
    return await get<Credential>(`/v1/credentials/${credentialId}`);
  },

  createCredential: async (
    params: CreateCredentialParams,
  ): Promise<ApiResponse<Credential>> => {
    return await post<Credential>('/v1/credentials', {
      body: JSON.stringify(params),
    });
  },

  updateCredential: async (
    credentialId: string,
    params: Partial<CreateCredentialParams>,
  ): Promise<ApiResponse<Credential>> => {
    return await patch<Credential>(`/v1/credentials/${credentialId}`, {
      body: JSON.stringify(params),
    });
  },

  deleteCredential: async (
    credentialId: string,
  ): Promise<ApiResponse<void>> => {
    return await del<void>(`/v1/credentials/${credentialId}`);
  },
};
