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

// Export core types needed by users
export * from './types/index.js'; // Types already exports errors.ts types via ./types/errors.js

// Export utility functions
export * from './utils/index.js';

// Export stream types and utilities for backwards compatibility
export type { StreamOrApiResponse } from './utils/stream.js';

// Export error classes directly so they can be imported at the top level
export * from './errors/index.js';
