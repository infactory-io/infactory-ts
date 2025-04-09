import { sharedClient, ApiResponse } from '@/core/shared-client.js';

export interface TableInfo {
  name: string;
  estimatedRows: number;
  estimatedSize: string;
  columnCount: number;
}

export interface TestConnectionResponse {
  success: boolean;
  tables: TableInfo[];
}

export interface SampleTablesRequest {
  connectionString: string;
  tableNames: string[];
  projectId: string;
  datasourceId: string;
  name: string;
}

export interface I7YPendingJob {
  jobType: string;
  projectId: string;
  userId: string | null;
  parentJobId: string | null;
  metadata: any;
  payload: Record<string, any>;
}

export interface SampleTablesResponse {
  dataObjects: Record<string, string>; // table_name -> data_object_id mapping
  jobs: I7YPendingJob[];
}

export interface ExecuteCustomSqlRequest {
  connectionString: string;
  sqlQuery: string;
  samplingSqlQuery: string;
  projectId: string;
  datasourceId: string;
  name: string;
}

export interface ExecuteCustomSqlResponse {
  jobs: I7YPendingJob[];
}

export interface ValidateSqlQueryRequest {
  connectionString: string;
  sqlQuery: string;
}

export interface ValidateSqlQueryResponse {
  rowCount: number;
  valid: boolean;
  message?: string;
}

export interface SqlParameter {
  type: string;
  field: string;
  operator: string;
  value: string;
  displayName: string;
}

export interface ExtractSqlParametersRequest {
  sqlQuery: string;
}

export interface ExtractSqlParametersResponse {
  parameters: SqlParameter[];
  parsedQuery: string;
}

export const databaseApi = {
  testConnection: async (
    connectionString: string,
  ): Promise<ApiResponse<TestConnectionResponse>> => {
    return sharedClient.post<TestConnectionResponse>(
      '/v1/database/test-connection',
      {
        body: { connectionString },
      },
    );
  },

  validateSqlQuery: async (
    request: ValidateSqlQueryRequest,
  ): Promise<ApiResponse<ValidateSqlQueryResponse>> => {
    return sharedClient.post<ValidateSqlQueryResponse>(
      '/v1/database/validate-sql-query',
      {
        body: request,
      },
    );
  },

  extractSqlParameters: async (
    sqlQuery: string,
  ): Promise<ApiResponse<ExtractSqlParametersResponse>> => {
    return sharedClient.post<ExtractSqlParametersResponse>(
      '/v1/database/extract-sql-parameters',
      {
        body: { sqlQuery },
      },
    );
  },

  sampleTables: async (
    request: SampleTablesRequest,
  ): Promise<ApiResponse<SampleTablesResponse>> => {
    return sharedClient.post<SampleTablesResponse>(
      '/v1/database/sample-tables',
      {
        body: request,
      },
    );
  },

  executeCustomSql: async (
    request: ExecuteCustomSqlRequest,
  ): Promise<ApiResponse<ExecuteCustomSqlResponse>> => {
    return sharedClient.post<ExecuteCustomSqlResponse>(
      '/v1/database/execute-custom-sql',
      {
        body: request,
      },
    );
  },
};
