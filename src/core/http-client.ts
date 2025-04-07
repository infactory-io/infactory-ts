/**
 * A modern HTTP client implementation with interceptors and automatic serialization/deserialization.
 * This client serves as the foundation for all API requests in the Infactory SDK.
 */

import { ApiResponse } from '@/types/common.js';
import {
  InfactoryAPIError,
  NetworkError,
  createErrorFromStatus,
} from '@/errors/index.js';

// Define SDK version for request headers
export const SDK_VERSION = '0.5.3';

// Default API base path for client-side requests
const API_BASE_URL = '/api/infactory';

/**
 * Represents a request interceptor function.
 * @template T - The type of the request data.
 */
export type RequestInterceptor = (
  request: HttpRequest,
) => HttpRequest | Promise<HttpRequest>;

/**
 * Represents a response interceptor function.
 */
export type ResponseInterceptor = (
  response: Response,
  request: HttpRequest,
) => Response | Promise<Response>;

/**
 * Configuration options for the HTTP client.
 */
export interface HttpClientOptions {
  /** Base URL for API requests */
  baseUrl: string;
  /** API key for authentication */
  apiKey?: string;
  /** Custom fetch implementation */
  fetch?: typeof globalThis.fetch;
  /** Default request headers */
  defaultHeaders?: Record<string, string>;
  /** Whether this client is running on the server side */
  isServer?: boolean;
}

/**
 * Represents an HTTP request object.
 */
export interface HttpRequest extends RequestInit {
  /** The URL for the request */
  url: string;
  /** Query parameters to append to the URL */
  params?: Record<string, any>;
  /** The JSON body of the request (will be serialized) */
  jsonBody?: any;
}

/**
 * A modern HTTP client with interceptors and automatic serialization/deserialization.
 */
export class HttpClient {
  private baseUrl: string;
  private apiKey?: string;
  private fetchImpl: typeof globalThis.fetch;
  private defaultHeaders: Record<string, string>;
  private isServer: boolean;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  /**
   * Gets the configured API key.
   * @returns The API key or empty string if not set.
   */
  public getApiKey(): string {
    return this.apiKey || '';
  }

  /**
   * Gets the configured base URL.
   * @returns The base URL.
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Creates a new HTTP client instance.
   * @param options - Configuration options for the client.
   */
  constructor(options: HttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetch || globalThis.fetch;
    this.defaultHeaders = options.defaultHeaders || {};
    this.isServer = options.isServer ?? typeof window === 'undefined';

    // Add default SDK version header
    this.defaultHeaders['x-infactory-sdk-version'] = SDK_VERSION;
  }

  /**
   * Adds a request interceptor to the chain.
   * @param interceptor - The request interceptor function.
   * @returns This HTTP client instance for chaining.
   */
  public addRequestInterceptor(interceptor: RequestInterceptor): HttpClient {
    this.requestInterceptors.push(interceptor);
    return this;
  }

  /**
   * Adds a response interceptor to the chain.
   * @param interceptor - The response interceptor function.
   * @returns This HTTP client instance for chaining.
   */
  public addResponseInterceptor(interceptor: ResponseInterceptor): HttpClient {
    this.responseInterceptors.push(interceptor);
    return this;
  }

  /**
   * Executes an HTTP request with the configured settings and interceptors.
   * @param request - The HTTP request configuration.
   * @returns A promise resolving to the response with data of type T.
   */
  public async request<T>(request: HttpRequest): Promise<ApiResponse<T>> {
    try {
      // Apply all request interceptors in sequence
      let processedRequest = { ...request };
      for (const interceptor of this.requestInterceptors) {
        processedRequest = await interceptor(processedRequest);
      }

      // Prepare the request URL and options
      const { url, options } = this.prepareRequest(processedRequest);

      // Execute the fetch request
      let response = await this.fetchImpl(url, options);

      // Apply all response interceptors in sequence
      for (const interceptor of this.responseInterceptors) {
        response = await interceptor(response, processedRequest);
      }

      // Handle the response
      return this.processResponse<T>(response);
    } catch (error) {
      return this.handleRequestError<T>(error);
    }
  }

  /**
   * Executes an HTTP GET request.
   * @param endpoint - The API endpoint path.
   * @param params - Optional query parameters.
   * @param options - Optional fetch options.
   * @returns A promise resolving to the response with data of type T.
   */
  public async get<T>(
    endpoint: string,
    params: Record<string, any> = {},
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url: endpoint,
      method: 'GET',
      params,
      ...options,
    });
  }

  /**
   * Executes an HTTP POST request.
   * @param endpoint - The API endpoint path.
   * @param body - Optional request body (will be JSON serialized).
   * @param params - Optional query parameters.
   * @param options - Optional fetch options.
   * @returns A promise resolving to the response with data of type T.
   */
  public async post<T, U = any>(
    endpoint: string,
    body?: U,
    params: Record<string, any> = {},
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url: endpoint,
      method: 'POST',
      params,
      jsonBody: body,
      ...options,
    });
  }

  /**
   * Executes an HTTP PUT request.
   * @param endpoint - The API endpoint path.
   * @param body - Optional request body (will be JSON serialized).
   * @param params - Optional query parameters.
   * @param options - Optional fetch options.
   * @returns A promise resolving to the response with data of type T.
   */
  public async put<T, U = any>(
    endpoint: string,
    body?: U,
    params: Record<string, any> = {},
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url: endpoint,
      method: 'PUT',
      params,
      jsonBody: body,
      ...options,
    });
  }

  /**
   * Executes an HTTP PATCH request.
   * @param endpoint - The API endpoint path.
   * @param body - Optional request body (will be JSON serialized).
   * @param params - Optional query parameters.
   * @param options - Optional fetch options.
   * @returns A promise resolving to the response with data of type T.
   */
  public async patch<T, U = any>(
    endpoint: string,
    body?: U,
    params: Record<string, any> = {},
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url: endpoint,
      method: 'PATCH',
      params,
      jsonBody: body,
      ...options,
    });
  }

  /**
   * Executes an HTTP DELETE request.
   * @param endpoint - The API endpoint path.
   * @param params - Optional query parameters.
   * @param options - Optional fetch options.
   * @returns A promise resolving to the response with data of type T.
   */
  public async delete<T>(
    endpoint: string,
    params: Record<string, any> = {},
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      url: endpoint,
      method: 'DELETE',
      params,
      ...options,
    });
  }

  /**
   * Uploads a file to the API endpoint.
   * @param endpoint - The API endpoint path.
   * @param file - The file to upload.
   * @param formFields - Additional form fields to include.
   * @param params - Optional query parameters.
   * @param options - Optional fetch options.
   * @returns A promise resolving to the response with data of type T.
   */
  public async uploadFile<T>(
    endpoint: string,
    file: File,
    formFields: Record<string, any> = {},
    params: Record<string, any> = {},
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    // Add additional form fields
    Object.entries(formFields).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    return this.request<T>({
      url: endpoint,
      method: 'POST',
      params,
      body: formData,
      ...options,
    });
  }

  /**
   * Downloads a file from the API endpoint.
   * @param endpoint - The API endpoint path.
   * @param params - Optional query parameters.
   * @param defaultFilename - The default filename to use if not specified in headers.
   * @returns A promise resolving to the response with download info of type T.
   */
  public async downloadFile<T>(
    endpoint: string,
    params: Record<string, any> = {},
    defaultFilename: string = 'download.file',
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const { url, options: requestOptions } = this.prepareRequest({
        url: endpoint,
        method: 'GET',
        params,
        ...options,
      });

      if (this.isServer) {
        // Server-side fallback, return data only
        return this.request<T>({
          url: endpoint,
          method: 'GET',
          params,
          ...options,
        });
      }

      // Client-side: fetch the file and trigger download
      const response = await this.fetchImpl(url, requestOptions);

      if (!response.ok) {
        throw new Error(
          `Download failed: ${response.status} ${response.statusText}`,
        );
      }

      // Get filename from headers or use default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = defaultFilename;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // Convert the response to a blob and download it
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;

      // Append to the document, click it, and clean up
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);

      return { data: { success: true, filename } as unknown as T };
    } catch (error) {
      return this.handleRequestError<T>(error);
    }
  }

  /**
   * Creates a streaming request to the API endpoint.
   * @param endpoint - The API endpoint path.
   * @param options - The fetch options for the request.
   * @param signal - Optional abort signal for cancellation.
   * @returns A promise resolving to a readable stream.
   */
  public async createStream(
    endpoint: string,
    options: HttpRequest,
    signal?: AbortSignal,
  ): Promise<ReadableStream> {
    let processedRequest = { ...options, url: endpoint };

    // Apply all request interceptors in sequence
    for (const interceptor of this.requestInterceptors) {
      processedRequest = await interceptor(processedRequest);
    }

    // Prepare the request URL and options
    const { url, options: requestOptions } =
      this.prepareRequest(processedRequest);

    // Add the abort signal if provided
    if (signal) {
      requestOptions.signal = signal;
    }

    // Execute the fetch request
    const response = await this.fetchImpl(url, requestOptions);

    // Check for errors
    if (!response.ok) {
      let errorData: any = {};
      let errorMessage = '';

      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorBody = await response.json();
          errorData = errorBody;
          errorMessage =
            errorBody.message ||
            errorBody.detail ||
            `API request failed with status: ${response.status}`;
        } else {
          const errorBody = await response.text();
          errorMessage = `API ${requestOptions.method} request failed ${response.status}: ${errorBody}`;
        }
      } catch (e) {
        errorMessage = `API request failed with status: ${response.status}`;
      }

      // Get request ID from headers if available
      const requestId = response.headers.get('x-request-id') || undefined;

      // Create appropriate error based on status code
      const error = createErrorFromStatus(
        response.status,
        errorData.code || 'api_error',
        errorMessage,
        requestId,
        errorData.details || errorData,
      );

      throw error;
    }

    // Verify that the response has a body stream
    const stream = response.body;
    if (!stream) {
      throw new Error('Response does not contain a readable stream');
    }

    return stream;
  }

  /**
   * Prepares the request URL and options.
   * @param request - The HTTP request configuration.
   * @returns The prepared URL and fetch options.
   */
  private prepareRequest(request: HttpRequest): {
    url: string;
    options: RequestInit;
  } {
    const { url: endpoint, params, jsonBody, ...options } = request;
    options.method = (options.method || 'GET').toUpperCase();

    // Initialize headers with defaults
    const headers = new Headers(this.defaultHeaders);

    // Add any headers from the request options
    if (options.headers) {
      const requestHeaders = options.headers as Record<string, string>;
      Object.entries(requestHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    // Set content type for JSON requests
    if (jsonBody !== undefined) {
      headers.set('Content-Type', 'application/json');
      options.body = JSON.stringify(jsonBody);
    }

    // Add cookies header if available in browser
    if (!this.isServer && typeof document !== 'undefined' && document.cookie) {
      headers.set('Cookie', document.cookie);
    }

    // Add authorization header if API key is available
    if (this.apiKey) {
      headers.set('Authorization', `Bearer ${this.apiKey}`);
    }

    // Build the full URL with query parameters
    const fullUrl = this.buildUrl(endpoint, params);

    return {
      url: fullUrl,
      options: {
        ...options,
        headers,
        credentials: 'include',
      },
    };
  }

  /**
   * Processes an HTTP response.
   * @param response - The fetch response object.
   * @returns A promise resolving to the processed API response.
   */
  private async processResponse<T>(
    response: Response,
  ): Promise<ApiResponse<T>> {
    if (!response.ok) {
      // Attempt to parse error response as JSON
      let errorData: any = {};
      let errorMessage = '';

      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorBody = await response.json();
          errorData = errorBody;
          errorMessage =
            errorBody.message ||
            errorBody.detail ||
            `API request failed with status: ${response.status}`;
        } else {
          const errorBody = await response.text();
          errorMessage = `API request failed with status ${response.status}: ${errorBody}`;
        }
      } catch (e) {
        errorMessage = `API request failed with status: ${response.status}`;
      }

      // Get request ID from headers if available
      const requestId = response.headers.get('x-request-id') || undefined;

      // Create appropriate error based on status code
      const error = createErrorFromStatus(
        response.status,
        errorData.code || 'api_error',
        errorMessage,
        requestId,
        errorData.details || errorData,
      );

      // For client-facing errors (4xx), return in the response
      // For server errors (5xx), throw the error
      if (response.status < 500) {
        return { error };
      }

      throw error;
    }

    // Parse the successful response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      return { data: data as T };
    } else {
      // Return raw data for non-JSON responses
      const text = await response.text();
      return { data: text as unknown as T };
    }
  }

  /**
   * Handles errors that occur during the request.
   * @param error - The error that occurred.
   * @returns An API response containing the error.
   */
  private handleRequestError<T>(error: unknown): ApiResponse<T> {
    // Handle network errors and other unexpected exceptions
    if (error instanceof InfactoryAPIError) {
      // Re-throw if it's already our error type
      throw error;
    }

    console.error('Unexpected error in API request:', error);
    const message =
      error instanceof Error
        ? error.message
        : 'Unknown error occurred during API request';

    const networkError = new NetworkError(message);
    return { error: networkError };
  }

  /**
   * Builds a URL with query parameters.
   * @param endpoint - The API endpoint path.
   * @param params - The query parameters to append.
   * @returns The complete URL string.
   */
  private buildUrl(endpoint: string, params?: Record<string, any>): string {
    // Begin with the appropriate base URL
    const apiUrl = this.isServer ? this.baseUrl : API_BASE_URL;

    // Clean the endpoint to ensure it doesn't start with a slash if it's already in the base URL
    const cleanEndpoint =
      endpoint.startsWith('/') && apiUrl.endsWith('/')
        ? endpoint.substring(1)
        : endpoint;

    let fullUrl = `${apiUrl}${cleanEndpoint}`;

    // Add query parameters if provided
    if (params && Object.keys(params).length > 0) {
      const url = new URL(
        fullUrl,
        this.isServer ? undefined : window.location.origin,
      );

      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });

      fullUrl = url.toString();
    }

    return fullUrl;
  }
}
