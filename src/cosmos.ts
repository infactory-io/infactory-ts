import { fetchApi } from './client';
import { ApiResponse } from './types';
import { I7YPendingJob } from './database';

export interface ContainerInfo {
  name: string;
  document_count: number;
  size_in_kb: number;
  partition_key: string;
}

export interface TestCosmosConnectionRequest {
  endpoint: string;
  key: string;
  database_name: string;
  max_containers?: number;
}

export interface TestCosmosConnectionResponse {
  success: boolean;
  message?: string;
  containers?: ContainerInfo[];
}

export interface SampleContainerRequest {
  endpoint: string;
  key: string;
  database_name: string;
  container_names: string[];
  project_id: string;
  datasource_id: string;
  name?: string;
}

export interface SampleContainersResponse {
  jobs: I7YPendingJob[];
}

export interface ExecuteCosmosQueryRequest {
  endpoint: string;
  key: string;
  database_name: string;
  container_name: string;
  query: string;
  project_id: string;
  datasource_id: string;
  query_metadata?: Record<string, any>;
  name?: string;
}

export interface ExecuteCosmosQueryResponse {
  query_id: string;
  data_id: string;
  row_count: number;
  sql_query?: string;
}

export interface ValidateCosmosQueryRequest {
  endpoint: string;
  key: string;
  database_name: string;
  container_name: string;
  query: string;
}

export interface ValidateCosmosQueryResponse {
  valid: boolean;
  message?: string;
  row_count?: number;
}

export interface CosmosQueryParameter {
  type: string;
  field: string;
  operator: string;
  value: string;
  display_name: string;
}

export interface ExtractCosmosParametersRequest {
  query: string;
}

export interface ExtractCosmosParametersResponse {
  parameters: CosmosQueryParameter[];
  parsed_query: string;
}

export interface ExtractParametersResponse {
  parameters?: { name: string; value: string }[];
  parsed_query?: string;
}

export const cosmosApi = {
  testConnection: async (connectionDetails: {
    endpoint: string;
    key: string;
    database_name: string;
  }): Promise<ApiResponse<TestCosmosConnectionResponse>> => {
    return fetchApi<TestCosmosConnectionResponse>(
      '/v1/cosmos/cosmos/test-connection',
      {
        method: 'POST',
        body: JSON.stringify(connectionDetails)
      }
    );
  },

  validateQuery: async (params: {
    endpoint: string;
    key: string;
    database_name: string;
    container_name: string;
    query: string;
  }): Promise<ApiResponse<ValidateCosmosQueryResponse>> => {
    return fetchApi<ValidateCosmosQueryResponse>(
      '/v1/cosmos/cosmos/validate-query',
      {
        method: 'POST',
        body: JSON.stringify(params)
      }
    );
  },

  extractParameters: async (
    query: string
  ): Promise<ApiResponse<ExtractParametersResponse>> => {
    return fetchApi<ExtractParametersResponse>(
      '/v1/cosmos/cosmos/extract-parameters',
      {
        method: 'POST',
        body: JSON.stringify({ query })
      }
    );
  },

  sampleContainers: async (params: {
    endpoint: string;
    key: string;
    database_name: string;
    container_names: string[];
    project_id: string;
    datasource_id: string;
    name?: string;
  }): Promise<ApiResponse<SampleContainersResponse>> => {
    return fetchApi<SampleContainersResponse>(
      '/v1/cosmos/cosmos/sample-containers',
      {
        method: 'POST',
        body: JSON.stringify(params)
      }
    );
  },

  executeQuery: async (params: {
    endpoint: string;
    key: string;
    database_name: string;
    container_name: string;
    query: string;
    project_id: string;
    datasource_id: string;
    query_metadata?: Record<string, any>;
    name?: string;
  }): Promise<ApiResponse<ExecuteCosmosQueryResponse>> => {
    return fetchApi<ExecuteCosmosQueryResponse>(
      '/v1/cosmos/cosmos/execute-query',
      {
        method: 'POST',
        body: JSON.stringify(params)
      }
    );
  }
};
