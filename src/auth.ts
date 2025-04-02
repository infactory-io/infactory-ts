import { get, post, del, patch } from './client';
import { ApiResponse } from './types';

export interface ApiKey {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  last_used: string | null;
  display_value?: string;
}

export const authApi = {
  /**
   * Get all API keys for the current user
   */
  getApiKeys: async (): Promise<ApiResponse<ApiKey[]>> => {
    return get<ApiKey[]>('/v1/authentication/api-keys');
  },

  /**
   * Create a new API key
   * @param name The name of the API key
   */
  createApiKey: async (
    name: string
  ): Promise<ApiResponse<[ApiKey, string]>> => {
    return post<[ApiKey, string]>('/v1/authentication/api-key', {
      params: { name }
    });
  },

  /**
   * Update an API key
   * @param keyId The id of the API key to update
   * @param name The new name for the API key
   */
  renameApiKey: async (
    keyId: string,
    name: string
  ): Promise<ApiResponse<ApiKey>> => {
    return patch<ApiKey>(`/v1/authentication/api-key/${keyId}`, {
      params: { name }
    });
  },

  /**
   * Enable a previously disabled API key
   * @param keyId The id of the API key to enable
   */
  enableApiKey: async (keyId: string): Promise<ApiResponse<ApiKey>> => {
    return patch<ApiKey>(`/v1/authentication/api-key/${keyId}/enable`);
  },

  /**
   * Disable an API key
   * @param keyId The id of the API key to disable
   */
  disableApiKey: async (keyId: string): Promise<ApiResponse<ApiKey>> => {
    return patch<ApiKey>(`/v1/authentication/api-key/${keyId}/disable`);
  },

  /**
   * Delete an API key
   * @param keyId The id of the API key to delete
   */
  deleteApiKey: async (keyId: string): Promise<ApiResponse<any>> => {
    return del(`/v1/authentication/api-key/${keyId}`);
  }
};
