import { getVersionInfo } from './version';
import { fetchApi } from './client';
import { Platform, CreatePlatformParams, ApiResponse } from './types';

const PLATFORM_ID = 'redacted';

export const platformsApi = {
  getPlatforms: async (): Promise<ApiResponse<Platform[]>> => {
    return fetchApi<Platform[]>('/v1/platforms');
  },

  getPlatform: async (platformId: string): Promise<ApiResponse<Platform>> => {
    return fetchApi<Platform>(`/v1/platforms/${platformId}`);
  },

  getCurrentPlatform: async (): Promise<ApiResponse<Platform | null>> => {
    // Two checks since this can run in the server or client
    if (PLATFORM_ID) {
      return fetchApi<Platform>(`/v1/platforms/${PLATFORM_ID}`);
    }
    const platform_name = getVersionInfo().appUrl;
    if (platform_name) {
      const response = await fetchApi<Platform[]>('/v1/platforms');
      if (response.data && response.data.length > 0) {
        const platform = response.data.find((p) => p.name === platform_name);
        if (platform) {
          // global.platformId = platform.id;
          return fetchApi<Platform>(`/v1/platforms/${platform.id}`);
        }
      }
    }
    return { data: null };
  },

  createPlatform: async (
    params: CreatePlatformParams
  ): Promise<ApiResponse<Platform>> => {
    return fetchApi<Platform>('/v1/platforms', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  updatePlatform: async (
    platformId: string,
    params: Partial<CreatePlatformParams>
  ): Promise<ApiResponse<Platform>> => {
    return fetchApi<Platform>(`/v1/platforms/${platformId}`, {
      method: 'PATCH',
      body: JSON.stringify(params)
    });
  },

  deletePlatform: async (platformId: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/v1/platforms/${platformId}`, {
      method: 'DELETE'
    });
  }
};
