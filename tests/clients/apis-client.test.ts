import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIsClient } from '../../src/clients/apis-client.js';
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

describe('APIsClient', () => {
  let apisClient: APIsClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a new mock HttpClient instance
    mockHttpClient = new HttpClient({
      baseUrl: 'https://api.infactory.ai',
      apiKey: 'test-api-key',
    });

    // Create a new APIsClient with the mock HttpClient
    apisClient = new APIsClient(mockHttpClient);
  });

  describe('getProjectApis', () => {
    it('should call the correct endpoint to get APIs for a project', async () => {
      // Mock response data
      const mockApis = [
        {
          id: 'api-1',
          name: 'API 1',
          projectId: 'project-1',
          basePath: '/api1',
          version: 'v1',
          status: 'published',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'api-2',
          name: 'API 2',
          projectId: 'project-1',
          basePath: '/api2',
          version: 'v1',
          status: 'draft',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockApis,
      });

      // Call the method
      const result = await apisClient.getProjectApis('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/apis/project/project-1',
      );

      // Verify the result
      expect(result.data).toEqual(mockApis);
    });

    it('should handle errors when getting project APIs', async () => {
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
      const result = await apisClient.getProjectApis('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/apis/project/project-1',
      );

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getProjectPublishedPrograms', () => {
    it('should call the correct endpoint to get published programs for a project', async () => {
      // Mock response data
      const mockPrograms = [
        {
          id: 'qp-1',
          name: 'Query Program 1',
          projectId: 'project-1',
          published: true,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'qp-2',
          name: 'Query Program 2',
          projectId: 'project-1',
          published: true,
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockPrograms,
      });

      // Call the method
      const result = await apisClient.getProjectPublishedPrograms('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/apis/project/project-1/published-programs',
      );

      // Verify the result
      expect(result.data).toEqual(mockPrograms);
    });

    it('should throw an error if project ID is not provided', async () => {
      // Call the method with no projectId and expect it to throw
      await expect(apisClient.getProjectPublishedPrograms('')).rejects.toThrow(
        'Project ID is required',
      );
    });
  });

  describe('getApi', () => {
    it('should call the correct endpoint to get an API by ID', async () => {
      // Mock response data
      const mockApi = {
        id: 'api-1',
        name: 'API 1',
        projectId: 'project-1',
        basePath: '/api1',
        version: 'v1',
        status: 'published',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockApi,
      });

      // Call the method
      const result = await apisClient.getApi('api-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/apis/api-1');

      // Verify the result
      expect(result.data).toEqual(mockApi);
    });
  });

  describe('createApi', () => {
    it('should call the correct endpoint to create an API', async () => {
      // Mock request data
      const createParams = {
        slug: 'new-api',
        projectId: 'project-1',
        version: 'v1',
        description: 'A new API',
      };

      // Mock response data
      const mockResponse = {
        id: 'new-api',
        slug: 'new-api',
        projectId: 'project-1',
        version: 'v1',
        description: 'A new API',
        status: 'draft',
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await apisClient.createApi(createParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/apis', {
        body: {
          slug: createParams.slug,
          projectId: createParams.projectId,
          version: createParams.version,
          description: createParams.description,
        },
      });

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('updateApi', () => {
    it('should call the correct endpoint to update an API', async () => {
      // Mock request data
      const updateParams = {
        description: 'Updated description',
      };

      // Mock response data
      const mockResponse = {
        id: 'api-1',
        name: 'API 1',
        projectId: 'project-1',
        basePath: '/api1',
        version: 'v1',
        description: 'Updated description',
        status: 'published',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await apisClient.updateApi('api-1', updateParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith('/v1/apis/api-1', {
        body: updateParams,
      });

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('deleteApi', () => {
    it('should call the correct endpoint to delete an API', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method
      const result = await apisClient.deleteApi('api-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/v1/apis/api-1', {
        params: { hardDelete: true },
      });

      // Verify the result has no error
      expect(result.error).toBeUndefined();
    });

    it('should support soft deletion when specified', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method with hardDelete=false
      const result = await apisClient.deleteApi('api-1', false);

      // Verify the HTTP client was called correctly with hardDelete=false
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/v1/apis/api-1', {
        params: { hardDelete: false },
      });

      // Verify the result has no error
      expect(result.error).toBeUndefined();
    });
  });

  describe('createApiEndpoint', () => {
    it('should call the correct endpoint to create an API endpoint', async () => {
      // Mock request data
      const createParams = {
        apiId: 'api-1',
        endpointName: 'Get Users',
        httpMethod: 'GET' as const,
        path: '/users',
        queryprogramId: 'qp-1',
        description: 'Get all users',
        operationId: 'getUsers',
      };

      // Mock response data
      const mockResponse = {
        id: 'endpoint-1',
        name: 'Get Users',
        apiId: 'api-1',
        path: '/users',
        httpMethod: 'GET',
        queryprogramId: 'qp-1',
        description: 'Get all users',
        operationId: 'getUsers',
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await apisClient.createApiEndpoint(createParams);

      // Verify the HTTP client was called correctly with the formatted parameters
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/apis/endpoints', {
        body: {
          apiId: 'api-1',
          endpointName: 'Get Users',
          httpMethod: 'GET',
          path: '/users',
          queryprogramId: 'qp-1',
          description: 'Get all users',
          operationId: 'getUsers',
          tags: undefined,
          parameters: undefined,
          requestBody: undefined,
          responses: undefined,
          security: undefined,
        },
      });

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('getApiEndpoints', () => {
    it('should call the correct endpoint to get endpoints for an API', async () => {
      // Mock response data
      const mockEndpoints = [
        {
          id: 'endpoint-1',
          name: 'Get Users',
          apiId: 'api-1',
          path: '/users',
          httpMethod: 'GET',
          queryprogramId: 'qp-1',
          description: 'Get all users',
          operationId: 'getUsers',
          createdAt: '2025-01-03T00:00:00Z',
          updatedAt: '2025-01-03T00:00:00Z',
        },
        {
          id: 'endpoint-2',
          name: 'Create User',
          apiId: 'api-1',
          path: '/users',
          httpMethod: 'POST',
          queryprogramId: 'qp-2',
          description: 'Create a new user',
          operationId: 'createUser',
          createdAt: '2025-01-03T00:00:00Z',
          updatedAt: '2025-01-03T00:00:00Z',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockEndpoints,
      });

      // Call the method
      const result = await apisClient.getApiEndpoints('api-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/apis/endpoints/api/api-1',
      );

      // Verify the result
      expect(result.data).toEqual(mockEndpoints);
    });

    it('should handle errors when getting API endpoints', async () => {
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
      const result = await apisClient.getApiEndpoints('api-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/apis/endpoints/api/api-1',
      );

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getApiEndpoint', () => {
    it('should call the correct endpoint to get a specific endpoint', async () => {
      // Mock response data
      const mockEndpoint = {
        id: 'endpoint-1',
        name: 'Get Users',
        apiId: 'api-1',
        path: '/users',
        httpMethod: 'GET',
        queryprogramId: 'qp-1',
        description: 'Get all users',
        operationId: 'getUsers',
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockEndpoint,
      });

      // Call the method
      const result = await apisClient.getApiEndpoint('endpoint-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/apis/endpoints/endpoint-1',
      );

      // Verify the result
      expect(result.data).toEqual(mockEndpoint);
    });
  });

  describe('updateApiEndpoint', () => {
    it('should call the correct endpoint to update an API endpoint', async () => {
      // Mock request data
      const updateParams = {
        description: 'Updated endpoint description',
        operationId: 'updatedGetUsers',
      };

      // Mock response data
      const mockResponse = {
        id: 'endpoint-1',
        name: 'Get Users',
        apiId: 'api-1',
        path: '/users',
        httpMethod: 'GET',
        queryprogramId: 'qp-1',
        description: 'Updated endpoint description',
        operationId: 'updatedGetUsers',
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await apisClient.updateApiEndpoint(
        'endpoint-1',
        updateParams,
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/apis/endpoints/endpoint-1',
        {
          body: updateParams,
        },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('deleteApiEndpoint', () => {
    it('should call the correct endpoint to delete an API endpoint', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method
      const result = await apisClient.deleteApiEndpoint('endpoint-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/v1/apis/endpoints/endpoint-1',
        {
          params: { hardDelete: true },
        },
      );

      // Verify the result has no error
      expect(result.error).toBeUndefined();
    });

    it('should support soft deletion of endpoints when specified', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method with hardDelete=false
      const result = await apisClient.deleteApiEndpoint('endpoint-1', false);

      // Verify the HTTP client was called correctly with hardDelete=false
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/v1/apis/endpoints/endpoint-1',
        {
          params: { hardDelete: false },
        },
      );

      // Verify the result has no error
      expect(result.error).toBeUndefined();
    });
  });

  describe('getApiByQueryProgram', () => {
    it('should call the correct endpoint to get an API by query program ID', async () => {
      // Mock response data
      const mockApi = {
        id: 'api-1',
        name: 'API 1',
        projectId: 'project-1',
        basePath: '/api1',
        version: 'v1',
        status: 'published',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockApi,
      });

      // Call the method
      const result = await apisClient.getApiByQueryProgram('qp-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/apis/queryprogram/qp-1',
      );

      // Verify the result
      expect(result.data).toEqual(mockApi);
    });

    it('should handle errors when getting API by query program ID', async () => {
      // Setup the mock to return an error
      const mockError = createErrorFromStatus(
        404,
        'not_found',
        'Query program not found',
      );

      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        error: mockError,
      });

      // Call the method
      const result = await apisClient.getApiByQueryProgram('qp-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/apis/queryprogram/qp-1',
      );

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });
});
