import { sharedClient, ApiResponse } from '@/core/shared-client.js';

export interface ApiKey {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  lastUsed: string | null;
  displayValue?: string;
}

export const authApi = {
  /**
   * Get all API keys for the current user
   */
  getApiKeys: async (): Promise<ApiResponse<ApiKey[]>> => {
    return await sharedClient.get<ApiKey[]>('/v1/authentication/api-keys');
  },

  /**
   * Create a new API key
   * @param name The name of the API key
   */
  createApiKey: async (
    name: string,
  ): Promise<ApiResponse<[ApiKey, string]>> => {
    return await sharedClient.post<[ApiKey, string]>(
      '/v1/authentication/api-key',
      {
        params: { name },
      },
    );
  },

  /**
   * Update an API key
   * @param keyId The id of the API key to update
   * @param name The new name for the API key
   */
  renameApiKey: async (
    keyId: string,
    name: string,
  ): Promise<ApiResponse<ApiKey>> => {
    return await sharedClient.patch<ApiKey>(
      `/v1/authentication/api-key/${keyId}`,
      {
        params: { name },
      },
    );
  },

  /**
   * Enable a previously disabled API key
   * @param keyId The id of the API key to enable
   */
  enableApiKey: async (keyId: string): Promise<ApiResponse<ApiKey>> => {
    return await sharedClient.patch<ApiKey>(
      `/v1/authentication/api-key/${keyId}/enable`,
    );
  },

  /**
   * Disable an API key
   * @param keyId The id of the API key to disable
   */
  disableApiKey: async (keyId: string): Promise<ApiResponse<ApiKey>> => {
    return await sharedClient.patch<ApiKey>(
      `/v1/authentication/api-key/${keyId}/disable`,
    );
  },

  /**
   * Delete an API key
   * @param keyId The id of the API key to delete
   */
  deleteApiKey: async (keyId: string): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(
      `/v1/authentication/api-key/${keyId}`,
    );
  },
};
