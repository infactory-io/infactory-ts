/**
 * Authentication manager for the Infactory SDK
 * Handles authentication state and token management
 */
import { getConfig } from '@/config/index.js';
import { AuthenticationError } from '@/errors/index.js';

/**
 * Authentication status
 */
export enum AuthStatus {
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  INVALID = 'invalid',
}

/**
 * Authentication options for the Infactory SDK
 */
export interface AuthOptions {
  /**
   * API key to use for authentication
   * This should be a secure token provided by the Infactory platform
   */
  apiKey?: string;

  /**
   * Custom auth header name if not using the default Bearer token
   * Default is 'Authorization'
   */
  authHeaderName?: string;

  /**
   * Custom auth scheme if not using the default Bearer scheme
   * Default is 'Bearer'
   */
  authScheme?: string;
}

/**
 * Authentication manager class
 * Handles authentication state and token validation
 */
export class AuthManager {
  private apiKey: string | null = null;
  private authHeaderName = 'Authorization';
  private authScheme = 'Bearer';
  private status: AuthStatus = AuthStatus.UNAUTHENTICATED;

  /**
   * Create a new authentication manager
   * @param options Authentication options
   */
  constructor(options?: AuthOptions) {
    // Try to load API key from config if not provided in options
    const config = getConfig(false, false);
    this.apiKey = options?.apiKey || config?.apiKey || null;
    this.authHeaderName = options?.authHeaderName || 'Authorization';
    this.authScheme = options?.authScheme || 'Bearer';

    this.validateAuth();
  }

  /**
   * Get the current authentication status
   * @returns Current authentication status
   */
  getStatus(): AuthStatus {
    return this.status;
  }

  /**
   * Check if the client is authenticated
   * @returns True if authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    return this.status === AuthStatus.AUTHENTICATED;
  }

  /**
   * Set the API key
   * @param apiKey API key to use for authentication
   * @throws AuthenticationError if API key is invalid
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.validateAuth();
  }

  /**
   * Get authentication headers for API requests
   * @returns Headers object with authentication headers
   * @throws AuthenticationError if not authenticated
   */
  getAuthHeaders(): Record<string, string> {
    if (!this.isAuthenticated()) {
      throw new AuthenticationError(
        'Not authenticated. Please set a valid API key.',
        undefined,
        { status: this.status },
      );
    }

    return {
      [this.authHeaderName]: `${this.authScheme} ${this.apiKey}`,
    };
  }

  /**
   * Validate the current authentication state
   * @private
   */
  private validateAuth(): void {
    if (!this.apiKey) {
      this.status = AuthStatus.UNAUTHENTICATED;
      return;
    }

    // Basic validation of API key format
    if (typeof this.apiKey !== 'string' || this.apiKey.trim() === '') {
      this.status = AuthStatus.INVALID;
      return;
    }

    this.status = AuthStatus.AUTHENTICATED;
  }
}

// Create a singleton instance of AuthManager
let authManagerInstance: AuthManager | null = null;

/**
 * Get the global AuthManager instance
 * @param options Optional authentication options
 * @returns The global AuthManager instance
 */
export function getAuthManager(options?: AuthOptions): AuthManager {
  if (!authManagerInstance) {
    authManagerInstance = new AuthManager(options);
  } else if (options) {
    // Update existing instance with new options if provided
    if (options.apiKey) {
      authManagerInstance.setApiKey(options.apiKey);
    }
  }
  return authManagerInstance;
}
