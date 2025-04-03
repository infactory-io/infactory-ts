// src/__tests__/client.test.ts
import { InfactoryClient, InfactoryClientError } from '../client.js';
import fetchMock from 'jest-fetch-mock';

// Mock the global fetch
global.fetch = fetchMock;

describe('InfactoryClient', () => {
  // Reset mocks before each test
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe('constructor', () => {
    it('should create a client with valid API key', () => {
      const client = new InfactoryClient({ apiKey: 'test-api-key' });
      expect(client.getApiKey()).toBe('test-api-key');
    });

    it('should throw an error if API key is not provided', () => {
      expect(() => {
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
  });

  describe('resource APIs', () => {
    it('should expose resource APIs', () => {
      const client = new InfactoryClient({ apiKey: 'test-api-key' });
      expect(client.projects).toBeDefined();
      expect(client.users).toBeDefined();
      expect(client.teams).toBeDefined();
      expect(client.organizations).toBeDefined();
      expect(client.queryprograms).toBeDefined();
      expect(client.datasources).toBeDefined();
      expect(client.datalines).toBeDefined();
      expect(client.apis).toBeDefined();
    });
  });
});
