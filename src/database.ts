import { fetchApi } from './client';
import { ApiResponse } from './types';

export interface TableInfo {
  name: string;
  estimated_rows: number;
  estimated_size: string;
  column_count: number;
}

export interface TestConnectionResponse {
  success: boolean;
  tables: TableInfo[];
}

export interface SampleTablesRequest {
  connection_string: string;
  table_names: string[];
  project_id: string;
  datasource_id: string;
  name: string;
}

export interface I7YPendingJob {
  job_type: string;
  project_id: string;
  user_id: string | null;
  parent_job_id: string | null;
  metadata: any | null;
  payload: Record<string, any>;
}

export interface SampleTablesResponse {
  data_objects: Record<string, string>; // table_name -> data_object_id mapping
  jobs: I7YPendingJob[];
}

export interface ExecuteCustomSqlRequest {
  connection_string: string;
  sql_query: string;
  sampling_sql_query: string;
  project_id: string;
  datasource_id: string;
  name: string;
}

export interface ExecuteCustomSqlResponse {
  jobs: I7YPendingJob[];
}

export interface ValidateSqlQueryRequest {
  connection_string: string;
  sql_query: string;
}

export interface ValidateSqlQueryResponse {
  row_count: number;
  valid: boolean;
  message?: string;
}

export interface SqlParameter {
  type: string;
  field: string;
  operator: string;
  value: string;
  display_name: string;
}

export interface ExtractSqlParametersRequest {
  sql_query: string;
}

export interface ExtractSqlParametersResponse {
  parameters: SqlParameter[];
  parsed_query: string;
}

export const databaseApi = {
  testConnection: async (
    connectionString: string
  ): Promise<ApiResponse<TestConnectionResponse>> => {
    return fetchApi<TestConnectionResponse>('/v1/database/test-connection', {
      method: 'POST',
      body: JSON.stringify({ connectionString })
    });
  },

  validateSqlQuery: async (
    request: ValidateSqlQueryRequest
  ): Promise<ApiResponse<ValidateSqlQueryResponse>> => {
    return fetchApi<ValidateSqlQueryResponse>(
      '/v1/database/validate-sql-query',
      {
        method: 'POST',
        body: JSON.stringify(request)
      }
    );
  },

  extractSqlParameters: async (
    sql_query: string
  ): Promise<ApiResponse<ExtractSqlParametersResponse>> => {
    return fetchApi<ExtractSqlParametersResponse>(
      '/v1/database/extract-sql-parameters',
      {
        method: 'POST',
        body: JSON.stringify({ sql_query })
      }
    );
  },

  sampleTables: async (
    request: SampleTablesRequest
  ): Promise<ApiResponse<SampleTablesResponse>> => {
    return fetchApi<SampleTablesResponse>('/v1/database/sample-tables', {
      method: 'POST',
      body: JSON.stringify(request)
    });
  },

  executeCustomSql: async (
    request: ExecuteCustomSqlRequest
  ): Promise<ApiResponse<ExecuteCustomSqlResponse>> => {
    return fetchApi<ExecuteCustomSqlResponse>(
      '/v1/database/execute-custom-sql',
      {
        method: 'POST',
        body: JSON.stringify(request)
      }
    );
  }
};
