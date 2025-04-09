import { sharedClient, ApiResponse } from '@/core/shared-client.js';
import { Platform, CreatePlatformParams } from '@/types/common.js';
import { getConfig } from '@/config/index.js';

const PLATFORM_ID = 'redacted';

export const platformsApi = {
  getPlatforms: async (): Promise<ApiResponse<Platform[]>> => {
    return await sharedClient.get<Platform[]>('/v1/platforms');
  },

  getPlatform: async (platformId: string): Promise<ApiResponse<Platform>> => {
    return await sharedClient.get<Platform>(`/v1/platforms/${platformId}`);
  },

  getCurrentPlatform: async (): Promise<ApiResponse<Platform | null>> => {
    // Two checks since this can run in the server or client
    if (PLATFORM_ID) {
      return await sharedClient.get<Platform>(`/v1/platforms/${PLATFORM_ID}`);
    }
    const platform_name = getConfig(true, false).baseUrl;
    if (platform_name) {
      const response = await sharedClient.get<Platform[]>('/v1/platforms');
      if (response.data && response.data.length > 0) {
        const platform = response.data.find(
          (p: any) => p.name === platform_name,
        );
        if (platform) {
          // global.platformId = platform.id;
          return await sharedClient.get<Platform>(
            `/v1/platforms/${platform.id}`,
          );
        }
      }
    }
    return { data: null };
  },

  createPlatform: async (
    params: CreatePlatformParams,
  ): Promise<ApiResponse<Platform>> => {
    return await sharedClient.post<Platform>('/v1/platforms', { body: params });
  },

  updatePlatform: async (
    platformId: string,
    params: Partial<CreatePlatformParams>,
  ): Promise<ApiResponse<Platform>> => {
    return await sharedClient.patch<Platform>(`/v1/platforms/${platformId}`, {
      body: params,
    });
  },

  deletePlatform: async (platformId: string): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(`/v1/platforms/${platformId}`);
  },
};
