import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  LiveClient,
  OpenAPISpec,
  ChatGPTTool,
} from '../../src/clients/live-client.js';
import { HttpClient } from '../../src/core/http-client.js';
import { createErrorFromStatus } from '../../src/errors/index.js';
import { FunctionMessageReference } from '../../src/types/common.js';

// Mock the HttpClient
vi.mock('../../src/core/http-client.js', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      createStream: vi.fn(),
    })),
  };
});

describe('LiveClient', () => {
  let liveClient: LiveClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a new mock HttpClient instance
    mockHttpClient = new HttpClient({
      baseUrl: 'https://api.infactory.ai',
      apiKey: 'test-api-key',
    });

    // Create a new LiveClient with the mock HttpClient
    liveClient = new LiveClient(mockHttpClient);
  });

  describe('getOpenAPISpec', () => {
    it('should call the correct endpoint to get OpenAPI specification', async () => {
      // Mock response data
      const mockSpec: OpenAPISpec = {
        openapi: '3.0.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
          description: 'A test API',
        },
        paths: {
          '/test': {
            get: {
              summary: 'Test endpoint',
            },
          },
        },
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockSpec,
      });

      // Call the method
      const result = await liveClient.getOpenAPISpec('test-api', 'v1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/live/test-api/v1/openapi.json',
      );

      // Verify the result
      expect(result.data).toEqual(mockSpec);
    });

    it('should throw an error if apiSlug is missing', async () => {
      await expect(liveClient.getOpenAPISpec('', 'v1')).rejects.toThrow(
        'API slug is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should throw an error if version is missing', async () => {
      await expect(liveClient.getOpenAPISpec('test-api', '')).rejects.toThrow(
        'Version is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should handle errors when getting OpenAPI spec', async () => {
      // Setup the mock to return an error
      const mockError = createErrorFromStatus(
        404,
        'not_found',
        'API not found',
      );

      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        error: mockError,
      });

      // Call the method
      const result = await liveClient.getOpenAPISpec('non-existent', 'v1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/live/non-existent/v1/openapi.json',
      );

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getTools', () => {
    it('should call the correct endpoint to get ChatGPT tools', async () => {
      // Mock response data from the endpoint
      const mockToolsResponse = {
        name: 'test-api',
        functions: [
          {
            name: '/test-api/v1/test_function',
            description: 'A test function',
            parameters: {
              type: 'object',
              properties: {
                test_param: {
                  type: 'string',
                  description: 'Test parameter',
                },
              },
            },
          },
        ],
        fn_mapping: {
          function: '/test-api/v1/test_function',
        },
      };

      // Expected processed result
      const expectedTools: ChatGPTTool[] = [
        {
          type: 'function',
          function: {
            name: '/test-api/v1/test_function',
            description: 'A test function',
            parameters: {
              type: 'object',
              properties: {
                test_param: {
                  type: 'string',
                  description: 'Test parameter',
                },
              },
            },
          },
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockToolsResponse,
      });

      // Call the method
      const result = await liveClient.getTools('test-api', 'v1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/live/test-api/v1/tools.json',
      );

      // Verify the result
      expect(result.data).toEqual(expectedTools);
    });

    it('should return empty array if data is invalid', async () => {
      // Setup the mock to return invalid data
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: null,
      });

      // Call the method
      const result = await liveClient.getTools('test-api', 'v1');

      // Verify empty array is returned
      expect(result.data).toEqual([]);
    });

    it('should throw an error if apiSlug is missing', async () => {
      await expect(liveClient.getTools('', 'v1')).rejects.toThrow(
        'API slug is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should throw an error if version is missing', async () => {
      await expect(liveClient.getTools('test-api', '')).rejects.toThrow(
        'Version is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('getApiDocs', () => {
    it('should call the correct endpoint to get API docs', async () => {
      // Mock response data
      const mockDocs = '<html>API Documentation</html>';

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockDocs,
      });

      // Call the method
      const result = await liveClient.getApiDocs('test-api', 'v1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/live/test-api/v1', {
        params: {},
      });

      // Verify the result
      expect(result.data).toEqual(mockDocs);
    });

    it('should include host parameter when provided', async () => {
      // Mock response data
      const mockDocs = '<html>API Documentation</html>';

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockDocs,
      });

      // Call the method with host parameter
      const result = await liveClient.getApiDocs(
        'test-api',
        'v1',
        'https://example.com',
      );

      // Verify the HTTP client was called correctly with host parameter
      expect(mockHttpClient.get).toHaveBeenCalledWith('/live/test-api/v1', {
        params: { host: 'https://example.com' },
      });

      // Verify the result
      expect(result.data).toEqual(mockDocs);
    });

    it('should throw an error if apiSlug is missing', async () => {
      await expect(liveClient.getApiDocs('', 'v1')).rejects.toThrow(
        'API slug is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should throw an error if version is missing', async () => {
      await expect(liveClient.getApiDocs('test-api', '')).rejects.toThrow(
        'Version is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('callCustomEndpoint', () => {
    it('should call the correct endpoint with query parameters', async () => {
      // Mock response data
      const mockResponse = { result: 'success', data: [1, 2, 3] };

      // Mock query parameters
      const queryParams = { filter: 'test', limit: 10 };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await liveClient.callCustomEndpoint(
        'test-api',
        'v1',
        'custom-endpoint',
        queryParams,
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/live/test-api/v1/custom-endpoint',
        { params: queryParams },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should throw an error if apiSlug is missing', async () => {
      await expect(
        liveClient.callCustomEndpoint('', 'v1', 'custom-endpoint'),
      ).rejects.toThrow('API slug is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should throw an error if version is missing', async () => {
      await expect(
        liveClient.callCustomEndpoint('test-api', '', 'custom-endpoint'),
      ).rejects.toThrow('Version is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should throw an error if endpointPath is missing', async () => {
      await expect(
        liveClient.callCustomEndpoint('test-api', 'v1', ''),
      ).rejects.toThrow('Endpoint path is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('callCustomEndpointFromChat', () => {
    it('should create a stream for the custom endpoint', async () => {
      // Mock message reference
      const messageReference: FunctionMessageReference = {
        conversationId: 'conv-123',
        messageId: 'msg-456',
      };

      // Mock query parameters
      const queryParams = { filter: 'test' };

      // Mock response stream
      const mockStream = new ReadableStream();

      // Setup the mock response
      vi.mocked(mockHttpClient.createStream).mockResolvedValueOnce(mockStream);

      // Call the method
      const result = await liveClient.callCustomEndpointFromChat(
        'test-api',
        'v1',
        'custom-endpoint',
        messageReference,
        queryParams,
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.createStream).toHaveBeenCalledWith(
        '/live/test-api/v1/custom-endpoint',
        {
          url: '/live/test-api/v1/custom-endpoint',
          method: 'POST',
          params: queryParams,
          jsonBody: messageReference,
        },
      );

      // Verify the result
      expect(result).toEqual(mockStream);
    });

    it('should throw an error if apiSlug is missing', async () => {
      const messageReference: FunctionMessageReference = {
        conversationId: 'conv-123',
        messageId: 'msg-456',
      };

      await expect(
        liveClient.callCustomEndpointFromChat(
          '',
          'v1',
          'custom-endpoint',
          messageReference,
        ),
      ).rejects.toThrow('API slug is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.createStream).not.toHaveBeenCalled();
    });

    it('should throw an error if version is missing', async () => {
      const messageReference: FunctionMessageReference = {
        conversationId: 'conv-123',
        messageId: 'msg-456',
      };

      await expect(
        liveClient.callCustomEndpointFromChat(
          'test-api',
          '',
          'custom-endpoint',
          messageReference,
        ),
      ).rejects.toThrow('Version is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.createStream).not.toHaveBeenCalled();
    });

    it('should throw an error if endpointPath is missing', async () => {
      const messageReference: FunctionMessageReference = {
        conversationId: 'conv-123',
        messageId: 'msg-456',
      };

      await expect(
        liveClient.callCustomEndpointFromChat(
          'test-api',
          'v1',
          '',
          messageReference,
        ),
      ).rejects.toThrow('Endpoint path is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.createStream).not.toHaveBeenCalled();
    });

    it('should throw an error if messageReference is missing', async () => {
      await expect(
        liveClient.callCustomEndpointFromChat(
          'test-api',
          'v1',
          'custom-endpoint',
          null as unknown as FunctionMessageReference,
        ),
      ).rejects.toThrow('Message reference is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.createStream).not.toHaveBeenCalled();
    });
  });
});
