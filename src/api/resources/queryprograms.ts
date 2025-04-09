import type {
  QueryProgram,
  CreateQueryProgramParams,
  QueryResponse,
  PaginationParams,
} from '@/types/common.js';
import { sharedClient, type ApiResponse } from '@/core/shared-client.js';

export const queryProgramsApi = {
  listQueryPrograms: async (
    params?: PaginationParams & { projectId?: string },
  ): Promise<ApiResponse<QueryProgram[]>> => {
    return await sharedClient.get<QueryProgram[]>(`/v1/queryprograms`, {
      params,
    });
  },

  getQueryProgram: async (id: string): Promise<ApiResponse<QueryProgram>> => {
    return await sharedClient.get<QueryProgram>(`/v1/queryprograms/${id}`);
  },

  getQueryProgramsByProject: async (
    projectId?: string,
  ): Promise<ApiResponse<QueryProgram[]>> => {
    return await sharedClient.get<QueryProgram[]>(`/v1/queryprograms`, {
      projectId: projectId,
    });
  },

  createQueryProgram: async (
    params: CreateQueryProgramParams,
  ): Promise<ApiResponse<QueryProgram>> => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value != null),
    );
    return await sharedClient.post<QueryProgram>(
      '/v1/queryprograms',
      filteredParams,
    );
  },

  updateQueryProgram: async (
    id: string,
    params: Partial<CreateQueryProgramParams>,
  ): Promise<ApiResponse<QueryProgram>> => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value != null),
    );
    return await sharedClient.patch<QueryProgram>(
      `/v1/queryprograms/${id}`,
      filteredParams,
    );
  },

  deleteQueryProgram: async (id: string): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(`/v1/queryprograms/${id}`);
  },

  executeQueryProgram: async (
    id: string,
    params?: Record<string, any>,
  ): Promise<ApiResponse<QueryResponse>> => {
    return await sharedClient.post<QueryResponse>(
      `/v1/queryprograms/${id}/execute`,
      params || {},
    );
  },

  executeQueryProgramStream: async (
    id: string,
    params?: Record<string, any>,
  ): Promise<ReadableStream> => {
    return await sharedClient.createStream(`/v1/queryprograms/${id}/execute`, {
      url: `/v1/queryprograms/${id}/execute`,
      method: 'POST',
      jsonBody: params || {},
      headers: {
        Accept: 'text/event-stream',
      },
    });
  },

  validateQueryProgram: async (
    params: CreateQueryProgramParams,
  ): Promise<ApiResponse<{ valid: boolean; errors?: string[] }>> => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value != null),
    );
    return await sharedClient.post<{ valid: boolean; errors?: string[] }>(
      '/v1/queryprograms/validate',
      filteredParams,
    );
  },

  getQueryProgramHistory: async (
    id: string,
    params?: PaginationParams & { start_date?: string; end_date?: string },
  ): Promise<ApiResponse<QueryResponse[]>> => {
    return await sharedClient.get<QueryResponse[]>(
      `/v1/queryprograms/${id}/history`,
      {
        params: params,
      },
    );
  },

  createQueryProgramModel: async (
    queryProgramId: string,
  ): Promise<ApiResponse<QueryProgram>> => {
    const response = await sharedClient.post<QueryProgram>(
      `/v1/queryprograms/${queryProgramId}/create-model`,
    );
    return response;
  },

  publishQueryProgram: async (
    id: string,
  ): Promise<ApiResponse<QueryProgram>> => {
    return await sharedClient.patch<QueryProgram>(
      `/v1/queryprograms/${id}/publish`,
    );
  },
};
