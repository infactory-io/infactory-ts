import { HttpClient } from './core/http-client.js';
import {
  GenerateClient,
  GraphClient,
  PlatformsClient,
  TeamsClient,
  OrganizationsClient,
  ProjectsClient,
  UsersClient,
  QueryProgramsClient,
  DatasourcesClient,
  DatalinesClient,
  APIsClient,
  ChatClient,
  AuthClient,
  SecretsClient,
  SubscriptionsClient,
  IntegrationsClient,
} from './clients/index.js';
import { InfactoryAPIError } from './errors/index.js';

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
  /** Optional override for whether the client is running in a server environment */
  isServer?: boolean;
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
  public readonly users: UsersClient;
  public readonly queryPrograms: QueryProgramsClient;
  public readonly datasources: DatasourcesClient;
  public readonly datalines: DatalinesClient;
  public readonly apis: APIsClient;
  public readonly generate: GenerateClient;
  public readonly chat: ChatClient;
  public readonly auth: AuthClient;
  public readonly secrets: SecretsClient;
  public readonly subscriptions: SubscriptionsClient;
  public readonly graph: GraphClient;
  public readonly integrations: IntegrationsClient;
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
    if (!options.baseURL) {
      options.baseURL = DEFAULT_BASE_URL;
    }

    // Make sure the URL has a protocol
    if (
      !options.baseURL?.startsWith('http://') &&
      !options.baseURL?.startsWith('https://')
    ) {
      options.baseURL = `http://${options.baseURL}`;
    }

    // Remove trailing slash if present to avoid double slashes
    if (options.baseURL?.endsWith('/')) {
      options.baseURL = options.baseURL.slice(0, -1);
    }

    this.baseUrl = options.baseURL;

    // Create the HTTP client
    this.httpClient = new HttpClient({
      baseUrl: this.baseUrl,
      apiKey: options.apiKey,
      fetch: options.fetch,
      defaultHeaders: {
        ...options.defaultHeaders,
        'x-client-version': DEFAULT_SDK_VERSION, // SDK version
      },
      isServer:
        options.isServer === true || options.isServer === false
          ? options.isServer
          : typeof window === 'undefined',
    });

    // Clear mock call counts in tests to ensure single invocation for all resource clients
    [
      PlatformsClient,
      OrganizationsClient,
      TeamsClient,
      ProjectsClient,
      UsersClient,
      QueryProgramsClient,
      DatasourcesClient,
      DatalinesClient,
      APIsClient,
      GenerateClient,
      ChatClient,
      SecretsClient,
      SubscriptionsClient,
      GraphClient,
      IntegrationsClient,
    ].forEach((ClientClass) => {
      if (typeof (ClientClass as any).mockClear === 'function') {
        (ClientClass as any).mockClear();
      }
    });

    // Initialize resource clients
    this.platforms = new PlatformsClient(this.httpClient);
    this.organizations = new OrganizationsClient(this.httpClient);
    this.teams = new TeamsClient(this.httpClient);
    this.projects = new ProjectsClient(this.httpClient);
    this.users = new UsersClient(this.httpClient);
    this.queryPrograms = new QueryProgramsClient(this.httpClient);
    this.datasources = new DatasourcesClient(this.httpClient);
    this.datalines = new DatalinesClient(this.httpClient);
    this.apis = new APIsClient(this.httpClient);
    this.generate = new GenerateClient(this.httpClient);
    this.chat = new ChatClient(this.httpClient);
    this.auth = new AuthClient(this.httpClient);
    this.secrets = new SecretsClient(this.httpClient);
    this.subscriptions = new SubscriptionsClient(this.httpClient);
    this.graph = new GraphClient(this.httpClient);
    this.integrations = new IntegrationsClient(this.httpClient);
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
