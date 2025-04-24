import { HttpClient } from '../core/http-client.js';
import { ApiResponse, Organization } from '../types/common.js';

export type CreateOrganizationParams = Pick<
  Organization,
  'name' | 'description' | 'platformId' | 'clerkOrgId'
>;

/**
 * Client for managing organizations in the Infactory API
 */
export class OrganizationsClient {
  /**
   * Creates a new OrganizationsClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Get a list of all organizations
   * @returns A promise that resolves to an API response containing an array of organizations
   */
  async list(): Promise<ApiResponse<Organization[]>> {
    return this.httpClient.get<Organization[]>('/v1/orgs');
  }

  /**
   * Get an organization by ID
   * @param id - The ID of the organization to retrieve
   * @returns A promise that resolves to an API response containing the organization
   */
  async get(id: string): Promise<ApiResponse<Organization>> {
    return this.httpClient.get<Organization>(`/v1/orgs/${id}`);
  }

  /**
   * Get an organization by Clerk ID
   * @param clerkOrgId - The Clerk ID of the organization to retrieve
   * @returns A promise that resolves to an API response containing the organization
   */
  async getByClerkId(clerkOrgId: string): Promise<ApiResponse<Organization>> {
    return this.httpClient.get<Organization>(`/v1/orgs/clerk/${clerkOrgId}`);
  }

  /**
   * Create a new organization
   * @param params - The parameters for creating the organization
   * @returns A promise that resolves to an API response containing the created organization
   */
  async create(
    params: CreateOrganizationParams,
  ): Promise<ApiResponse<Organization>> {
    return this.httpClient.post<Organization>('/v1/orgs', params);
  }

  /**
   * Update an organization
   * @param id - The ID of the organization to update
   * @param params - The parameters for updating the organization
   * @returns A promise that resolves to an API response containing the updated organization
   */
  async update(
    id: string,
    params: Partial<CreateOrganizationParams>,
  ): Promise<ApiResponse<Organization>> {
    return this.httpClient.patch<Organization>(`/v1/orgs/${id}`, params);
  }

  /**
   * Delete an organization
   * @param id - The ID of the organization to delete
   * @returns A promise that resolves to an API response containing the deleted organization
   */
  async delete(id: string): Promise<ApiResponse<Organization>> {
    return this.httpClient.delete<Organization>(`/v1/orgs/${id}`);
  }

  /**
   * Move an organization to a new platform
   * @param id - The ID of the organization to move
   * @param newPlatformId - The ID of the platform to move the organization to
   * @returns A promise that resolves to an API response containing the moved organization
   */
  async move(
    id: string,
    newPlatformId: string,
  ): Promise<ApiResponse<Organization>> {
    return this.httpClient.post<Organization>(`/v1/orgs/${id}/move`, {
      new_platform_id: newPlatformId,
    });
  }
}
