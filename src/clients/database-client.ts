import { HttpClient } from '../core/http-client.js';
import { ApiResponse } from '../types/common.js';
import {
  DatabaseCapabilitiesListResponse,
  DatabaseConnectionParams,
  ValidateQueryRequest,
  SampleTablesRequest,
  SampleTablesResponse,
  ExecuteCustomSqlRequest,
  ExecuteCustomSqlResponse,
  ValidateSqlQueryResponse,
} from '../types/common.js';

/**
 * Client for interacting with database functionalities in the Infactory API
 */
export class DatabaseClient {
  /**
   * Creates a new DatabaseClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Get database capabilities
   * @returns A promise that resolves to an API response containing the database capabilities
   */
  async getCapabilities(): Promise<
    ApiResponse<DatabaseCapabilitiesListResponse>
  > {
    return this.httpClient.get<DatabaseCapabilitiesListResponse>(
      '/v1/database/capabilities',
    );
  }

  /**
   * Test a database connection
   * @param params - Parameters for testing the connection
   * @returns A promise that resolves to an API response indicating success or failure
   */
  async testConnection(
    params: DatabaseConnectionParams,
  ): Promise<ApiResponse<any>> {
    return this.httpClient.post<any>('/v1/database/test-connection', params);
  }

  /**
   * Validate a database query
   * @param params - Parameters for validating the query
   * @returns A promise that resolves to an API response containing validation results
   */
  async validateQuery(
    params: ValidateQueryRequest,
  ): Promise<ApiResponse<ValidateSqlQueryResponse>> {
    return this.httpClient.post<ValidateSqlQueryResponse>(
      '/v1/database/validate-query',
      params,
    );
  }

  /**
   * Sample tables from a database connection
   * @param params - Parameters for sampling tables
   * @returns A promise that resolves to an API response containing information about the sampled tables
   */
  async sampleTables(
    params: SampleTablesRequest,
  ): Promise<ApiResponse<SampleTablesResponse>> {
    return this.httpClient.post<SampleTablesResponse>(
      '/v1/database/sample-tables',
      params,
    );
  }

  /**
   * Execute a custom SQL query against a database connection
   * @param params - Parameters for executing the query
   * @returns A promise that resolves to an API response containing the query execution results
   */
  async executeQuery(
    params: ExecuteCustomSqlRequest,
  ): Promise<ApiResponse<ExecuteCustomSqlResponse>> {
    return this.httpClient.post<ExecuteCustomSqlResponse>(
      '/v1/database/execute-query',
      params,
    );
  }
}
