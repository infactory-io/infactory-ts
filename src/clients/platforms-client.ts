import { HttpClient } from '../core/http-client.js';
import { ApiResponse } from '../types/common.js';

/**
 * Platform object as returned by the API
 */
export interface Platform {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Parameters for creating a platform
 */
export interface CreatePlatformParams {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Parameters for updating a platform
 */
export interface UpdatePlatformParams {
  name?: string;
  description?: string;
  metadata?: Record<string, any>;
}

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
