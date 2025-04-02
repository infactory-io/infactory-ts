import { get, post, del, patch } from '@/core/client.js';
import { Dataline, CreateDatalineParams, ApiResponse } from '@/types/common.js';

export const datalinesApi = {
  getDatalines: async (
    datasource_id?: string,
  ): Promise<ApiResponse<Dataline[]>> => {
    const params = datasource_id ? { datasource_id } : {};
    return await get<Dataline[]>(`/v1/datalines`, { params: params });
  },

  getProjectDatalines: async (
    projectId: string,
  ): Promise<ApiResponse<Dataline[]>> => {
    return await get<Dataline[]>(`/v1/datalines/project/${projectId}`);
  },

  getDataline: async (datalineId: string): Promise<ApiResponse<Dataline>> => {
    return await get<Dataline>(`/v1/datalines/${datalineId}`);
  },

  createDataline: async (
    params: CreateDatalineParams,
  ): Promise<ApiResponse<Dataline>> => {
    return await post<Dataline>('/v1/datalines', { params: params });
  },

  updateDataline: async (
    datalineId: string,
    params: Partial<CreateDatalineParams>,
  ): Promise<ApiResponse<Dataline>> => {
    const data_model = params.data_model;
    if (data_model) delete params.data_model;

    if (data_model) {
      return await patch<Dataline, Record<string, any>>(
        `/v1/datalines/${datalineId}`,
        { params: params, body: data_model },
      );
    } else {
      return await patch<Dataline>(`/v1/datalines/${datalineId}`, {
        params: params,
      });
    }
  },

  updateDatalineSchema: async (
    datalineId: string,
    schema_code: string,
  ): Promise<ApiResponse<Dataline>> => {
    return await patch<Dataline>(`/v1/datalines/${datalineId}/schema`, {
      body: schema_code,
    });
  },

  deleteDataline: async (datalineId: string): Promise<ApiResponse<void>> => {
    return await del<void>(`/v1/datalines/${datalineId}`);
  },
};
