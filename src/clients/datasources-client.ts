// src/clients/datasources-client.ts

import { HttpClient } from '../core/http-client.js';
import {
  ApiResponse,
  TestConnectionResponse,
  Datasource,
  CreateDatasourceParams,
  DatasourceWithDatalines,
  Graph,
  SampleTablesRequest as DatabaseSampleTablesRequest,
  SampleTablesResponse,
  ExecuteCustomSqlRequest,
  ExecuteCustomSqlResponse,
  ValidateSqlQueryRequest,
  ValidateSqlQueryResponse,
  ExtractSqlParametersResponse,
} from '../types/common.js'; // Ensure all necessary types are imported
import * as path from 'path';
import * as fs from 'fs';

// import type { Blob as NodeBlob } from 'buffer';     // for Node typings
import type { ReadStream } from 'fs';
import { uploadCsvFile } from '@/utils/uploadCsvFile.js';
// import { fileURLToPath } from 'url';

/**
 * Acceptable "file" shapes for the helper.
 * – Browser:  File | Blob
 * – Node:     string (path), Buffer, ReadStream, Blob
 */
export type Uploadable = File | Blob | Buffer | ReadStream | string;

/** Options expected by the helper */
export interface UploadCsvOptions {
  /**
   * UUID shown in the URL path:  /v1/actions/load/{projectId}
   */
  projectId: string;
  /**
   * Same UUID that goes into the ?datasource_id= query string.
   */
  datasourceId: string;
  /**
   * CSV you want to send (path, File, Buffer, etc.).
   */
  file: Uploadable;
  /**
   * Raw bearer token without the "Bearer " prefix.
   */
  accessToken: string;
  /**
   * Hostname + port, defaults to the dev server.
   * Provide your production base URL from the caller.
   */
  baseUrl?: string;
}
// Dynamic imports will be used inside the server block for node-fetch and form-data

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
    return await this.httpClient.get(`/v1/datasources/project/${projectId}`);
  }

  /**
   * Get a datasource with its associated datalines
   * @param datasourceId - The ID of the datasource
   * @returns A promise that resolves to an API response containing the datasource with datalines
   */
  async getDatasourceWithDatalines(
    datasourceId: string,
  ): Promise<ApiResponse<DatasourceWithDatalines>> {
    return await this.httpClient.get(
      `/v1/datasources/${datasourceId}/with_datalines`,
    );
  }

  /**
   * Get a datasource by ID
   * @param datasourceId - The ID of the datasource to retrieve
   * @returns A promise that resolves to an API response containing the datasource
   */
  async getDatasource(datasourceId: string): Promise<ApiResponse<Datasource>> {
    return await this.httpClient.get(`/v1/datasources/${datasourceId}`);
  }

  /**
   * Create a new datasource
   * @param params - Parameters for creating the datasource
   * @returns A promise that resolves to an API response containing the created datasource
   */
  async createDatasource(
    params: CreateDatasourceParams,
  ): Promise<ApiResponse<Datasource>> {
    console.info('Creating datasource:', params);
    return await this.httpClient.post(`/v1/datasources`, params);
  }

  /**
   * Update an existing datasource
   * @param datasourceId - The ID of the datasource to update
   * @param params - Parameters for updating the datasource
   * @returns A promise that resolves to an API response containing the updated datasource
   */
  async updateDatasource(
    datasourceId: string,
    params: Partial<CreateDatasourceParams>, // Use CreateDatasourceParams for update shape too
  ): Promise<ApiResponse<Datasource>> {
    return await this.httpClient.patch(
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
    return await this.httpClient.delete(
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
    return await this.httpClient.post(`/v1/datasources/${datasourceId}/clone`, {
      new_projectId: newProjectId, // Ensure snake_case for API
    });
  }

  /**
   * Upload a CSV file to a project by creating a datasource and uploading a file in one operation
   * @param projectId - Project ID
   * @param csvFilePath - Path to the CSV file to upload
   * @param chunksize_mb - Optional chunksize for the upload (defaults to 10)
   * @param datasourceName - Optional name for the datasource (defaults to file name + timestamp)
   * @returns The created datasource, job ID, and the raw upload Response object
   */
  async uploadCsvFile(
    projectId: string,
    csvFilePath: string,
    chunksize_mb?: number,
    datasourceName?: string,
  ): Promise<{
    datasource: Datasource;
    uploadResponse: {
      datasource_id: string;
      message: string;
      redirect_to: string;
      success: boolean;
    };
    jobId?: string;
  }> {
    if (!this.httpClient.getIsServer()) {
      throw new Error(
        'Server-side file upload is not supported in browser environment',
      );
    }

    // Generate datasource name if not provided
    const now = new Date().toISOString().replace(/:/g, '-');
    const fileName = path.basename(csvFilePath);
    const actualDatasourceName = datasourceName || `${fileName} ${now}`;
    chunksize_mb = chunksize_mb || 10;

    // Assert file exists
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`File does not exist: ${csvFilePath}`);
    }

    // Infer type from file extension (assuming CSV for this specific method)
    const datasourceType = 'csv';

    // Step 1: Create the datasource
    console.info(`Creating datasource for CSV file: ${fileName}`);
    const datasourceResponse = await this.httpClient.post<Datasource>(
      `/v1/datasources`,
      {
        name: actualDatasourceName,
        projectId: projectId,
        type: datasourceType,
      },
    );

    console.info(
      `Created datasource: ${datasourceResponse.data?.name} (${datasourceResponse.data?.id})`,
    );
    if (datasourceResponse.error) {
      throw datasourceResponse.error;
    }

    const datasource = datasourceResponse.data;
    if (!datasource?.id) {
      // Added null/undefined check for datasource.id
      throw new Error(
        'Error creating datasource: Datasource ID is missing or invalid',
      );
    }

    // Step 2: Upload the file using form data
    console.info('Uploading file to datasource...');

    // Browser (e.g. React component)
    // const handleSubmit = async (e: React.FormEvent) => {
    //   e.preventDefault();
    //   const file = (e.target as HTMLFormElement).fileInput.files[0];
    //   await this._uploadCsvFile({
    //     projectId: 'd6413dc7-5f1f-4599-ae5b-e0b5b2979f98',
    //     datasourceId: '46b57288-2b96-495e-8a0d-717de10cf7ee',
    //     file,
    //     accessToken: this.get,
    //     baseUrl: import.meta.env.VITE_API_BASE,
    //   });
    // };
    const response = await uploadCsvFile({
      projectId: projectId,
      datasourceId: datasource.id,
      file: csvFilePath,
      accessToken: this.httpClient.getApiKey(),
      baseUrl: this.httpClient.getBaseUrl(),
    });

    console.info('Upload successful:', response);

    return {
      datasource,
      uploadResponse: response,
    };
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
    const url = `/v1/actions/load/${projectId}`;
    return await this.httpClient.createStream(url, {
      url: url, // Pass the constructed URL
      method: 'POST',
      params: {
        datasourceId: datasourceId,
        jobId: jobId,
      },
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
    return await this.httpClient.get(
      `/v1/datasources/${datasourceId}/ontology_mapping`,
    );
  }

  /**
   * Test a database connection
   * @param connectionString - The database connection string to test
   * @returns A promise that resolves to an API response containing the test results
   */
  async testDatabaseConnection(
    connectionString: string,
  ): Promise<ApiResponse<TestConnectionResponse>> {
    return await this.httpClient.post('/v1/database/test-connection', {
      body: { connectionString: connectionString },
    });
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
    return await this.httpClient.post('/v1/database/sample-tables', {
      body: {
        connectionString: request.connectionString,
        tableNames: request.tableNames,
        projectId: request.projectId,
        datasourceId: request.datasourceId,
        name: request.name,
      },
    });
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
    return await this.httpClient.post('/v1/database/execute-custom-sql', {
      body: {
        connectionString: request.connectionString,
        sqlQuery: request.sqlQuery,
        samplingSqlQuery: request.samplingSqlQuery,
        projectId: request.projectId,
        datasourceId: request.datasourceId,
        name: request.name,
      },
    });
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
    return await this.httpClient.post('/v1/database/validate-sql-query', {
      body: {
        connectionString: request.connectionString,
        sqlQuery: request.sqlQuery,
      },
    });
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
    return await this.httpClient.post('/v1/database/validate-sql-syntax', {
      body: {
        connectionString: request.connectionString,
        sqlQuery: request.sqlQuery,
      },
    });
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
    return await this.httpClient.post('/v1/database/extract-sql-parameters', {
      body: { sqlQuery: sqlQuery },
    });
  }
}
