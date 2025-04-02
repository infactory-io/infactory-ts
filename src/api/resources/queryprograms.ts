import { get, post, patch, del, postStream } from '@/core/client.js';
import {
  ApiResponse,
  QueryProgram,
  CreateQueryProgramParams,
  QueryResponse,
  PaginationParams,
} from '@/types/common.js';

export const queryProgramsApi = {
  listQueryPrograms: async (
    params?: PaginationParams & { dataline_id?: string },
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

  executeQueryProgram: async (
    id: string,
    params?: { input_data?: Record<string, any>; stream?: boolean },
  ): Promise<ApiResponse<QueryResponse> | ReadableStream<any>> => {
    if (params?.stream) {
      return postStream<QueryResponse>(`/v1/queryprograms/${id}/execute`, {
        params: params?.input_data || {},
      });
    } else {
      return await post<QueryResponse>(`/v1/queryprograms/${id}/execute`, {
        params: params?.input_data || {},
      });
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
