import { sharedClient, ApiResponse } from '@/core/shared-client.js';
import { I7YPendingJob } from './database.js';

export interface ContainerInfo {
  name: string;
  documentCount: number;
  sizeInKb: number;
  partitionKey: string;
}

export interface TestCosmosConnectionRequest {
  endpoint: string;
  key: string;
  databaseName: string;
  maxContainers?: number;
}

export interface TestCosmosConnectionResponse {
  success: boolean;
  message?: string;
  containers?: ContainerInfo[];
}

export interface SampleContainerRequest {
  endpoint: string;
  key: string;
  databaseName: string;
  containerNames: string[];
  projectId: string;
  datasourceId: string;
  name?: string;
}

export interface SampleContainersResponse {
  jobs: I7YPendingJob[];
}

export interface ExecuteCosmosQueryRequest {
  endpoint: string;
  key: string;
  databaseName: string;
  containerName: string;
  query: string;
  projectId: string;
  datasourceId: string;
  queryMetadata?: Record<string, any>;
  name?: string;
}

export interface ExecuteCosmosQueryResponse {
  queryId: string;
  dataId: string;
  rowCount: number;
  sqlQuery?: string;
}

export interface ValidateCosmosQueryRequest {
  endpoint: string;
  key: string;
  databaseName: string;
  containerName: string;
  query: string;
}

export interface ValidateCosmosQueryResponse {
  valid: boolean;
  message?: string;
  rowCount?: number;
}

export interface CosmosQueryParameter {
  type: string;
  field: string;
  operator: string;
  value: string;
  displayName: string;
}

export interface ExtractCosmosParametersRequest {
  query: string;
}

export interface ExtractCosmosParametersResponse {
  parameters: CosmosQueryParameter[];
  parsedQuery: string;
}

export interface ExtractParametersResponse {
  parameters?: { name: string; value: string }[];
  parsedQuery?: string;
}

export const cosmosApi = {
  testConnection: async (connectionDetails: {
    endpoint: string;
    key: string;
    databaseName: string;
  }): Promise<ApiResponse<TestCosmosConnectionResponse>> => {
    return sharedClient.post<TestCosmosConnectionResponse>(
      '/v1/cosmos/cosmos/test-connection',
      {
        body: connectionDetails,
      },
    );
  },

  validateQuery: async (params: {
    endpoint: string;
    key: string;
    databaseName: string;
    containerName: string;
    query: string;
  }): Promise<ApiResponse<ValidateCosmosQueryResponse>> => {
    return sharedClient.post<ValidateCosmosQueryResponse>(
      '/v1/cosmos/cosmos/validate-query',
      {
        body: params,
      },
    );
  },

  extractParameters: async (
    query: string,
  ): Promise<ApiResponse<ExtractParametersResponse>> => {
    return sharedClient.post<ExtractParametersResponse>(
      '/v1/cosmos/cosmos/extract-parameters',
      {
        body: { query },
      },
    );
  },

  sampleContainers: async (params: {
    endpoint: string;
    key: string;
    databaseName: string;
    containerNames: string[];
    projectId: string;
    datasourceId: string;
    name?: string;
  }): Promise<ApiResponse<SampleContainersResponse>> => {
    return sharedClient.post<SampleContainersResponse>(
      '/v1/cosmos/cosmos/sample-containers',
      {
        body: params,
      },
    );
  },

  executeQuery: async (params: {
    endpoint: string;
    key: string;
    databaseName: string;
    containerName: string;
    query: string;
    projectId: string;
    datasourceId: string;
    queryMetadata?: Record<string, any>;
    name?: string;
  }): Promise<ApiResponse<ExecuteCosmosQueryResponse>> => {
    return sharedClient.post<ExecuteCosmosQueryResponse>(
      '/v1/cosmos/cosmos/execute-query',
      {
        body: params,
      },
    );
  },
};
