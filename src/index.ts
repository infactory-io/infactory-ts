// src/index.ts
// Export the main client class and its options
export { InfactoryClient } from './client.js';
export type { InfactoryClientOptions } from './client.js';

// Export core types and errors needed by users
export * from '@/types/index.js';

// Export error classes for better error handling
export * from '@/errors/index.js';

// Export stream utilities
export {
  isReadableStream,
  isApiResponse,
  processStreamToApiResponse,
} from '@/utils/stream.js';
export type { StreamOrApiResponse } from '@/utils/stream.js';
