import { fetchApi } from './client';
import { Credential, CreateCredentialParams, ApiResponse } from './types';

export const credentialsApi = {
  getCredentials: async (): Promise<ApiResponse<Credential[]>> => {
    return fetchApi<Credential[]>('/v1/credentials');
  },

  getProjectCredentials: async (
    projectId: string
  ): Promise<ApiResponse<Credential[]>> => {
    return fetchApi<Credential[]>(`/v1/projects/${projectId}/credentials`);
  },

  getCredential: async (
    credentialId: string
  ): Promise<ApiResponse<Credential>> => {
    return fetchApi<Credential>(`/v1/credentials/${credentialId}`);
  },

  createCredential: async (
    params: CreateCredentialParams
  ): Promise<ApiResponse<Credential>> => {
    return fetchApi<Credential>('/v1/credentials', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  updateCredential: async (
    credentialId: string,
    params: Partial<CreateCredentialParams>
  ): Promise<ApiResponse<Credential>> => {
    return fetchApi<Credential>(`/v1/credentials/${credentialId}`, {
      method: 'PATCH',
      body: JSON.stringify(params)
    });
  },

  deleteCredential: async (
    credentialId: string
  ): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/v1/credentials/${credentialId}`, {
      method: 'DELETE'
    });
  }
};
