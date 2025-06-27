import { HttpClient } from '../core/http-client.js';
import { ApiResponse } from '../types/common.js';
import {
  API,
  CreateAPIParams,
  APIEndpoint,
  QueryProgram,
  CreateAPIEndpointParams,
} from '../types/common.js';

/**
 * Client for managing APIs in the Infactory API
 */
export class APIsClient {
  /**
   * Creates a new APIsClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Get all APIs for a project
   * @param projectId - The ID of the project
   * @returns A promise that resolves to an API response containing an array of APIs
   */
  async getProjectApis(projectId: string): Promise<ApiResponse<API[]>> {
    return await this.httpClient.get<API[]>(`/v1/apis/project/${projectId}`);
  }

  /**
   * Get all published query programs for a project
   * @param projectId - The ID of the project
   * @returns A promise that resolves to an API response containing an array of published query programs
   */
  async getProjectPublishedPrograms(
    projectId: string,
  ): Promise<ApiResponse<QueryProgram[]>> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    return await this.httpClient.get<QueryProgram[]>(
      `/v1/apis/project/${projectId}/published-programs`,
    );
  }

  /**
   * Get a specific API by ID
   * @param apiId - The ID of the API to retrieve
   * @returns A promise that resolves to an API response containing the API
   */
  async getApi(slug: string): Promise<ApiResponse<API>> {
    return await this.httpClient.get<API>(`/v1/apis/${slug}`);
  }

  /**
   * Create a new API
   * @param params - Parameters for creating the API
   * @returns A promise that resolves to an API response containing the created API
   */
  async createApi(params: CreateAPIParams): Promise<ApiResponse<API>> {
    return await this.httpClient.post<API>('/v1/apis', {
      body: params,
    });
  }

  /**
   * Update an existing API
   * @param apiId - The ID of the API to update
   * @param params - Parameters for updating the API
   * @returns A promise that resolves to an API response containing the updated API
   */
  async updateApi(
    slug: string,
    params: Partial<API>,
  ): Promise<ApiResponse<API>> {
    return await this.httpClient.patch<API>(`/v1/apis/${slug}`, {
      body: params,
    });
  }

  /**
   * Delete an API
   * @param apiId - The ID of the API to delete
   * @param hardDelete - Whether to hard delete the API (default: true)
   * @returns A promise that resolves to an API response with the deletion result
   */
  async deleteApi(
    slug: string,
    hardDelete: boolean = true,
  ): Promise<ApiResponse<void>> {
    return await this.httpClient.delete<void>(`/v1/apis/${slug}`, {
      params: { hardDelete },
    });
  }

  /**
   * Get all endpoints for an API
   * @param apiId - The ID of the API
   * @returns A promise that resolves to an API response containing an array of API endpoints
   */
  async getApiEndpoints(apiId: string): Promise<ApiResponse<APIEndpoint[]>> {
    return await this.httpClient.get<APIEndpoint[]>(
      `/v1/apis/endpoints/api/${apiId}`,
    );
  }

  /**
   * Get a specific API endpoint
   * @param endpointId - The ID of the endpoint to retrieve
   * @returns A promise that resolves to an API response containing the API endpoint
   */
  async getApiEndpoint(endpointId: string): Promise<ApiResponse<APIEndpoint>> {
    return await this.httpClient.get<APIEndpoint>(
      `/v1/apis/endpoints/${endpointId}`,
    );
  }

  /**
   * Update an API endpoint
   * @param endpointId - The ID of the endpoint to update
   * @param params - Parameters for updating the endpoint
   * @returns A promise that resolves to an API response containing the updated endpoint
   */
  async updateApiEndpoint(
    endpointId: string,
    params: Partial<APIEndpoint>,
  ): Promise<ApiResponse<APIEndpoint>> {
    return await this.httpClient.patch<APIEndpoint>(
      `/v1/apis/endpoints/${endpointId}`,
      {
        body: params,
      },
    );
  }

  /**
   * Delete an API endpoint
   * @param endpointId - The ID of the endpoint to delete
   * @param hardDelete - Whether to hard delete the endpoint (default: true)
   * @returns A promise that resolves to an API response with the deletion result
   */
  async deleteApiEndpoint(
    endpointId: string,
    hardDelete: boolean = true,
  ): Promise<ApiResponse<void>> {
    return await this.httpClient.delete<void>(
      `/v1/apis/endpoints/${endpointId}`,
      {
        params: { hardDelete },
      },
    );
  }

  /**
   * Create a new API endpoint
   * @param params - Parameters for creating the endpoint
   * @returns A promise that resolves to an API response containing the created endpoint
   */
  async createApiEndpoint(
    params: CreateAPIEndpointParams,
  ): Promise<ApiResponse<APIEndpoint>> {
    // Extract parameters for the body
    const bodyParams = {
      apiId: params.apiId,
      endpointName: params.endpointName,
      httpMethod: params.httpMethod,
      path: params.path,
      queryprogramId: params.queryprogramId,
      description: params.description,
      operationId: params.operationId,
      tags: params.tags || undefined,
      parameters: params.parameters || undefined,
      requestBody: params.requestBody || undefined,
      responses: params.responses || undefined,
      security: params.security || undefined,
    };

    return await this.httpClient.post<APIEndpoint>(`/v1/apis/endpoints`, {
      body: bodyParams,
    });
  }

  /**
   * Get an API by queryprogram ID
   * @param queryprogramId - The ID of the query program
   * @returns A promise that resolves to an API response containing the associated API
   */
  async getApiByQueryProgram(
    queryprogramId: string,
  ): Promise<ApiResponse<API>> {
    return await this.httpClient.get<API>(
      `/v1/apis/queryprogram/${queryprogramId}`,
    );
  }
}
