import { HttpClient } from '../core/http-client.js';
import { ApiResponse, TestConnectionResponse } from '../types/common.js';
import {
  Datasource,
  CreateDatasourceParams,
  DatasourceWithDatalines,
  Graph,
} from '../types/common.js';
import { SubmitJobParams } from '../api/jobs.js';
import * as path from 'path';
import * as fs from 'fs';
import FormData from 'form-data';

// Import database-related interfaces
import {
  SampleTablesRequest as DatabaseSampleTablesRequest,
  SampleTablesResponse,
  ExecuteCustomSqlRequest,
  ExecuteCustomSqlResponse,
  ValidateSqlQueryRequest,
  ValidateSqlQueryResponse,
  ExtractSqlParametersResponse,
} from '../types/common.js';

/**
 * Client for managing datasources in the Infactory API
 */
export class DatasourcesClient {
  /**
   * Creates a new DatasourcesClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Get datasources for a project
   * @param projectId - The ID of the project
   * @returns A promise that resolves to an API response containing an array of datasources
   */
  async getProjectDatasources(
    projectId: string,
  ): Promise<ApiResponse<Datasource[]>> {
    return await this.httpClient.get<Datasource[]>(
      `/v1/datasources/project/${projectId}`,
    );
  }

  /**
   * Get a datasource with its associated datalines
   * @param datasourceId - The ID of the datasource
   * @returns A promise that resolves to an API response containing the datasource with datalines
   */
  async getDatasourceWithDatalines(
    datasourceId: string,
  ): Promise<ApiResponse<DatasourceWithDatalines>> {
    return await this.httpClient.get<DatasourceWithDatalines>(
      `/v1/datasources/${datasourceId}/with_datalines`,
    );
  }

  /**
   * Get a datasource by ID
   * @param datasourceId - The ID of the datasource to retrieve
   * @returns A promise that resolves to an API response containing the datasource
   */
  async getDatasource(datasourceId: string): Promise<ApiResponse<Datasource>> {
    return await this.httpClient.get<Datasource>(
      `/v1/datasources/${datasourceId}`,
    );
  }

  /**
   * Create a new datasource
   * @param params - Parameters for creating the datasource
   * @returns A promise that resolves to an API response containing the created datasource
   */
  async createDatasource(
    params: CreateDatasourceParams,
  ): Promise<ApiResponse<Datasource>> {
    return await this.httpClient.post<Datasource>(`/v1/datasources`, params);
  }

  /**
   * Update an existing datasource
   * @param datasourceId - The ID of the datasource to update
   * @param params - Parameters for updating the datasource
   * @returns A promise that resolves to an API response containing the updated datasource
   */
  async updateDatasource(
    datasourceId: string,
    params: Partial<CreateDatasourceParams>,
  ): Promise<ApiResponse<Datasource>> {
    return await this.httpClient.patch<Datasource>(
      `/v1/datasources/${datasourceId}`,
      params,
    );
  }

  /**
   * Delete a datasource
   * @param datasourceId - The ID of the datasource to delete
   * @param permanent - Whether to permanently delete the datasource (defaults to false)
   * @returns A promise that resolves to an API response with the deletion result
   */
  async deleteDatasource(
    datasourceId: string,
    permanent: boolean = false,
  ): Promise<ApiResponse<void>> {
    return await this.httpClient.delete<void>(
      `/v1/datasources/${datasourceId}?permanent=${permanent}`,
    );
  }

  /**
   * Clone a datasource to a new project
   * @param datasourceId - The ID of the datasource to clone
   * @param newProjectId - The ID of the project to clone the datasource to
   * @returns A promise that resolves to an API response containing the cloned datasource
   */
  async cloneDatasource(
    datasourceId: string,
    newProjectId: string,
  ): Promise<ApiResponse<Datasource>> {
    return await this.httpClient.post<Datasource>(
      `/v1/datasources/${datasourceId}/clone`,
      {
        new_projectId: newProjectId,
      },
    );
  }

  /**
   * Upload a file to a datasource
   * @param projectId - Project ID
   * @param datasourceId - Datasource ID (optional if creating a new datasource)
   * @param formData - Form data containing the file to upload
   * @param jobId - Job ID for tracking the upload
   * @returns A promise that resolves to a readable stream of upload events
   */
  async uploadDatasource(
    projectId: string,
    datasourceId: string | undefined,
    formData: FormData,
    jobId: string,
  ): Promise<ReadableStream<Uint8Array>> {
    return await this.httpClient.createStream(`/v1/actions/load/${projectId}`, {
      url: `/v1/actions/load/${projectId}`,
      method: 'POST',
      params: { datasourceId: datasourceId, jobId: jobId },
      body: formData as unknown as BodyInit,
      headers: {
        Accept: 'text/event-stream',
      },
    });
  }

  /**
   * Get the ontology graph for a datasource
   * @param datasourceId - The ID of the datasource
   * @returns A promise that resolves to an API response containing the ontology graph
   */
  async getOntologyGraph(datasourceId: string): Promise<ApiResponse<Graph>> {
    return await this.httpClient.get<Graph>(
      `/v1/datasources/${datasourceId}/ontology_mapping`,
    );
  }

  /**
   * Upload a CSV file to a project by creating a datasource and uploading a file in one operation
   * @param projectId - Project ID
   * @param csvFilePath - Path to the CSV file to upload
   * @param datasourceName - Optional name for the datasource (defaults to file name + timestamp)
   * @param customSubmitJob - Optional function to submit the job (if you need custom job handling)
   * @returns The created datasource and job ID
   */
  async uploadCsvFile(
    projectId: string,
    csvFilePath: string,
    datasourceName?: string,
    customSubmitJob?: (client: any, params: SubmitJobParams) => Promise<string>,
  ): Promise<{
    datasource: Datasource;
    jobId: string;
    uploadResponse: Response;
  }> {
    // Generate datasource name if not provided
    const now = new Date().toISOString().replace(/:/g, '-');
    const fileName = path.basename(csvFilePath);
    const actualDatasourceName = datasourceName || `${fileName} ${now}`;

    // Infer type from file extension
    const fileExtension = path.extname(csvFilePath).toLowerCase();
    const datasourceType = fileExtension === '.csv' ? 'csv' : 'csv'; // Default to CSV

    // Create the datasource
    const datasourceResponse = await this.httpClient.post<Datasource>(
      `/v1/datasources`,
      {
        name: actualDatasourceName,
        projectId: projectId,
        type: datasourceType,
      },
    );

    if (datasourceResponse.error) {
      throw datasourceResponse.error;
    }

    const datasource = datasourceResponse.data;
    if (!datasource) {
      throw new Error('Error creating datasource: Datasource not found');
    }

    // Get file info
    const fileSize = fs.statSync(csvFilePath).size;

    // Create a job payload for the upload
    const jobPayload = {
      datasourceId: datasource.id,
      fileName: fileName,
      fileSize: fileSize,
      datasetName: actualDatasourceName,
    };

    const jobMetadata = {
      fileName: fileName,
      fileSize: fileSize,
      datasetName: actualDatasourceName,
    };

    // Submit the job using custom function or default approach
    let jobId: string;

    if (customSubmitJob) {
      // Use the provided custom submit job function
      jobId = await customSubmitJob(null, {
        projectId: projectId,
        jobType: 'upload',
        payload: jobPayload,
        doNotSendToQueue: true,
        sourceId: datasource.id,
        source: 'datasource',
        sourceEventType: 'file_upload',
        sourceMetadata: JSON.stringify(jobMetadata),
      });
    } else {
      // Use standard job submission
      const jobResponse = await this.httpClient.post<string>(
        '/v1/jobs/submit',
        {
          projectId: projectId,
          jobType: 'upload',
          payload: jobPayload,
          doNotSendToQueue: true,
          sourceId: datasource.id,
          source: 'datasource',
          sourceEventType: 'file_upload',
          sourceMetadata: JSON.stringify(jobMetadata),
        },
      );

      if (jobResponse.error) {
        throw jobResponse.error;
      }

      jobId = jobResponse.data || '';
    }

    if (!jobId) {
      throw new Error('Error: No job ID received from job submission');
    }

    // Create FormData with the file
    const formData = new FormData();
    formData.append('file', fs.createReadStream(csvFilePath));
    // NOTE: Keep the form data in snake case because the API expects it
    formData.append('datasource_id', datasource.id);
    formData.append('job_id', jobId);

    // Upload the file using the shared client
    const uploadResponse = await this.httpClient.request<any>({
      url: `/v1/actions/load/${projectId}`,
      method: 'POST',
      params: {
        jobId: jobId,
        datasourceId: datasource.id,
      },
      body: formData as unknown as BodyInit,
    });

    if (uploadResponse.error) {
      throw uploadResponse.error;
    }

    return {
      datasource,
      jobId,
      uploadResponse: uploadResponse as unknown as Response,
    };
  }

  /**
   * Test a database connection
   * @param connectionString - The database connection string to test
   * @returns A promise that resolves to an API response containing the test results
   */
  async testDatabaseConnection(
    connectionString: string,
  ): Promise<ApiResponse<TestConnectionResponse>> {
    return await this.httpClient.post<TestConnectionResponse>(
      '/v1/database/test-connection',
      {
        body: { connection_string: connectionString },
      },
    );
  }

  /**
   * Sample tables from a database
   * @param request - The request parameters for sampling tables
   * @returns A promise that resolves to an API response containing the sampled tables
   */
  async sampleDatabaseTables(
    request: DatabaseSampleTablesRequest,
  ): Promise<ApiResponse<SampleTablesResponse>> {
    // Convert camelCase to snake_case for API request
    return await this.httpClient.post<SampleTablesResponse>(
      '/v1/database/sample-tables',
      {
        body: {
          connection_string: request.connectionString,
          table_names: request.tableNames,
          project_id: request.projectId,
          datasource_id: request.datasourceId,
          name: request.name,
        },
      },
    );
  }

  /**
   * Execute custom SQL on a database
   * @param request - The request parameters for executing custom SQL
   * @returns A promise that resolves to an API response containing the execution results
   */
  async executeCustomSql(
    request: ExecuteCustomSqlRequest,
  ): Promise<ApiResponse<ExecuteCustomSqlResponse>> {
    // Convert camelCase to snake_case for API request
    return await this.httpClient.post<ExecuteCustomSqlResponse>(
      '/v1/database/execute-custom-sql',
      {
        body: {
          connection_string: request.connectionString,
          sql_query: request.sqlQuery,
          sampling_sql_query: request.samplingSqlQuery,
          project_id: request.projectId,
          datasource_id: request.datasourceId,
          name: request.name,
        },
      },
    );
  }

  /**
   * Validate SQL query syntax and get row count
   * @param request - The request parameters for validating the SQL query
   * @returns A promise that resolves to an API response containing the validation results
   */
  async validateSqlQuery(
    request: ValidateSqlQueryRequest,
  ): Promise<ApiResponse<ValidateSqlQueryResponse>> {
    // Convert camelCase to snake_case for API request
    return await this.httpClient.post<ValidateSqlQueryResponse>(
      '/v1/database/validate-sql-query',
      {
        body: {
          connection_string: request.connectionString,
          sql_query: request.sqlQuery,
        },
      },
    );
  }

  /**
   * Validate SQL syntax
   * @param request - The request parameters for validating SQL syntax
   * @returns A promise that resolves to an API response containing the validation results
   */
  async validateSqlSyntax(request: {
    connectionString: string;
    sqlQuery: string;
  }): Promise<ApiResponse<ValidateSqlQueryResponse>> {
    // Convert camelCase to snake_case for API request
    return await this.httpClient.post<ValidateSqlQueryResponse>(
      '/v1/database/validate-sql-syntax',
      {
        body: {
          connection_string: request.connectionString,
          sql_query: request.sqlQuery,
        },
      },
    );
  }

  /**
   * Extract parameters from a SQL query
   * @param sqlQuery - The SQL query to extract parameters from
   * @returns A promise that resolves to an API response containing the extracted parameters
   */
  async extractSqlParameters(
    sqlQuery: string,
  ): Promise<ApiResponse<ExtractSqlParametersResponse>> {
    // Convert camelCase to snake_case for API request
    return await this.httpClient.post<ExtractSqlParametersResponse>(
      '/v1/database/extract-sql-parameters',
      {
        body: { sql_query: sqlQuery },
      },
    );
  }
}
