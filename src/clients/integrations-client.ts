import { HttpClient } from '../core/http-client.js';
import { ApiResponse, ToolNameSpace } from '../types/common.js';

// Type definitions
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Authentication Header Definitions
// 1. None
//    Not explicitly defined in OpenAPI, but represents no authentication
//    Used when an endpoint doesn't require authentication
// 2. Basic
//    OpenAPI Type: http with scheme basic
//    Implementation: Sends username:password encoded in Base64 in the Authorization header
//    Format: Authorization: Basic base64(username:password)
// 3. Bearer
//    OpenAPI Type: http with scheme bearer
//    Implementation: Sends a token in the Authorization header
//    Format: Authorization: Bearer token
// 4. ApiKey
//    OpenAPI Type: apiKey
//    Implementation: Can be sent in header, query, or cookie
//    Format depends on location:
//        Header: X-API-Key: key (name configurable)
//        Query: ?api_key=key (parameter name configurable)
//

// These are defined in the front ends
export type AuthType = 'None' | 'Basic Auth' | 'Bearer Token' | 'API Key';

/**
 * Parameters for Fivetran webhook handling
 */
export interface FivetranWebhookParams {
  payload: Record<string, any>;
  signatureHeader: string;
}

/**
 * Parameters for chat completion request
 */
export interface ChatCompletionRequest {
  model: string;
  messages: Array<Record<string, any>>;
  tools?: Array<Record<string, any>>;
  tool_choice?: string | Record<string, any>;
  temperature?: number;
  top_p?: number;
  n?: number;
  max_tokens?: number;
  [key: string]: any;
}

// Chat Integrations

/**
 * Parameters for calling a chat tool function
 */
export interface CallToolFunctionParams {
  projectId: string;
  toolName: string;
  params: Record<string, any>;
}

// Cosmos DB Integrations

/**
 * Information about a Cosmos DB container
 */
export interface ContainerInfo {
  name: string;
  documentCount: number;
  sizeInKb: number;
  partitionKey: string;
}

/**
 * Request parameters for testing a Cosmos DB connection
 */
export interface TestCosmosConnectionRequest {
  endpoint: string;
  key: string;
  databaseName: string;
  maxContainers?: number;
}

/**
 * Response from testing a Cosmos DB connection
 */
export interface TestCosmosConnectionResponse {
  success: boolean;
  message?: string;
  containers?: ContainerInfo[];
}

/**
 * Parameters for sampling containers in Cosmos DB
 */
export interface SampleContainerRequest {
  endpoint: string;
  key: string;
  databaseName: string;
  containerNames: string[];
  projectId: string;
  datasourceId: string;
  name?: string;
}

/**
 * Pending job reference
 */
export interface I7YPendingJob {
  id: string;
  status: string;
  [key: string]: any;
}

/**
 * Response from sampling Cosmos DB containers
 */
export interface SampleContainersResponse {
  jobs: I7YPendingJob[];
}

/**
 * Request parameters for executing a Cosmos DB query
 */
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

/**
 * Response from executing a Cosmos DB query
 */
export interface ExecuteCosmosQueryResponse {
  queryId: string;
  dataId: string;
  rowCount: number;
  sqlQuery?: string;
}

/**
 * Request parameters for validating a Cosmos DB query
 */
export interface ValidateCosmosQueryRequest {
  endpoint: string;
  key: string;
  databaseName: string;
  containerName: string;
  query: string;
}

/**
 * Response from validating a Cosmos DB query
 */
export interface ValidateCosmosQueryResponse {
  valid: boolean;
  message?: string;
  rowCount?: number;
}

/**
 * Parameter for a Cosmos DB query
 */
export interface CosmosQueryParameter {
  type: string;
  field: string;
  operator: string;
  value: string;
  displayName: string;
}

/**
 * Request parameters for extracting parameters from a Cosmos DB query
 */
export interface ExtractCosmosParametersRequest {
  query: string;
}

/**
 * Response from extracting parameters from a Cosmos DB query
 */
export interface ExtractCosmosParametersResponse {
  parameters: CosmosQueryParameter[];
  parsedQuery: string;
}

/**
 * Generic extracted parameters response
 */
export interface ExtractParametersResponse {
  parameters?: { name: string; value: string }[];
  parsedQuery?: string;
}

// HTTP Integrations

/**
 * Configuration for a parameter
 */
export interface ParameterConfig {
  value: string;
  required: boolean;
}

/**
 * Group of parameters
 */
export interface ParameterGroup {
  required: boolean;
  parameters: Array<{
    key: string;
    value: string;
  }>;
}

/**
 * Configuration for HTTP request body
 */
export interface HttpBodyConfig {
  type: string; // 'raw', 'form-data', 'x-www-form-urlencoded'
  contentType?: string;
  content?: string;
  parameters?: Record<string, string>;
}

/**
 * Configuration for HTTP authentication
 */
export interface HttpAuthConfig {
  apiKey?: {
    name: string;
    value: string;
    location: string;
  };
  bearerToken?: string;
  basicAuth?: {
    username: string;
    password: string;
  };
}

/**
 * Request parameters for testing an HTTP connection
 */
export interface TestHttpConnectionRequest {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  parameters?: Record<string, ParameterConfig>;
  parameterGroups?: ParameterGroup[];
  authType?: AuthType;
  auth?: HttpAuthConfig;
  body?: HttpBodyConfig;
  responsePathExtractor?: string;
}

/**
 * Response from testing an HTTP connection
 */
export interface TestHttpConnectionResponse {
  success: boolean;
  status: number;
  responseTime: number;
  contentType: string;
  size: number;
  data: any;
  headers?: Record<string, string>;
}

/**
 * Request parameters for executing an HTTP request
 */
export interface ExecuteHttpRequestRequest extends TestHttpConnectionRequest {
  projectId: string;
  datasourceId: string;
  connectSpec?: Record<string, any>;
}

/**
 * Response from executing an HTTP request
 */
export interface ExecuteHttpRequestResponse {
  jobs: I7YPendingJob[];
}

/**
 * Client for managing integrations in the Infactory API
 */
export class IntegrationsClient {
  /**
   * Creates a new IntegrationsClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  // Fivetran Integration Methods

  /**
   * Handle Fivetran webhook notifications
   * @param params - The webhook payload and signature header
   * @returns A promise that resolves to an API response
   */
  async fivetranWebhook(
    params: FivetranWebhookParams,
  ): Promise<ApiResponse<any>> {
    return this.httpClient.post<any>(
      '/v1/integrations/fivetran/webhook',
      params.payload,
      {
        headers: { 'X-Fivetran-Signature-256': params.signatureHeader },
      },
    );
  }

  // Chat Integration Methods

  /**
   * Gets available chat models for a specific project
   * @param projectId - The ID of the project
   * @returns A promise that resolves to an API response containing available chat models
   */
  async getChatModels(projectId: string): Promise<ApiResponse<any>> {
    return this.httpClient.get<any>(
      `/v1/integrations/chat/${projectId}/models`,
    );
  }

  /**
   * Gets OpenAI chat completions compatible tools for a specific project
   * @param projectId - The ID of the project
   * @returns A promise that resolves to an API response containing tools compatible with OpenAI chat completions API
   */
  async getChatTools(projectId: string): Promise<ApiResponse<ToolNameSpace>> {
    return this.httpClient.get<ToolNameSpace>(
      `/v1/integrations/chat/${projectId}/tools.json`,
    );
  }

  /**
   * Gets Python code for Open WebUI tools integration
   * @param projectId - The ID of the project
   * @returns A promise that resolves to an API response containing Python code for tools integration
   */
  async getChatToolsCode(projectId: string): Promise<ApiResponse<string>> {
    return this.httpClient.get<string>(
      `/v1/integrations/chat/${projectId}/tools.py`,
    );
  }

  /**
   * Gets Open WebUI tools configuration for a specific project
   * @param projectId - The ID of the project
   * @returns A promise that resolves to an API response containing Open WebUI tools configuration
   */
  async getOpenWebUITools(projectId: string): Promise<ApiResponse<any[]>> {
    return this.httpClient.get<any[]>(
      `/v1/integrations/chat/${projectId}/open-webui-tools.json`,
    );
  }

  /**
   * Gets chat tool schema for a specific project
   * @param projectId - The ID of the project
   * @returns A promise that resolves to an API response containing the schema for chat tools
   */
  async getChatToolSchema(projectId: string): Promise<ApiResponse<any>> {
    return this.httpClient.get<any>(
      `/v1/integrations/chat/${projectId}/schema`,
    );
  }

  /**
   * Call a specific tool function for a chat integration
   * @param params - Parameters for calling the tool function
   * @returns A promise that resolves to an API response containing the result of the tool call
   */
  async callChatToolFunction(
    params: CallToolFunctionParams,
  ): Promise<ApiResponse<any>> {
    return this.httpClient.post<any>(
      `/v1/integrations/chat/${params.projectId}/call/${params.toolName}`,
      params.params,
    );
  }

  /**
   * Create a chat completion using project APIs as tools
   * @param projectId - The ID of the project
   * @param requestBody - The chat completion request payload
   * @returns A promise that resolves to an API response containing the chat completion
   */
  async createChatCompletion(
    projectId: string,
    requestBody: any,
  ): Promise<ApiResponse<any>> {
    return this.httpClient.post<any>(
      `/v1/integrations/chat/${projectId}/chat/completions`,
      requestBody,
    );
  }

  // Cosmos DB Integration Methods

  /**
   * Test a CosmosDB connection and return list of containers
   * @param connectionDetails - The connection details for the Cosmos DB instance
   * @returns A promise that resolves to an API response containing the test results and available containers
   */
  async testCosmosConnection(
    connectionDetails: TestCosmosConnectionRequest,
  ): Promise<ApiResponse<TestCosmosConnectionResponse>> {
    return this.httpClient.post<TestCosmosConnectionResponse>(
      '/v1/cosmos/cosmos/test-connection',
      connectionDetails,
    );
  }

  /**
   * Validate a CosmosDB query by counting the number of results it would return
   * @param params - The parameters for validating the query
   * @returns A promise that resolves to an API response containing the validation results with row count
   */
  async validateCosmosQuery(
    params: ValidateCosmosQueryRequest,
  ): Promise<ApiResponse<ValidateCosmosQueryResponse>> {
    return this.httpClient.post<ValidateCosmosQueryResponse>(
      '/v1/cosmos/cosmos/validate-query',
      params,
    );
  }

  /**
   * Extract parameters from a CosmosDB SQL query that can be shown as form fields
   * @param query - The query to extract parameters from
   * @returns A promise that resolves to an API response containing the extracted parameters and parsed query
   */
  async extractCosmosParameters(
    query: string,
  ): Promise<ApiResponse<ExtractParametersResponse>> {
    return this.httpClient.post<ExtractParametersResponse>(
      '/v1/cosmos/cosmos/extract-parameters',
      { query },
    );
  }

  /**
   * Sample multiple CosmosDB containers and upload them as data objects
   * @param params - The parameters for sampling the containers
   * @returns A promise that resolves to an API response containing the sample jobs
   */
  async sampleCosmosContainers(
    params: SampleContainerRequest,
  ): Promise<ApiResponse<SampleContainersResponse>> {
    return this.httpClient.post<SampleContainersResponse>(
      '/v1/cosmos/cosmos/sample-containers',
      params,
    );
  }

  /**
   * Execute a custom CosmosDB query and upload the result as a data object
   * @param params - The parameters for executing the query
   * @returns A promise that resolves to an API response containing query ID, data ID and row count
   */
  async executeCosmosQuery(
    params: ExecuteCosmosQueryRequest,
  ): Promise<ApiResponse<ExecuteCosmosQueryResponse>> {
    return this.httpClient.post<ExecuteCosmosQueryResponse>(
      '/v1/cosmos/cosmos/execute-query',
      params,
    );
  }

  // HTTP Integration Methods

  /**
   * Test an HTTP API connection by making a request and returning the response
   * @param requestConfig - The configuration for the HTTP request
   * @returns A promise that resolves to an API response containing the test results with status, content type, and data
   */
  async testHttpConnection(
    requestConfig: TestHttpConnectionRequest,
  ): Promise<ApiResponse<TestHttpConnectionResponse>> {
    console.log('Testing HTTP connection with config:', requestConfig);
    return this.httpClient.post<TestHttpConnectionResponse>(
      '/v1/http/test-connection',
      requestConfig,
    );
  }

  /**
   * Execute an HTTP API request using the Endpoint class from infactory.sources
   * This function uses the Endpoint.from_connect_spec to directly get a DataFrame from an API,
   * similar to how sample_containers works in Cosmos DB
   * @param requestConfig - The configuration for the HTTP request
   * @returns A promise that resolves to an API response containing the execution jobs
   */
  async executeHttpRequest(
    requestConfig: ExecuteHttpRequestRequest,
  ): Promise<ApiResponse<ExecuteHttpRequestResponse>> {
    return this.httpClient.post<ExecuteHttpRequestResponse>(
      '/v1/http/execute-request',
      requestConfig,
    );
  }
}
