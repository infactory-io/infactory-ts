import { HttpClient } from './http-client.js';
import { getConfig } from '@/config/index.js';
import type { ApiResponse } from '@/types/common.js';

// Get the configuration
const config = getConfig(true, false);

// Create a shared HttpClient instance
export const sharedClient = new HttpClient({
  baseUrl: config?.baseUrl || '',
  apiKey: config?.apiKey,
  isServer: typeof window === 'undefined',
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
});

// Re-export the ApiResponse type for convenience
export type { ApiResponse };
