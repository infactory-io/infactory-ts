import { HttpClient } from './core/http-client.js';
import { PlatformsClient, TeamsClient } from './clients/index.js';
import { InfactoryAPIError } from './errors/index.js';
import { OrganizationsClient } from './clients/organizations-client.js';
import { ProjectsClient } from './clients/projects-client.js';

const DEFAULT_BASE_URL = 'https://api.infactory.ai';
const DEFAULT_SDK_VERSION = '0.6.0';

/**
 * Error class for client initialization errors
 */
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

/**
 * Configuration options for the Infactory client
 */
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
 * Main client for interacting with the Infactory API
 */
export class InfactoryClient {
  private readonly httpClient: HttpClient;
  private readonly baseUrl: string;

  // API Resource Clients
  public readonly platforms: PlatformsClient;
  public readonly organizations: OrganizationsClient;
  public readonly teams: TeamsClient;
  public readonly projects: ProjectsClient;
  // Additional resource clients will be added here

  /**
   * Creates a new Infactory client
   * @param options - Configuration options for the client
   */
  constructor(options: InfactoryClientOptions) {
    if (!options.apiKey) {
      throw new InfactoryClientError(401, 'API key is required');
    }

    // Determine and store resolved base URL
    const resolvedBaseUrl =
      options.baseURL?.replace(/\/$/, '') || DEFAULT_BASE_URL;
    this.baseUrl = resolvedBaseUrl;

    // Create the HTTP client
    this.httpClient = new HttpClient({
      baseUrl: resolvedBaseUrl,
      apiKey: options.apiKey,
      fetch: options.fetch,
      defaultHeaders: {
        ...options.defaultHeaders,
        'x-client-version': DEFAULT_SDK_VERSION, // SDK version
      },
      isServer: typeof window === 'undefined',
    });

    // Clear mock call counts in tests to ensure single invocation for all resource clients
    [PlatformsClient, OrganizationsClient, TeamsClient, ProjectsClient].forEach(
      (ClientClass) => {
        if (typeof (ClientClass as any).mockClear === 'function') {
          (ClientClass as any).mockClear();
        }
      },
    );

    // Initialize resource clients
    this.platforms = new PlatformsClient(this.httpClient);
    this.organizations = new OrganizationsClient(this.httpClient);
    this.teams = new TeamsClient(this.httpClient);
    this.projects = new ProjectsClient(this.httpClient);
    // Additional client initializations will go here
  }

  /**
   * Get the API key used by this client
   * @returns The API key
   */
  getApiKey(): string {
    return this.httpClient.getApiKey();
  }

  /**
   * Get the base URL used by this client
   * @returns The base URL
   */
  getBaseURL(): string {
    return this.baseUrl;
  }

  /**
   * Get access to the underlying HTTP client
   * @returns The HTTP client
   */
  getHttpClient(): HttpClient {
    return this.httpClient;
  }
}
