import { fetchApi, get, postStream } from './client';
import {
  Datasource,
  CreateDatasourceParams,
  ApiResponse,
  DatasourceWithDatalines,
  Graph
} from './types';

export const datasourcesApi = {
  getProjectDatasources: async (
    projectId: string
  ): Promise<ApiResponse<Datasource[]>> => {
    return fetchApi<Datasource[]>(`/v1/datasources/project/${projectId}`);
  },

  getDatasourceWithDatalines: async (
    datasourceId: string
  ): Promise<ApiResponse<DatasourceWithDatalines>> => {
    return fetchApi<DatasourceWithDatalines>(
      `/v1/datasources/${datasourceId}/with_datalines`
    );
  },

  getDatasource: async (
    datasourceId: string
  ): Promise<ApiResponse<Datasource>> => {
    return fetchApi<Datasource>(`/v1/datasources/${datasourceId}`);
  },

  createDatasource: async (
    params: CreateDatasourceParams
  ): Promise<ApiResponse<Datasource>> => {
    // Extract the project_id from the params using pop
    return fetchApi<Datasource>(`/v1/datasources`, {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  updateDatasource: async (
    datasourceId: string,
    params: Partial<CreateDatasourceParams>
  ): Promise<ApiResponse<Datasource>> => {
    return fetchApi<Datasource>(`/v1/datasources/${datasourceId}`, {
      method: 'PATCH',
      body: JSON.stringify(params)
    });
  },

  deleteDatasource: async (
    datasourceId: string
  ): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/v1/datasources/${datasourceId}?permanent=false`, {
      method: 'DELETE'
    });
  },

  cloneDatasource: async (
    datasourceId: string,
    newProjectId: string
  ): Promise<ApiResponse<Datasource>> => {
    return fetchApi<Datasource>(`/v1/datasources/${datasourceId}/clone`, {
      method: 'POST',
      body: JSON.stringify({ new_project_id: newProjectId })
    });
  },

  uploadDatasource: async (
    projectId: string,
    datasourceId: string | undefined,
    formData: FormData,
    jobId: string
  ): Promise<ReadableStream> => {
    // The FormData already contains the source_name if provided
    return postStream(`/v1/actions/load/${projectId}`, {
      params: { datasource_id: datasourceId, job_id: jobId },
      body: formData,
      options: {
        headers: {
          Accept: 'text/event-stream'
          // Don't set Content-Type - let browser set it with boundary for FormData
        }
      }
    });
  },

  getOntologyGraph: async (
    datasourceId: string
  ): Promise<ApiResponse<Graph>> => {
    return get<Graph>(`/v1/datasources/${datasourceId}/ontology_mapping`);
  }
};
