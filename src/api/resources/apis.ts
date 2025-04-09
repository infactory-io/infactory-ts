import { sharedClient, ApiResponse } from '@/core/shared-client.js';
import {
  API,
  CreateAPIParams,
  APIEndpoint,
  QueryProgram,
  CreateAPIEndpointParams,
} from '@/types/common.js';

export const apisApi = {
  // Get all APIs for a project
  getProjectApis: async (projectId: string): Promise<ApiResponse<API[]>> => {
    return await sharedClient.get<API[]>(`/v1/apis/project/${projectId}`);
  },

  // Get all published query programs for a project
  getProjectPublishedPrograms: async (
    projectId: string,
  ): Promise<ApiResponse<QueryProgram[]>> => {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    return await sharedClient.get<QueryProgram[]>(
      `/v1/apis/project/${projectId}/published-programs`,
    );
  },

  // Get a specific API
  getApi: async (apiId: string): Promise<ApiResponse<API>> => {
    return await sharedClient.get<API>(`/v1/apis/${apiId}`);
  },

  // Create a new API
  createApi: async (params: CreateAPIParams): Promise<ApiResponse<API>> => {
    return await sharedClient.post<API>('/v1/apis', {
      body: params,
    });
  },

  // Update an API
  updateApi: async (
    apiId: string,
    params: Partial<API>,
  ): Promise<ApiResponse<API>> => {
    return await sharedClient.patch<API>(`/v1/apis/${apiId}`, { body: params });
  },

  // Delete an API
  deleteApi: async (apiId: string): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(`/v1/apis/${apiId}`, {
      params: { hardDelete: true },
    });
  },

  // Get all endpoints for an API
  getApiEndpoints: async (
    apiId: string,
  ): Promise<ApiResponse<APIEndpoint[]>> => {
    return await sharedClient.get<APIEndpoint[]>(
      `/v1/apis/endpoints/api/${apiId}`,
    );
  },

  // Get a specific endpoint
  getApiEndpoint: async (
    endpointId: string,
  ): Promise<ApiResponse<APIEndpoint>> => {
    return await sharedClient.get<APIEndpoint>(
      `/v1/apis/endpoints/${endpointId}`,
    );
  },

  // Update an endpoint
  updateApiEndpoint: async (
    endpointId: string,
    params: Partial<APIEndpoint>,
  ): Promise<ApiResponse<APIEndpoint>> => {
    return await sharedClient.patch<APIEndpoint>(
      `/v1/apis/endpoints/${endpointId}`,
      {
        body: params,
      },
    );
  },

  // Delete an endpoint
  deleteApiEndpoint: async (endpointId: string): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(`/v1/apis/endpoints/${endpointId}`, {
      params: { hardDelete: true },
    });
  },

  // Create a new endpoint
  createApiEndpoint: async (
    params: CreateAPIEndpointParams,
  ): Promise<ApiResponse<APIEndpoint>> => {
    // Separate query params and body params

    // Body parameters
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

    return await sharedClient.post<APIEndpoint>(`/v1/apis/endpoints`, {
      body: bodyParams,
    });
  },
};
