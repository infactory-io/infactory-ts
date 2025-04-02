import { del, fetchApi, get, patch, post } from './client';
import {
  API,
  CreateAPIParams,
  APIEndpoint,
  ApiResponse,
  QueryProgram,
  CreateAPIEndpointParams
} from './types';

export const apisApi = {
  // Get all APIs for a project
  getProjectApis: async (projectId: string): Promise<ApiResponse<API[]>> => {
    return fetchApi<API[]>(`/v1/apis/project/${projectId}`);
  },

  // Get all published query programs for a project
  getProjectPublishedPrograms: async (
    projectId: string
  ): Promise<ApiResponse<QueryProgram[]>> => {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    return get<QueryProgram[]>(
      `/v1/apis/project/${projectId}/published-programs`
    );
  },

  // Get a specific API
  getApi: async (apiId: string): Promise<ApiResponse<API>> => {
    return fetchApi<API>(`/v1/apis/${apiId}`);
  },

  // Create a new API
  createApi: async (params: CreateAPIParams): Promise<ApiResponse<API>> => {
    return post<API, CreateAPIParams>('/v1/apis', {
      body: params
    });
  },

  // Update an API
  updateApi: async (
    apiId: string,
    params: Partial<API>
  ): Promise<ApiResponse<API>> => {
    return patch<API>(`/v1/apis/${apiId}`, { params: params });
  },

  // Delete an API
  deleteApi: async (apiId: string): Promise<ApiResponse<void>> => {
    return del<void>(`/v1/apis/${apiId}`, {
      params: { hard_delete: true }
    });
  },

  // Get all endpoints for an API
  getApiEndpoints: async (
    apiId: string
  ): Promise<ApiResponse<APIEndpoint[]>> => {
    return fetchApi<APIEndpoint[]>(`/v1/apis/endpoints/api/${apiId}`);
  },

  // Get a specific endpoint
  getApiEndpoint: async (
    endpointId: string
  ): Promise<ApiResponse<APIEndpoint>> => {
    return fetchApi<APIEndpoint>(`/v1/apis/endpoints/${endpointId}`);
  },

  // Update an endpoint
  updateApiEndpoint: async (
    endpointId: string,
    params: Partial<APIEndpoint>
  ): Promise<ApiResponse<APIEndpoint>> => {
    return patch<APIEndpoint>(`/v1/apis/endpoints/${endpointId}`, {
      params: params
    });
  },

  // Delete an endpoint
  deleteApiEndpoint: async (endpointId: string): Promise<ApiResponse<void>> => {
    return del<void>(`/v1/apis/endpoints/${endpointId}`, {
      params: { hard_delete: true }
    });
  },

  // Create a new endpoint
  createApiEndpoint: async (
    params: CreateAPIEndpointParams
  ): Promise<ApiResponse<APIEndpoint>> => {
    // Separate query params and body params

    // Body parameters
    const bodyParams = {
      api_id: params.api_id,
      endpoint_name: params.endpoint_name,
      http_method: params.http_method,
      path: params.path,
      queryprogram_id: params.queryprogram_id,
      description: params.description,
      operation_id: params.operation_id,
      tags: params.tags || undefined,
      parameters: params.parameters || undefined,
      request_body: params.request_body || undefined,
      responses: params.responses || undefined,
      security: params.security || undefined
    };

    return post<APIEndpoint, CreateAPIEndpointParams>(`/v1/apis/endpoints`, {
      body: bodyParams
    });
  }
};
