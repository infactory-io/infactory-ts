import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InfactoryClient, InfactoryClientError } from '../src/client.js';
import { PlatformsClient } from '../src/clients/index.js';

// Mock the HttpClient
vi.mock('../src/core/http-client', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      getApiKey: vi.fn().mockReturnValue('test-api-key'),
      getBaseUrl: vi.fn().mockReturnValue('https://api.infactory.ai')
    }))
  };
});

// Mock PlatformsClient
vi.mock('../src/clients', () => {
  return {
    PlatformsClient: vi.fn().mockImplementation(() => ({
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }))
  };
});

describe('InfactoryClient', () => {
  describe('constructor', () => {
    it('should create a client with valid API key', () => {
      const client = new InfactoryClient({ apiKey: 'test-api-key' });
      expect(client.getApiKey()).toBe('test-api-key');
    });

    it('should throw an error if API key is not provided', () => {
      expect(() => {
        // @ts-ignore intentionally passing invalid params for test
        new InfactoryClient({ apiKey: '' });
      }).toThrow(InfactoryClientError);
    });

    it('should use custom baseURL if provided', () => {
      const customUrl = 'https://custom.infactory.ai';
      const client = new InfactoryClient({
        apiKey: 'test-api-key',
        baseURL: customUrl,
      });
      expect(client.getBaseURL()).toBe(customUrl);
    });

    it('should initialize resource clients', () => {
      const client = new InfactoryClient({ apiKey: 'test-api-key' });
      
      // Check that PlatformsClient was initialized
      expect(PlatformsClient).toHaveBeenCalledTimes(1);
      expect(client.platforms).toBeDefined();
    });
  });

  describe('getter methods', () => {
    let client: InfactoryClient;

    beforeEach(() => {
      client = new InfactoryClient({ apiKey: 'test-api-key' });
    });

    it('should return API key', () => {
      expect(client.getApiKey()).toBe('test-api-key');
    });

    it('should return base URL', () => {
      expect(client.getBaseURL()).toBe('https://api.infactory.ai');
    });

    it('should return HTTP client', () => {
      expect(client.getHttpClient()).toBeDefined();
    });
  });
});
