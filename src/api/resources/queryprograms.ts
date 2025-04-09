import { get, post, patch, del, postStream } from '@/core/client.js';
import {
  ApiResponse,
  QueryProgram,
  CreateQueryProgramParams,
  QueryResponse,
  PaginationParams,
} from '@/types/common.js';
import { StreamOrApiResponse } from '@/utils/stream.js';

export const queryProgramsApi = {
  listQueryPrograms: async (
    params?: PaginationParams & { project_id?: string },
  ): Promise<ApiResponse<QueryProgram[]>> => {
    return await get<QueryProgram[]>(`/v1/queryprograms`, { params: params });
  },

  getQueryProgram: async (id: string): Promise<ApiResponse<QueryProgram>> => {
    return await get<QueryProgram>(`/v1/queryprograms/${id}`);
  },

  getQueryProgramsByProject: async (
    project_id?: string,
  ): Promise<ApiResponse<QueryProgram[]>> => {
    return await get<QueryProgram[]>(`/v1/queryprograms`, {
      params: { project_id },
    });
  },

  createQueryProgram: async (
    params: CreateQueryProgramParams,
  ): Promise<ApiResponse<QueryProgram>> => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value != null),
    );
    return await post<QueryProgram>('/v1/queryprograms', {
      body: filteredParams,
    });
  },

  updateQueryProgram: async (
    id: string,
    params: Partial<CreateQueryProgramParams>,
  ): Promise<ApiResponse<QueryProgram>> => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value != null),
    );
    return await patch<QueryProgram>(`/v1/queryprograms/${id}`, {
      body: filteredParams,
    });
  },

  deleteQueryProgram: async (id: string): Promise<ApiResponse<void>> => {
    return await del<void>(`/v1/queryprograms/${id}`);
  },

  /**
   * Execute a query program
   *
   * @param id - The ID of the query program to execute
   * @param params - Execution parameters
   * @param params.input_data - Optional input data for the query program
   * @param params.stream - Whether to return a streaming response
   * @param params.timeout - Optional timeout in milliseconds
   * @param params.max_tokens - Optional maximum number of tokens to generate
   * @returns Either a streaming response or a regular API response
   */
  executeQueryProgram: async (
    id: string,
    params?: {
      input_data?: Record<string, any>;
      stream?: boolean;
      timeout?: number;
      max_tokens?: number;
    },
  ): Promise<StreamOrApiResponse<QueryResponse>> => {
    if (params?.stream) {
      // Use dedicated stream parameter in the URL query string instead
      const queryParams = new URLSearchParams();
      queryParams.append('stream', 'true');
      if (params?.timeout)
        queryParams.append('timeout', params.timeout.toString());
      if (params?.max_tokens)
        queryParams.append('max_tokens', params.max_tokens.toString());

      // When posting to a stream endpoint, we need to make sure we're structuring the data properly
      const body = {
        ...(params?.input_data || {}),
        result: (params?.input_data as any)?.result || {},
      };

      return postStream<QueryResponse>(
        `/v1/queryprograms/${id}/execute?${queryParams.toString()}`,
        { body },
      );
    } else {
      // Handle non-streaming requests
      const queryParams = new URLSearchParams();
      if (params?.timeout)
        queryParams.append('timeout', params.timeout.toString());
      if (params?.max_tokens)
        queryParams.append('max_tokens', params.max_tokens.toString());

      const queryString = queryParams.toString()
        ? `?${queryParams.toString()}`
        : '';
      // Ensure the body has the required result property
      const body = {
        ...(params?.input_data || {}),
        result: (params?.input_data as any)?.result || {},
      };

      return await post<QueryResponse>(
        `/v1/queryprograms/${id}/execute${queryString}`,
        { body },
      );
    }
  },

  validateQueryProgram: async (
    id: string,
  ): Promise<ApiResponse<{ valid: boolean; errors?: string[] }>> => {
    return await post<{ valid: boolean; errors?: string[] }>(
      `/v1/queryprograms/${id}/validate`,
      { params: {} },
    );
  },

  getQueryProgramHistory: async (
    id: string,
    params?: PaginationParams & { start_date?: string; end_date?: string },
  ): Promise<ApiResponse<QueryResponse[]>> => {
    return await get<QueryResponse[]>(`/v1/queryprograms/${id}/history`, {
      params: params,
    });
  },

  createQueryProgramModel: async (
    queryProgramId: string,
  ): Promise<ApiResponse<QueryProgram>> => {
    const response = await post<QueryProgram>(
      `/v1/queryprograms/${queryProgramId}/create-model`,
    );
    return response;
  },

  publishQueryProgram: async (
    id: string,
  ): Promise<ApiResponse<QueryProgram>> => {
    return await patch<QueryProgram>(`/v1/queryprograms/${id}/publish`);
  },
};
