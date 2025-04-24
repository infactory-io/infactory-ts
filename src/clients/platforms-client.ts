import { HttpClient } from '../core/http-client.js';
import { ApiResponse, Platform } from '../types/common.js';

export type CreatePlatformParams = Pick<Platform, 'name' | 'description' | 'metadata'>;
export type UpdatePlatformParams = Pick<Platform, 'name' | 'description' | 'metadata'>;

/**
 * Client for managing platforms in the Infactory API
 */
export class PlatformsClient {
  /**
   * Creates a new PlatformsClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Get a list of all platforms
   * @returns A promise that resolves to an API response containing an array of platforms
   */
  async list(): Promise<ApiResponse<Platform[]>> {
    return this.httpClient.get<Platform[]>('/v1/platforms');
  }

  /**
   * Get a platform by ID
   * @param id - The ID of the platform to retrieve
   * @returns A promise that resolves to an API response containing the platform
   */
  async get(id: string): Promise<ApiResponse<Platform>> {
    return this.httpClient.get<Platform>(`/v1/platforms/${id}`);
  }

  /**
   * Create a new platform
   * @param params - The parameters for creating the platform
   * @returns A promise that resolves to an API response containing the created platform
   */
  async create(params: CreatePlatformParams): Promise<ApiResponse<Platform>> {
    return this.httpClient.post<Platform>('/v1/platforms', params);
  }

  /**
   * Update a platform
   * @param id - The ID of the platform to update
   * @param params - The parameters for updating the platform
   * @returns A promise that resolves to an API response containing the updated platform
   */
  async update(id: string, params: UpdatePlatformParams): Promise<ApiResponse<Platform>> {
    return this.httpClient.patch<Platform>(`/v1/platforms/${id}`, params);
  }

  /**
   * Delete a platform
   * @param id - The ID of the platform to delete
   * @returns A promise that resolves to an API response containing the deleted platform
   */
  async delete(id: string): Promise<ApiResponse<Platform>> {
    return this.httpClient.delete<Platform>(`/v1/platforms/${id}`);
  }
}
