/**
 * Error classes for the Infactory SDK
 */

/**
 * Base error class for all Infactory API errors
 */
export class InfactoryAPIError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public requestId?: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'InfactoryAPIError';
    // This is needed to make instanceof work correctly in TypeScript
    Object.setPrototypeOf(this, InfactoryAPIError.prototype);
  }

  /**
   * Convert error to a plain object for serialization
   */
  toJSON() {
    return {
      name: this.name,
      status: this.status,
      code: this.code,
      message: this.message,
      requestId: this.requestId,
      details: this.details,
    };
  }
}

/**
 * Error thrown when authentication fails
 */
export class AuthenticationError extends InfactoryAPIError {
  constructor(message: string, requestId?: string, details?: any) {
    super(401, 'authentication_error', message, requestId, details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Error thrown when the user doesn't have permission to perform an action
 */
export class PermissionError extends InfactoryAPIError {
  constructor(message: string, requestId?: string, details?: any) {
    super(403, 'permission_denied', message, requestId, details);
    this.name = 'PermissionError';
    Object.setPrototypeOf(this, PermissionError.prototype);
  }
}

/**
 * Error thrown when a resource is not found
 */
export class NotFoundError extends InfactoryAPIError {
  constructor(message: string, requestId?: string, details?: any) {
    super(404, 'not_found', message, requestId, details);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Error thrown when a request is invalid
 */
export class ValidationError extends InfactoryAPIError {
  constructor(message: string, requestId?: string, details?: any) {
    super(400, 'validation_error', message, requestId, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when a request conflicts with the current state
 */
export class ConflictError extends InfactoryAPIError {
  constructor(message: string, requestId?: string, details?: any) {
    super(409, 'conflict', message, requestId, details);
    this.name = 'ConflictError';
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Error thrown when the API rate limit is exceeded
 */
export class RateLimitError extends InfactoryAPIError {
  constructor(message: string, requestId?: string, details?: any) {
    super(429, 'rate_limit_exceeded', message, requestId, details);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Error thrown when there is a server error
 */
export class ServerError extends InfactoryAPIError {
  constructor(message: string, requestId?: string, details?: any) {
    super(500, 'server_error', message, requestId, details);
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

/**
 * Error thrown when the service is unavailable
 */
export class ServiceUnavailableError extends InfactoryAPIError {
  constructor(message: string, requestId?: string, details?: any) {
    super(503, 'service_unavailable', message, requestId, details);
    this.name = 'ServiceUnavailableError';
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Error thrown when a network error occurs
 */
export class NetworkError extends InfactoryAPIError {
  constructor(message: string, details?: any) {
    super(0, 'network_error', message, undefined, details);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Create an appropriate error instance based on the HTTP status code
 */
export function createErrorFromStatus(
  status: number,
  code: string = 'unknown_error',
  message: string,
  requestId?: string,
  details?: any,
): InfactoryAPIError {
  switch (status) {
    case 400:
      return new ValidationError(message, requestId, details);
    case 401:
      return new AuthenticationError(message, requestId, details);
    case 403:
      return new PermissionError(message, requestId, details);
    case 404:
      return new NotFoundError(message, requestId, details);
    case 409:
      return new ConflictError(message, requestId, details);
    case 429:
      return new RateLimitError(message, requestId, details);
    case 503:
      return new ServiceUnavailableError(message, requestId, details);
    default:
      if (status >= 500) {
        return new ServerError(message, requestId, details);
      }
      return new InfactoryAPIError(status, code, message, requestId, details);
  }
}
