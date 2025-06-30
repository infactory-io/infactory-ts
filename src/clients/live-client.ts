import { HttpClient } from '../core/http-client.js';
import { ApiResponse, FunctionMessageReference } from '../types/common.js';

/**
 * OpenAPI specification structure
 */
export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, any>;
  components?: Record<string, any>;
}

/**
 * ChatGPT tool structure for function calling API
 */
export interface ChatGPTTool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

/**
 * Client for interacting with published APIs in the Infactory Live API
 */
export class LiveClient {
  /**
   * Creates a new LiveClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Get the OpenAPI specification for a published API
   * @param apiSlug - The API slug identifier
   * @param version - The API version
   * @returns A promise that resolves to an API response containing the OpenAPI specification
   */
  async getOpenAPISpec(
    apiSlug: string,
    version: string,
  ): Promise<ApiResponse<OpenAPISpec>> {
    if (!apiSlug) {
      throw new Error('API slug is required');
    }
    if (!version) {
      throw new Error('Version is required');
    }

    return await this.httpClient.get<OpenAPISpec>(
      `/live/${apiSlug}/${version}/openapi.json`,
    );
  }

  /**
   * Get ChatGPT-compatible tools for the function calling API
   * @param apiSlug - The API slug identifier
   * @param version - The API version
   * @returns A promise that resolves to an API response containing an array of ChatGPT tools
   */
  async getTools(
    apiSlug: string,
    version: string,
  ): Promise<ApiResponse<ChatGPTTool[]>> {
    if (!apiSlug) {
      throw new Error('API slug is required');
    }
    if (!version) {
      throw new Error('Version is required');
    }

    const res = await this.httpClient.get<any>(
      `/live/${apiSlug}/${version}/tools.json`,
    );
    if (res.error) return res;

    const data = res.data;
    // Ensure data is an object with the expected keys: name, functions, and fn_mapping
    if (!data || typeof data !== 'object') {
      return { ...res, data: [] };
    }

    const tools: ChatGPTTool[] = [];
    const fnMapping = data.fn_mapping;
    const functionsList = data.functions;

    if (fnMapping && functionsList && Array.isArray(functionsList)) {
      for (const [toolName, functionName] of Object.entries(fnMapping)) {
        // Lookup the function definition that matches the function name from fn_mapping
        const fnDef = functionsList.find((fn: any) => fn.name === functionName);
        if (fnDef) {
          tools.push({
            type: toolName,
            function: {
              name: fnDef.name,
              description: fnDef.description,
              parameters: fnDef.parameters,
            },
          });
        }
      }
    }

    return { ...res, data: tools };
  }

  /**
   * Get the API documentation for a published API
   * @param apiSlug - The API slug identifier
   * @param version - The API version
   * @param host - Optional host to use for the API docs, defaults to http://localhost:8000
   * @returns A promise that resolves to an API response containing the API documentation
   */
  async getApiDocs(
    apiSlug: string,
    version: string,
    host?: string,
  ): Promise<ApiResponse<string>> {
    if (!apiSlug) {
      throw new Error('API slug is required');
    }
    if (!version) {
      throw new Error('Version is required');
    }

    const params = {} as Record<string, any>;
    if (host) {
      params['host'] = host;
    }

    return await this.httpClient.get<string>(`/live/${apiSlug}/${version}`, {
      params,
    });
  }

  /**
   * Call a custom endpoint from a published API
   * @param apiSlug - The API slug identifier
   * @param version - The API version
   * @param endpointPath - The endpoint path to call
   * @param queryParams - Optional query parameters for the request
   * @returns A promise that resolves to an API response containing the endpoint result
   */
  async callCustomEndpoint(
    apiSlug: string,
    version: string,
    endpointPath: string,
    queryParams?: Record<string, any>,
  ): Promise<ApiResponse<any>> {
    if (!apiSlug) {
      throw new Error('API slug is required');
    }
    if (!version) {
      throw new Error('Version is required');
    }
    if (!endpointPath) {
      throw new Error('Endpoint path is required');
    }

    const params = {} as Record<string, any>;
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        params[key] = value;
      });
    }

    return await this.httpClient.get<any>(
      `/live/${apiSlug}/${version}/${endpointPath}`,
      { params },
    );
  }

  /**
   * Call a custom endpoint from a published API within a conversation context
   * @param apiSlug - The API slug identifier
   * @param version - The API version
   * @param endpointPath - The endpoint path to call
   * @param messageReference - Function message reference for conversation context
   * @param queryParams - Optional query parameters for the request
   * @returns A promise that resolves to a readable stream of the endpoint result
   */
  async callCustomEndpointFromChat(
    apiSlug: string,
    version: string,
    endpointPath: string,
    messageReference: FunctionMessageReference,
    queryParams?: Record<string, any>,
  ): Promise<ReadableStream<Uint8Array>> {
    if (!apiSlug) {
      throw new Error('API slug is required');
    }
    if (!version) {
      throw new Error('Version is required');
    }
    if (!endpointPath) {
      throw new Error('Endpoint path is required');
    }
    if (!messageReference) {
      throw new Error('Message reference is required');
    }

    const params = {} as Record<string, any>;
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        params[key] = value;
      });
    }

    const url = `/live/${apiSlug}/${version}/${endpointPath}`;
    const options = {
      url,
      method: 'POST',
      params,
      jsonBody: messageReference,
    };

    return await this.httpClient.createStream(url, options);
  }
}
