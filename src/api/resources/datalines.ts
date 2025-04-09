import type { Dataline, CreateDatalineParams } from '@/types/common.js';
import { sharedClient, type ApiResponse } from '@/core/shared-client.js';

export const datalinesApi = {
  getDatalines: async (
    datasource_id?: string,
  ): Promise<ApiResponse<Dataline[]>> => {
    const params = datasource_id ? { datasource_id } : {};
    return await sharedClient.get<Dataline[]>(`/v1/datalines`, { params });
  },

  getProjectDatalines: async (
    projectId: string,
  ): Promise<ApiResponse<Dataline[]>> => {
    return await sharedClient.get<Dataline[]>(
      `/v1/datalines/project/${projectId}`,
    );
  },

  getDataline: async (datalineId: string): Promise<ApiResponse<Dataline>> => {
    return await sharedClient.get<Dataline>(`/v1/datalines/${datalineId}`);
  },

  createDataline: async (
    params: CreateDatalineParams,
  ): Promise<ApiResponse<Dataline>> => {
    return await sharedClient.post<Dataline>('/v1/datalines', params);
  },

  updateDataline: async (
    datalineId: string,
    params: Partial<CreateDatalineParams>,
  ): Promise<ApiResponse<Dataline>> => {
    const data_model = params.data_model;
    if (data_model) delete params.data_model;

    if (data_model) {
      return await sharedClient.patch<Dataline>(`/v1/datalines/${datalineId}`, {
        ...params,
        data_model,
      });
    } else {
      return await sharedClient.patch<Dataline>(
        `/v1/datalines/${datalineId}`,
        params,
      );
    }
  },

  updateDatalineSchema: async (
    datalineId: string,
    schema_code: string,
  ): Promise<ApiResponse<Dataline>> => {
    return await sharedClient.patch<Dataline>(
      `/v1/datalines/${datalineId}/schema`,
      schema_code,
    );
  },

  deleteDataline: async (datalineId: string): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(`/v1/datalines/${datalineId}`);
  },
};
