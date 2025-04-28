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
import { SubmitJobParams } from '../api/jobs.js';
import * as path from 'path';
import * as fs from 'fs';
import { InfactoryAPIError } from '@/errors/index.js'; // Import error type

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
   * @param datasourceName - Optional name for the datasource (defaults to file name + timestamp)
   * @param customSubmitJob - Optional function to submit the job (if you need custom job handling)
   * @returns The created datasource, job ID, and the raw upload Response object
   */
  async uploadCsvFile(
    projectId: string,
    csvFilePath: string,
    datasourceName?: string,
    customSubmitJob?: (client: any, params: SubmitJobParams) => Promise<string>, // Return type updated to string
  ): Promise<{
    datasource: Datasource;
    jobId: string;
    uploadResponse: Response; // Return the raw Response object
  }> {
    // Generate datasource name if not provided
    const now = new Date().toISOString().replace(/:/g, '-');
    const fileName = path.basename(csvFilePath);
    const actualDatasourceName = datasourceName || `${fileName} ${now}`;

    // Infer type from file extension (assuming CSV for this specific method)
    const datasourceType = 'csv';

    // Step 1: Create the datasource
    console.log(`Creating datasource for CSV file: ${fileName}`);
    const datasourceResponse = await this.httpClient.post<Datasource>(
      `/v1/datasources`,
      {
        name: actualDatasourceName,
        projectId: projectId,
        type: datasourceType,
      },
    );

    console.log(
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

    // Step 2: Submit the job
    const fileSize = fs.statSync(csvFilePath).size;
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

    let jobId: string;
    console.log('Submitting job for file upload...');
    if (customSubmitJob) {
      jobId = await customSubmitJob(null, {
        projectId: projectId,
        jobType: 'upload',
        payload: jobPayload,
        doNotSendToQueue: true, // Keep this consistent
        sourceId: datasource.id,
        source: 'datasource',
        sourceEventType: 'file_upload',
        sourceMetadata: JSON.stringify(jobMetadata),
      });
    } else {
      const jobResponse = await this.httpClient.post<string>(
        '/v1/jobs/submit',
        {
          projectId: projectId,
          jobType: 'upload',
          payload: jobPayload,
          doNotSendToQueue: true, // Keep this consistent
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
    console.log(`Job submitted successfully: ${jobId}`);

    // Step 3: Upload the file
    if (this.httpClient.getIsServer()) {
      // --- Server-side implementation using direct node-fetch ---
      console.log('Executing server-side file upload using node-fetch...');

      // Dynamic imports for Node.js environment
      const fetch = (await import('node-fetch')).default;
      const FormData = (await import('form-data')).default;

      // Read the file as a buffer
      let fileBuffer: Buffer;
      try {
        fileBuffer = fs.readFileSync(csvFilePath);
        console.log(`Read file buffer of size: ${fileBuffer.length} bytes`);
      } catch (readError) {
        console.error(`Error reading file ${csvFilePath}:`, readError);
        throw new Error(`Failed to read file: ${csvFilePath}`);
      }

      // Prepare FormData
      const formData = new FormData();
      formData.append('file', fileBuffer, {
        filename: path.basename(csvFilePath),
        contentType: 'text/csv', // Explicitly set content type
      });
      // *** ADDED file_type FIELD ***
      formData.append('file_type', 'csv');
      // Include datasource_id and job_id in the form data as before
      formData.append('datasource_id', datasource.id);
      formData.append('job_id', jobId);

      // Prepare fetch call
      const baseUrl = this.httpClient.getBaseUrl();
      const apiKey = this.httpClient.getApiKey();
      const url = `${baseUrl}/v1/actions/load/${projectId}`;
      const formHeaders = formData.getHeaders(); // Get headers from form-data library

      console.log(`Uploading to URL: ${url}`);
      console.log(
        'Headers (excluding Auth):',
        JSON.stringify(formHeaders, null, 2),
      );

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            ...formHeaders, // Use headers generated by form-data
            Authorization: `Bearer ${apiKey}`, // Add Authorization header
          },
          body: formData, // Pass FormData instance directly
        });

        console.log(
          `Upload fetch completed with status: ${response.status} ${response.statusText}`,
        );

        // Check for HTTP errors - return the raw Response object regardless
        // The caller (E2E test) can then check response.ok or status
        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Upload failed response body: ${errorBody}`);
          throw new InfactoryAPIError(
            response.status,
            'upload_failed',
            `File upload failed with status ${response.status}: ${errorBody.substring(0, 500)}`,
            response.headers.get('x-request-id') || undefined,
          );
        }

        // Return the raw Response object
        return {
          datasource,
          jobId,
          uploadResponse: response as unknown as Response,
        };
      } catch (error) {
        console.error('Error during direct fetch upload:', error);
        if (error instanceof Error) {
          throw new InfactoryAPIError(
            0,
            'network_error',
            `Network error during file upload: ${error.message}`,
            undefined,
            error,
          );
        }
        throw error; // Re-throw if it's not an Error instance
      }
    } else {
      // --- Browser-side implementation (remains potentially unchanged or uses HttpClient) ---
      console.log('Executing browser-side file upload...');
      // Assuming browser environment has File API
      // You might need a way to get a File object from csvFilePath in a browser test,
      // or adapt this part based on how browser tests handle files.
      // For simplicity, we'll throw here if not running in a proper browser env.
      if (typeof File === 'undefined') {
        throw new Error(
          'Browser-side upload requires File API, which is not available in this environment.',
        );
      }

      // This part might need adaptation depending on how you get the File object
      const fileContent = fs.readFileSync(csvFilePath); // Read content
      const file = new File([fileContent], path.basename(csvFilePath), {
        type: 'text/csv',
      });

      // Use HttpClient's uploadFile or request method, ensuring file_type is included
      const formData = new FormData(); // Browser native FormData
      formData.append('file', file);
      formData.append('file_type', 'csv'); // Ensure file_type is added
      formData.append('datasource_id', datasource.id);
      formData.append('job_id', jobId);

      // Use httpClient.request as it handles FormData better across environments potentially
      const uploadResponse = await this.httpClient.request({
        url: `/v1/actions/load/${projectId}`,
        method: 'POST',
        // No 'params' needed if they are in FormData
        body: formData, // Pass browser FormData
        // HttpClient should handle Content-Type for FormData automatically in browser
      });

      if (uploadResponse.error) {
        throw uploadResponse.error;
      }

      // Adapt return type if necessary, httpClient.request returns ApiResponse
      // We need the raw Response object to match the server-side branch
      // This part might require adjusting HttpClient or this return logic
      console.warn(
        'Browser upload path needs verification for returning raw Response object.',
      );
      // Placeholder: Returning a mock Response or adjusting the return type might be needed
      const mockBrowserResponse = new Response(
        JSON.stringify(uploadResponse.data),
        { status: 200 },
      );

      return {
        datasource,
        jobId,
        // This needs careful handling based on what HttpClient.request actually returns
        uploadResponse: mockBrowserResponse, // Placeholder
      };
    }
  }
  /**
   * Upload a file to a datasource (Original version using httpClient.createStream)
   * @param projectId - Project ID
   * @param datasourceId - Datasource ID (optional if creating a new datasource)
   * @param formData - Form data containing the file to upload
   * @param jobId - Job ID for tracking the upload
   * @returns A promise that resolves to a readable stream of upload events
   */
  async uploadDatasource(
    projectId: string,
    datasourceId: string | undefined,
    formData: FormData, // Browser FormData or form-data package instance
    jobId: string,
  ): Promise<ReadableStream> {
    // Original returned a stream
    // Note: This endpoint might differ slightly from /v1/actions/load/
    // Check API spec if this specific path is still needed or if /load covers it.
    // Assuming the intent was similar to the /load endpoint but perhaps for different source types or workflows.
    const url = `/v1/datasources/${datasourceId}/upload?project_id=${projectId}&job_id=${jobId}`; // Example URL, adjust as needed

    return await this.httpClient.createStream(url, {
      url: url, // Pass the constructed URL
      method: 'POST',
      // No 'params' here if they are in the URL
      body: formData as unknown as BodyInit, // Cast FormData
      headers: {
        // HttpClient might handle multipart headers automatically,
        // but explicitly setting Accept for SSE was common.
        Accept: 'text/event-stream',
        // Content-Type header for multipart/form-data is usually set automatically by fetch when body is FormData
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
      body: { connection_string: connectionString },
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
        connection_string: request.connectionString,
        sql_query: request.sqlQuery,
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
        connection_string: request.connectionString,
        sql_query: request.sqlQuery,
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
      body: { sql_query: sqlQuery },
    });
  }
}
