import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlatformsClient } from '../../src/clients/platforms-client.js';
import { HttpClient } from '../../src/core/http-client.js';
import { createErrorFromStatus } from '../../src/errors/index.js';

// Mock the HttpClient
vi.mock('../../src/core/http-client', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    })),
  };
});

describe('PlatformsClient', () => {
  let platformsClient: PlatformsClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a new mock HttpClient instance
    mockHttpClient = new HttpClient({
      baseUrl: 'https://api.infactory.ai',
      apiKey: 'test-api-key',
    });

    // Create a new PlatformsClient with the mock HttpClient
    platformsClient = new PlatformsClient(mockHttpClient);
  });

  describe('list', () => {
    it('should call the correct endpoint to list platforms', async () => {
      // Mock response data
      const mockPlatforms = [
        {
          id: 'platform-1',
          name: 'Platform 1',
          description: 'Test Platform 1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'platform-2',
          name: 'Platform 2',
          description: 'Test Platform 2',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockPlatforms,
      });

      // Call the method
      const result = await platformsClient.list();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/platforms');

      // Verify the result
      expect(result.data).toEqual(mockPlatforms);
    });

    it('should handle errors when listing platforms', async () => {
      // Setup the mock to return an error
      const mockError = createErrorFromStatus(
        500,
        'server_error',
        'Internal server error',
      );

      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        error: mockError,
      });

      // Call the method
      const result = await platformsClient.list();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/platforms');

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('get', () => {
    it('should call the correct endpoint to get a platform by ID', async () => {
      // Mock response data
      const mockPlatform = {
        id: 'platform-1',
        name: 'Platform 1',
        description: 'Test Platform 1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockPlatform,
      });

      // Call the method
      const result = await platformsClient.get('platform-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/platforms/platform-1',
      );

      // Verify the result
      expect(result.data).toEqual(mockPlatform);
    });
  });

  describe('create', () => {
    it('should call the correct endpoint to create a platform', async () => {
      // Mock request data
      const createParams = {
        name: 'New Platform',
        description: 'New Test Platform',
        metadata: { key: 'value' },
      };

      // Mock response data
      const mockResponse = {
        id: 'new-platform',
        name: 'New Platform',
        description: 'New Test Platform',
        metadata: { key: 'value' },
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await platformsClient.create(createParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/platforms',
        createParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('should call the correct endpoint to update a platform', async () => {
      // Mock request data
      const updateParams = {
        name: 'Updated Platform',
        description: 'Updated Test Platform',
      };

      // Mock response data
      const mockResponse = {
        id: 'platform-1',
        name: 'Updated Platform',
        description: 'Updated Test Platform',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await platformsClient.update('platform-1', updateParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/platforms/platform-1',
        updateParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('should call the correct endpoint to delete a platform', async () => {
      // Mock response data
      const mockResponse = {
        id: 'platform-1',
        name: 'Platform 1',
        description: 'Test Platform 1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        deletedAt: '2025-01-05T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await platformsClient.delete('platform-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/v1/platforms/platform-1',
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });
});
