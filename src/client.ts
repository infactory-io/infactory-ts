import * as Resources from '@/api/resources/index.js';
import type { InfactorySDKError } from '@/types/common.js';
import { getConfig } from './config/index.js';

export class InfactoryClientError extends Error implements InfactorySDKError {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'InfactoryClientError';
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
}

/**
 * The main client for interacting with the Infactory API.
 */
export class InfactoryClient {
  readonly #apiKey: string;
  readonly #baseURL: string;
  readonly #fetch: typeof globalThis.fetch;

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
  // Other resource groups can be added here

  /**
   * Creates a new instance of the InfactoryClient.
   * @param options - Configuration options for the client.
   * @param options.apiKey - Your Infactory API key.
   * @param options.baseURL - Optional custom base URL for the API.
   * @param options.fetch - Optional custom fetch implementation.
   */
  constructor({
    apiKey,
    baseURL,
    fetch = globalThis.fetch,
  }: InfactoryClientOptions) {
    if (!apiKey) {
      throw new InfactoryClientError(401, 'API key is required.');
    }
    this.#apiKey = apiKey;
    this.#baseURL = baseURL?.replace(/\/$/, '') ?? getConfig().base_url; // Remove trailing slash if present
    this.#fetch = fetch;

    // Global configuration for the fetch wrapper would go here
    // For example, setting up the API key in request headers

    // TODO: We need to modify the core/client.js file to accept and use
    // the API key and baseURL from this client instance

    // Note: In a more complete implementation, we would inject our configured
    // HTTP client into each API resource class instance
  }

  /**
   * Provides access to the configured API key.
   * @returns The API key.
   */
  public getApiKey(): string {
    return this.#apiKey;
  }

  /**
   * Provides access to the configured base URL.
   * @returns The base URL.
   */
  public getBaseURL(): string {
    return this.#baseURL;
  }

  /**
   * Provides access to the configured fetch implementation.
   * @returns The fetch function.
   */
  public getFetch(): typeof globalThis.fetch {
    return this.#fetch;
  }

  // Future implementation: a centralized request method
  // async request<T>(path: string, options: RequestInit = {}): Promise<T> { ... }
}
