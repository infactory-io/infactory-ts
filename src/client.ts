import * as Resources from '@/api/resources/index.js';
import { getConfig } from './config/index.js';
import { InfactoryAPIError } from './errors/index.js';
import {
  HttpClient,
  RequestInterceptor,
  ResponseInterceptor,
  SDK_VERSION,
} from './core/http-client.js';

export class InfactoryClientError extends InfactoryAPIError {
  constructor(
    status: number,
    message: string,
    requestId?: string,
    details?: any,
  ) {
    super(status, 'client_error', message, requestId, details);
    this.name = 'InfactoryClientError';
    Object.setPrototypeOf(this, InfactoryClientError.prototype);
  }
}

// Define an interface for the client options
export interface InfactoryClientOptions {
  /** The API key for authentication. */
  apiKey: string;
  /** Optional base URL for the Infactory API. Defaults to the production URL. */
  baseURL?: string;
  /** Optional fetch implementation to use for requests. Defaults to global fetch. */
  fetch?: typeof globalThis.fetch;
  /** Default headers to include with every request */
  defaultHeaders?: Record<string, string>;
}

/**
 * The main client for interacting with the Infactory API.
 */
export class InfactoryClient {
  private readonly httpClient: HttpClient;
  private readonly requestInterceptors: RequestInterceptor[] = [];
  private readonly responseInterceptors: ResponseInterceptor[] = [];

  // API Resource Namespaces - using direct import references for now
  public readonly projects = Resources.projectsApi;
  public readonly teams = Resources.teamsApi;
  public readonly users = Resources.usersApi;
  public readonly auth = Resources.authApi;
  public readonly chat = Resources.chatApi;
  public readonly credentials = Resources.credentialsApi;
  public readonly datalines = Resources.datalinesApi;
  public readonly datasources = Resources.datasourcesApi;
  public readonly events = Resources.eventsApi;
  public readonly infrastructures = Resources.infrastructuresApi;
  public readonly organizations = Resources.organizationsApi;
  public readonly platforms = Resources.platformsApi;
  public readonly queryprograms = Resources.queryProgramsApi;
  public readonly secrets = Resources.secretsApi;
  public readonly tasks = Resources.tasksApi;
  public readonly apis = Resources.apisApi;
  public readonly jobs = Resources.jobsApi;

  /**
   * Creates a new instance of the InfactoryClient.
   * @param options - Configuration options for the client.
   * @param options.apiKey - Your Infactory API key.
   * @param options.baseURL - Optional custom base URL for the API.
   * @param options.fetch - Optional custom fetch implementation.
   * @param options.defaultHeaders - Optional default headers for all requests.
   */
  constructor({
    apiKey,
    baseURL,
    fetch = globalThis.fetch,
    defaultHeaders = {},
  }: InfactoryClientOptions) {
    if (!apiKey) {
      throw new InfactoryClientError(401, 'API key is required.');
    }

    // Initialize the HTTP client
    this.httpClient = new HttpClient({
      baseUrl: baseURL?.replace(/\/$/, '') ?? getConfig().base_url,
      apiKey,
      fetch,
      defaultHeaders: {
        ...defaultHeaders,
        'x-client-version': SDK_VERSION,
      },
      isServer: typeof window === 'undefined',
    });

    // Set up default interceptors
    this.setupDefaultInterceptors();
  }

  /**
   * Adds a request interceptor to the client.
   * Interceptors are executed in the order they are added.
   * @param interceptor - The request interceptor function.
   * @returns This client instance for chaining.
   */
  public addRequestInterceptor(
    interceptor: RequestInterceptor,
  ): InfactoryClient {
    this.requestInterceptors.push(interceptor);
    this.httpClient.addRequestInterceptor(interceptor);
    return this;
  }

  /**
   * Adds a response interceptor to the client.
   * Interceptors are executed in the order they are added.
   * @param interceptor - The response interceptor function.
   * @returns This client instance for chaining.
   */
  public addResponseInterceptor(
    interceptor: ResponseInterceptor,
  ): InfactoryClient {
    this.responseInterceptors.push(interceptor);
    this.httpClient.addResponseInterceptor(interceptor);
    return this;
  }

  /**
   * Provides access to the underlying HTTP client.
   * @returns The HTTP client instance.
   */
  public getHttpClient(): HttpClient {
    return this.httpClient;
  }

  /**
   * Provides access to the configured API key.
   * @returns The API key.
   */
  public getApiKey(): string {
    return this.httpClient.getApiKey?.() || '';
  }

  /**
   * Provides access to the configured base URL.
   * @returns The base URL.
   */
  public getBaseURL(): string {
    return this.httpClient.getBaseUrl?.() || '';
  }

  /**
   * Sets up the default interceptors for the client.
   * @private
   */
  private setupDefaultInterceptors(): void {
    // Add version header to all requests
    this.addRequestInterceptor((request) => {
      // This is redundant since we already set it in the constructor,
      // but it's here as an example of how to use interceptors
      return request;
    });

    // Log deprecated endpoints
    this.addResponseInterceptor((response, request) => {
      if (response.headers.get('x-deprecated') === 'true') {
        console.warn(`API endpoint ${request.url} is deprecated`);
      }
      return response;
    });
  }
}
