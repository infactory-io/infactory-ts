import type { Dataline, CreateDatalineParams } from '@/types/common.js';
import { sharedClient, type ApiResponse } from '@/core/shared-client.js';

export const datalinesApi = {
  getDatalines: async (
    datasourceId?: string,
  ): Promise<ApiResponse<Dataline[]>> => {
    const params = datasourceId ? { datasourceId } : {};
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
    const dataModel = params.dataModel;
    if (dataModel) delete params.dataModel;

    if (dataModel) {
      return await sharedClient.patch<Dataline>(`/v1/datalines/${datalineId}`, {
        ...params,
        data_model: dataModel,
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
    schemaCode: string,
  ): Promise<ApiResponse<Dataline>> => {
    return await sharedClient.patch<Dataline>(
      `/v1/datalines/${datalineId}/schema`,
      schemaCode,
    );
  },

  deleteDataline: async (datalineId: string): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(`/v1/datalines/${datalineId}`);
  },
};
