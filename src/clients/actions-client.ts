import {
  SecretsClient,
  DatasourcesClient,
  IntegrationsClient,
  TeamsClient,
  OrganizationsClient,
} from './index.js';
import { InfactoryAPIError } from '../errors/index.js';
import {
  ApiResponse,
  ConnectDatasourceParams,
  ConnectOptions,
  CreateDatasourceParams,
  Datasource,
  HttpConnectionResult,
  TestConnectionResponse,
} from '../types/common.js';
import {
  HttpMethod,
  AuthType,
  TestHttpConnectionResponse,
} from './integrations-client.js';

// Common result type for connection operations
type TestResultBase = {
  success: boolean;
  message: string;
  jobId?: string;
};

type ConnectionResult = {
  datasource: Datasource;
  testResult?:
    | TestConnectionResponse
    | TestHttpConnectionResponse
    | TestResultBase;
};

/**
 * Client for cross-client actions and operations
 * This client combines functionality from multiple other clients
 * to provide higher-level operations
 */
export class ActionsClient {
  /**
   * Creates a new ActionsClient instance
   * @param httpClient - The HTTP client to use for direct API requests
   * @param datasourcesClient - The DatasourcesClient instance
   * @param integrationsClient - The IntegrationsClient instance
   * @param secretsClient - The SecretsClient instance
   * @param teamsClient - The TeamsClient instance
   * @param organizationsClient - The OrganizationsClient instance
   * @param projectsClient - The ProjectsClient instance
   */
  constructor(
    private readonly datasourcesClient: DatasourcesClient,
    private readonly integrationsClient: IntegrationsClient,
    private readonly secretsClient: SecretsClient,
    private readonly teamsClient: TeamsClient,
    private readonly organizationsClient: OrganizationsClient,
    // private readonly projectsClient: ProjectsClient
  ) {}

  /**
   * Main connection method that routes to the appropriate specialized method based on datasource type.
   * This is the primary entry point for connecting any type of datasource.
   *
   * @param params - Parameters for connecting the datasource
   * @returns A promise resolving to an API response containing the created datasource and optional connection test results
   */
  async connect(
    params: ConnectDatasourceParams,
  ): Promise<ApiResponse<ConnectionResult>> {
    // Basic validation
    if (!params.projectId) {
      return {
        error: new InfactoryAPIError(
          400,
          'validation_error',
          'Project ID is required',
        ),
      };
    }
    if (!params.name) {
      return {
        error: new InfactoryAPIError(
          400,
          'validation_error',
          'Datasource name is required',
        ),
      };
    }
    if (!params.type) {
      return {
        error: new InfactoryAPIError(
          400,
          'validation_error',
          'Datasource type is required',
        ),
      };
    }

    // When filePath is provided for non-file type, validate it makes sense
    if (params.filePath) {
      const lowerCaseType = params.type.toLowerCase();
      if (!lowerCaseType.includes('csv') && !lowerCaseType.includes('file')) {
        console.warn(
          `Warning: filePath provided for a non-file datasource type (${params.type})`,
        );
      }
    }

    // Create the initial datasource record
    const createParams: any = {
      projectId: params.projectId,
      name: params.name,
      type: params.type,
      uri: params.uri,
      status: params.status ?? 'created',
      ...(params.config &&
        Object.keys(params.config).length > 0 && {
          dataSourceConfig: params.config,
        }),
      ...(params.credentialsId && { credentialsId: params.credentialsId }),
    };

    console.info(
      `Attempting to create datasource with params: ${JSON.stringify(createParams)}`,
    );
    const createResponse = await this.datasourcesClient.createDatasource(
      createParams as CreateDatasourceParams,
    );

    if (createResponse.error || !createResponse.data) {
      console.error(
        'Failed to create datasource record:',
        createResponse.error,
      );
      return {
        error:
          createResponse.error ||
          new InfactoryAPIError(
            500,
            'unknown_error',
            'Datasource creation failed silently',
          ),
      };
    }

    const datasource = createResponse.data;
    console.info(`Datasource record created: ${datasource.id}`);

    // Call the appropriate specialized connection method based on datasource type
    const lowerCaseType = params.type.toLowerCase();
    try {
      if (lowerCaseType === 'database' || lowerCaseType === 'postgresql') {
        return await this.connectDB(datasource, params);
      } else if (lowerCaseType === 'http' || lowerCaseType === 'api') {
        // For HTTP/API, use the new connectAPI implementation with ConnectOptions
        if (params.config?.url && params.config?.method) {
          // Convert from ConnectDatasourceParams to ConnectOptions
          const connectOptions: ConnectOptions = {
            url: params.config.url,
            method: params.config.method as HttpMethod,
            projectId: params.projectId,
            connectionName: params.name,
            teamId: params.config.teamId || '', // You may need a default or get this from elsewhere
            organizationId: params.config.organizationId || '', // You may need a default or get this from elsewhere
            headers: params.config.headers,
            parameters: params.config.parameters,
            responsePathExtractor: params.config.responsePathExtractor,
            authType: params.config.authType as AuthType,
            authConfig: params.config.auth,
          };

          // Call the new connectAPI with the right options
          const httpResult = await this.connectAPI(connectOptions);

          // Convert the result back to the expected ConnectionResult format
          return {
            data: {
              datasource,
              testResult: httpResult.testResult || {
                success: httpResult.success,
                message: httpResult.success
                  ? 'Connection successful'
                  : httpResult.errors[0]?.error || 'Connection failed',
              },
            },
          };
        } else {
          return {
            data: {
              datasource,
              testResult: {
                success: false,
                message:
                  "Cannot test API connection without 'config.url' and 'config.method'.",
              },
            },
          };
        }
      } else if (lowerCaseType === 'csv' || lowerCaseType.includes('file')) {
        return await this.connectFile(datasource, params);
      } else {
        // Default handling for other types
        return {
          data: {
            datasource,
            testResult: {
              success: true,
              message: `${params.type} datasource created. No connection test available.`,
            },
          },
        };
      }
    } catch (error) {
      console.error(
        `Error during connection operation for ${datasource.id}:`,
        error,
      );
      return {
        data: {
          datasource,
          testResult: {
            success: false,
            message: `Connection operation failed: ${error instanceof Error ? error.message : String(error)}`,
          },
        },
      };
    }
  }

  /**
   * Specialized method for connecting to file-based datasources like CSV.
   * If a filePath is provided, it will attempt to upload the file.
   *
   * @param datasource - The created datasource object
   * @param params - The original connection parameters
   * @returns A promise resolving to an API response for the file connection
   */
  private async connectFile(
    datasource: Datasource,
    params: ConnectDatasourceParams,
  ): Promise<ApiResponse<ConnectionResult>> {
    // Implementation unchanged
    // If a filePath is provided, attempt to upload the file
    if (params.filePath) {
      try {
        console.info(
          `File path detected: ${params.filePath}. Attempting to upload file.`,
        );

        // Use the DatasourcesClient to upload the CSV file
        // This will create a new datasource record, but we'll use our created one for consistency
        const uploadResult = await this.datasourcesClient.uploadCsvFile(
          params.projectId,
          params.filePath,
          datasource.name, // Use the same name as our created datasource
        );

        // Return the result with the updated datasource and upload status
        return {
          data: {
            datasource: uploadResult.datasource, // Use the datasource from the upload operation
            testResult: {
              success: true,
              message: `File uploaded successfully. Job ID: ${uploadResult.jobId}`,
              jobId: uploadResult.jobId,
            },
          },
        };
      } catch (error) {
        console.error(`Error uploading file:`, error);
        // Return the original datasource but with error information
        return {
          data: {
            datasource, // Return the original datasource
            testResult: {
              success: false,
              message: `File upload failed: ${error instanceof Error ? error.message : String(error)}`,
            },
          },
        };
      }
    }

    // If no file path is provided, just return success with instructions
    const result: ConnectionResult = {
      datasource,
      testResult: {
        success: true,
        message: `CSV datasource created. Upload file separately.`,
      },
    };

    return { data: result };
  }

  /**
   * Specialized method for connecting to database datasources.
   * This method tests the database connection using the provided URI.
   *
   * @param datasource - The created datasource object
   * @param params - The original connection parameters
   * @returns A promise resolving to an API response for the database connection
   */
  private async connectDB(
    datasource: Datasource,
    params: ConnectDatasourceParams,
  ): Promise<ApiResponse<ConnectionResult>> {
    // Implementation unchanged
    const result: ConnectionResult = {
      datasource,
    };

    let testResponse: ApiResponse<any> | null = null;

    try {
      if (params.uri) {
        console.info(
          `Attempting to test database connection for ${datasource.id}`,
        );
        testResponse = await this.datasourcesClient.testDatabaseConnection(
          params.uri,
        );

        if (testResponse.error) {
          console.warn(
            `Database connection test failed for ${datasource.id}: ${testResponse.error.message}`,
          );
          result.testResult = {
            success: false,
            message:
              testResponse.error.message || 'Database connection test failed',
          };
        } else if (testResponse.data) {
          console.info(
            `Database connection test successful for ${datasource.id}`,
          );
          // Preserve the full TestConnectionResponse object with tables info, etc.
          result.testResult = testResponse.data;
        }
      } else {
        result.testResult = {
          success: false,
          message:
            'Cannot test database connection without URI (connection string).',
        };
      }
    } catch (error) {
      console.error(
        `Error testing database connection for ${datasource.id}:`,
        error,
      );
      result.testResult = {
        success: false,
        message: `Database connection test failed: ${error instanceof Error ? error.message : String(error)}`,
      };
    }

    return { data: result };
  }

  /**
   * Establish a complete HTTP connection with the Infactory API by executing
   * all four steps in sequence:
   * 1. Test the connection
   * 2. Create a datasource
   * 3. Create credentials
   * 4. Execute the request
   *
   * @param options - Connection options
   * @returns A promise resolving to the connection result
   */
  public async connectAPI(
    options: ConnectOptions,
  ): Promise<HttpConnectionResult> {
    const {
      url,
      method,
      projectId,
      connectionName,
      headers = {},
      parameters = {},
      responsePathExtractor,
      authType = 'None' as AuthType,
      authConfig = {},
    } = options;

    let { organizationId, teamId } = options;

    // Verify required parameters
    if (!url || !method || !projectId || !connectionName) {
      return {
        success: false,
        stepsCompleted: [],
        jobIds: [],
        errors: [
          {
            step: 'validation',
            error: 'Missing required parameters',
          },
        ],
      };
    }

    const userOrgs = await this.organizationsClient.list();
    if (userOrgs.error) {
      return {
        success: false,
        stepsCompleted: [],
        jobIds: [],
        errors: [
          {
            step: 'validation',
            error: 'Failed to list organizations',
          },
        ],
      };
    }
    if (!userOrgs.data?.length) {
      return {
        success: false,
        stepsCompleted: [],
        jobIds: [],
        errors: [
          {
            step: 'validation',
            error: 'No organizations found',
          },
        ],
      };
    }
    if (organizationId) {
      // check that organizationId is in organizations
      const org = userOrgs.data?.find((org) => org.id === organizationId);
      if (!org) {
        return {
          success: false,
          stepsCompleted: [],
          jobIds: [],
          errors: [
            {
              step: 'validation',
              error: 'Organization not found',
            },
          ],
        };
      }
    } else {
      organizationId = userOrgs.data?.[0]?.id;
    }
    if (!organizationId) {
      return {
        success: false,
        stepsCompleted: [],
        jobIds: [],
        errors: [
          {
            step: 'validation',
            error: 'Organization not found',
          },
        ],
      };
    }

    const userTeams = await this.teamsClient.getTeams(organizationId);
    if (userTeams.error) {
      return {
        success: false,
        stepsCompleted: [],
        jobIds: [],
        errors: [
          {
            step: 'validation',
            error: 'Failed to list teams',
          },
        ],
      };
    }
    if (!userTeams.data?.length) {
      return {
        success: false,
        stepsCompleted: [],
        jobIds: [],
        errors: [
          {
            step: 'validation',
            error: 'No teams found',
          },
        ],
      };
    }
    if (teamId) {
      // check that teamId is in teams
      const team = userTeams.data?.find((team) => team.id === teamId);
      if (!team) {
        return {
          success: false,
          stepsCompleted: [],
          jobIds: [],
          errors: [
            {
              step: 'validation',
              error: 'Team not found',
            },
          ],
        };
      }
    } else {
      teamId = userTeams.data?.[0]?.id;
    }

    // Initialize result with default values
    const results: HttpConnectionResult = {
      success: false,
      stepsCompleted: [],
      jobIds: [],
      errors: [],
    };

    try {
      // Step 1: Test the HTTP connection
      console.info(`Step 1: Testing HTTP connection to ${url}`);

      // Prepare parameters for the test request
      const paramObjects: Record<string, any> = {};
      for (const [key, value] of Object.entries(parameters)) {
        if (
          typeof value === 'object' &&
          'value' in value &&
          'required' in value
        ) {
          paramObjects[key] = value;
        } else {
          paramObjects[key] = { value: String(value), required: true };
        }
      }

      const testParams = {
        url,
        method,
        headers,
        parameters: paramObjects,
        parameterGroups: [],
        authType: authType,
        auth: authConfig || {},
        responsePathExtractor: responsePathExtractor,
      };

      // Test the connection
      const testResponse =
        await this.integrationsClient.testHttpConnection(testParams);

      if (testResponse.error) {
        results.errors.push({
          step: 'test_connection',
          error: testResponse.error.message || 'Connection test failed',
        });
        return results;
      }

      results.testResult = testResponse.data;
      if (!results.testResult?.success) {
        results.errors.push({
          step: 'test_connection',
          error:
            results.testResult?.data?.message ||
            results.testResult?.data ||
            'Connection test failed',
        });
        return results;
      }
      results.stepsCompleted.push('test_connection');
      console.info('Connection test successful');

      // Step 2: Create a datasource
      console.info(`Step 2: Creating datasource "${connectionName}"`);

      const datasourceParams: CreateDatasourceParams = {
        name: connectionName,
        projectId: projectId,
        uri: url,
        type: 'http-requests',
      };

      const dsResponse =
        await this.datasourcesClient.createDatasource(datasourceParams);

      if (dsResponse.error || !dsResponse.data) {
        results.errors.push({
          step: 'create_datasource',
          error: dsResponse.error?.message || 'Failed to create datasource',
        });
        return results;
      }

      const datasource = dsResponse.data;
      results.stepsCompleted.push('create_datasource');
      results.datasourceId = datasource.id;
      results.datasource = datasource;
      console.info(`Datasource created with ID: ${datasource.id}`);

      // Step 3: Create credentials
      console.info(
        `Step 3: Creating credentials for datasource ${datasource.id}`,
      );

      const credConfig = {
        url,
        method,
        headers: headers || {},
        auth: authConfig || {},
      };

      const credentialsParams = {
        name: `Credentials for ${connectionName}`,
        type: 'api',
        description: `API credentials for ${url}`,
        metadata: credConfig,
        datasourceId: datasource.id,
        teamId: teamId,
        organizationId: organizationId,
        config: credConfig,
      };

      const credResponse =
        await this.secretsClient.createCredential(credentialsParams);

      if (credResponse.error) {
        results.errors.push({
          step: 'create_credentials',
          error: credResponse.error.message || 'Failed to create credentials',
        });
        return results;
      }

      results.stepsCompleted.push('create_credentials');
      results.credentials = credResponse.data;
      console.info('Credentials created successfully');

      // Step 4: Execute the HTTP request
      console.info(
        `Step 4: Executing HTTP request for datasource ${datasource.id}`,
      );

      const executeParams = {
        url,
        method,
        headers,
        parameters: paramObjects,
        parameterGroups: [],
        authType: authType,
        auth: authConfig || {},
        projectId: projectId,
        datasourceId: datasource.id,
        connectSpec: {
          name: connectionName,
          id: 'http-requests',
          config: {
            url,
            method,
            headers,
            parameters: paramObjects,
            parameterGroups: [],
            authType: authType,
            auth: authConfig || {},
            responsePathExtractor: responsePathExtractor,
          },
        },
      };

      const execResponse =
        await this.integrationsClient.executeHttpRequest(executeParams);

      if (execResponse.error) {
        results.errors.push({
          step: 'execute_request',
          error: execResponse.error.message || 'Failed to execute HTTP request',
        });
        return results;
      }
      console.info('execResponse', execResponse.data);
      results.stepsCompleted.push('execute_request');

      if (execResponse.data?.jobs) {
        results.jobs = execResponse.data.jobs;
        results.jobIds = execResponse.data.jobs.map((job: any) => job.id);
      }

      console.info(
        `HTTP request executed successfully. Job IDs: ${results.jobIds.join(', ')}`,
      );

      // All steps completed successfully
      results.success = true;
      return results;
    } catch (error) {
      const lastStep =
        results.stepsCompleted.length > 0
          ? results.stepsCompleted[results.stepsCompleted.length - 1]
          : 'initial_setup';

      results.errors.push({
        step: lastStep,
        error: error instanceof Error ? error.message : String(error),
      });

      console.error(`Error during ${lastStep} step:`, error);
      return results;
    }
  }
}
