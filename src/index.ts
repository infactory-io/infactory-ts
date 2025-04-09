/**
 * Infactory TypeScript SDK
 *
 * This SDK provides access to the Infactory platform API.
 * It includes client functionality, authentication, utilities, and type definitions.
 */

// Export the main client class and its options
export { InfactoryClient } from './client.js';
export type { InfactoryClientOptions } from './client.js';

// Export authentication manager
export { AuthManager } from './auth/auth-manager.js';

// Export core types and errors needed by users
export * from './types/index.js';

// Export all API resources for direct access
export * from './api/resources/index.js';

// Export utility functions
export * from './utils/index.js';

// Export stream types and utilities for backwards compatibility
export type { StreamOrApiResponse } from './utils/stream.js';
