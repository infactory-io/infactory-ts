import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryProgramsClient } from '../../src/clients/queryprograms-client.js';
import { HttpClient } from '../../src/core/http-client.js';
import { createErrorFromStatus } from '../../src/errors/index.js';
import {
  ApiResponse,
  QueryResponse,
  QueryProgram,
} from '../../src/types/common.js';

// Mock the HttpClient
vi.mock('../../src/core/http-client', () => {
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

describe('QueryProgramsClient', () => {
  let queryProgramsClient: QueryProgramsClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a new mock HttpClient instance
    mockHttpClient = new HttpClient({
      baseUrl: 'https://api.infactory.ai',
      apiKey: 'test-api-key',
    });

    // Create a new QueryProgramsClient with the mock HttpClient
    queryProgramsClient = new QueryProgramsClient(mockHttpClient);
  });

  describe('listQueryPrograms', () => {
    it('should call the correct endpoint to list query programs', async () => {
      // Mock response data
      const mockQueryPrograms = [
        {
          id: 'qp-1',
          name: 'Query Program 1',
          projectId: 'project-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          published: true,
        },
        {
          id: 'qp-2',
          name: 'Query Program 2',
          projectId: 'project-1',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
          published: false,
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockQueryPrograms,
      });

      // Call the method
      const result = await queryProgramsClient.listQueryPrograms();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/queryprograms', {
        params: undefined,
      });

      // Verify the result
      expect(result.data).toEqual(mockQueryPrograms);
    });

    it('should handle pagination and projectId parameters', async () => {
      // Mock response data
      const mockQueryPrograms = [
        {
          id: 'qp-1',
          name: 'Query Program 1',
          projectId: 'project-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          published: true,
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockQueryPrograms,
      });

      // Call the method with pagination parameters
      const params = {
        page: 1,
        limit: 10,
        projectId: 'project-1',
      };
      const result = await queryProgramsClient.listQueryPrograms(params);

      // Verify the HTTP client was called correctly with the pagination parameters
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/queryprograms', {
        params,
      });

      // Verify the result
      expect(result.data).toEqual(mockQueryPrograms);
    });

    it('should handle errors when listing query programs', async () => {
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
      const result = await queryProgramsClient.listQueryPrograms();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/queryprograms', {
        params: undefined,
      });

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getQueryProgram', () => {
    it('should call the correct endpoint to get a query program by ID', async () => {
      // Mock response data
      const mockQueryProgram = {
        id: 'qp-1',
        name: 'Query Program 1',
        projectId: 'project-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        published: true,
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockQueryProgram,
      });

      // Call the method
      const result = await queryProgramsClient.getQueryProgram('qp-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/queryprograms/qp-1');

      // Verify the result
      expect(result.data).toEqual(mockQueryProgram);
    });

    it('should handle errors when getting a query program', async () => {
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
      const result =
        await queryProgramsClient.getQueryProgram('qp-nonexistent');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-nonexistent',
      );

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getQueryProgramsByProject', () => {
    it('should call the correct endpoint to get query programs by project ID', async () => {
      // Mock response data
      const mockQueryPrograms = [
        {
          id: 'qp-1',
          name: 'Query Program 1',
          projectId: 'project-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          published: true,
        },
        {
          id: 'qp-2',
          name: 'Query Program 2',
          projectId: 'project-1',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
          published: false,
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockQueryPrograms,
      });

      // Call the method
      const result =
        await queryProgramsClient.getQueryProgramsByProject('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/queryprograms', {
        projectId: 'project-1',
      });

      // Verify the result
      expect(result.data).toEqual(mockQueryPrograms);
    });

    it('should handle undefined projectId', async () => {
      // Mock response data - all query programs
      const mockQueryPrograms = [
        {
          id: 'qp-1',
          name: 'Query Program 1',
          projectId: 'project-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          published: true,
        },
        {
          id: 'qp-3',
          name: 'Query Program 3',
          projectId: 'project-2',
          createdAt: '2025-01-03T00:00:00Z',
          updatedAt: '2025-01-03T00:00:00Z',
          published: true,
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockQueryPrograms,
      });

      // Call the method without projectId
      const result = await queryProgramsClient.getQueryProgramsByProject();

      // Verify the HTTP client was called correctly with undefined projectId
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/queryprograms', {
        projectId: undefined,
      });

      // Verify the result
      expect(result.data).toEqual(mockQueryPrograms);
    });

    it('should handle errors when getting query programs by project', async () => {
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
      const result =
        await queryProgramsClient.getQueryProgramsByProject('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/queryprograms', {
        projectId: 'project-1',
      });

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('createQueryProgram', () => {
    it('should call the correct endpoint to create a query program', async () => {
      // Mock request data
      const createParams = {
        name: 'New Query Program',
        projectId: 'project-1',
        query: 'select * from users',
        published: false,
      };
      // Mock response data
      const mockResponse = {
        id: 'qp-new',
        name: 'New Query Program',
        projectId: 'project-1',
        query: 'select * from users',
        published: false,
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await queryProgramsClient.createQueryProgram(createParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/queryprograms',
        createParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle errors when creating a query program', async () => {
      // Mock request data
      const createParams = {
        name: 'New Query Program',
        projectId: '', // Empty projectId to trigger validation error
        query: 'select * from users',
      } as any; // Using type assertion to bypass TypeScript check

      // Setup the mock to return an error
      const mockError = createErrorFromStatus(
        400,
        'validation_error',
        'Project ID is required',
      );

      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        error: mockError,
      });

      // Call the method
      const result = await queryProgramsClient.createQueryProgram(createParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/queryprograms',
        createParams,
      );

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('updateQueryProgram', () => {
    it('should call the correct endpoint to update a query program', async () => {
      // Mock request data
      const updateParams = {
        name: 'Updated Query Program',
        description: 'Updated description',
        query: 'SELECT * FROM updated_table',
      };

      // Mock response data
      const mockResponse = {
        id: 'qp-1',
        name: 'Updated Query Program',
        description: 'Updated description',
        query: 'SELECT * FROM updated_table',
        projectId: 'project-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
        published: false,
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await queryProgramsClient.updateQueryProgram(
        'qp-1',
        updateParams,
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1',
        updateParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should filter out null and undefined values when updating', async () => {
      // Mock request data with some null values
      const updateParams = {
        name: 'Updated Query Program',
        description: null, // Should be filtered out
        query: 'select * from users where active = true',
        tags: undefined, // Should be filtered out
        published: true,
      };

      const expectedFilteredParams = {
        name: 'Updated Query Program',
        query: 'select * from users where active = true',
        published: true,
      };

      // Mock response data
      const mockResponse = {
        id: 'qp-1',
        name: 'Updated Query Program',
        projectId: 'project-1',
        query: 'select * from users where active = true',
        published: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-03T12:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await queryProgramsClient.updateQueryProgram(
        'qp-1',
        updateParams,
      );

      // Verify the HTTP client was called correctly with filtered parameters
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1',
        expectedFilteredParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle errors when updating a query program', async () => {
      // Mock request data
      const updateParams = {
        name: 'Updated Query Program',
        query: 'INVALID SQL SYNTAX',
      };

      // Setup the mock to return an error
      const mockError = createErrorFromStatus(
        400,
        'validation_error',
        'Invalid SQL syntax',
      );

      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        error: mockError,
      });

      // Call the method
      const result = await queryProgramsClient.updateQueryProgram(
        'qp-1',
        updateParams,
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1',
        updateParams,
      );

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('deleteQueryProgram', () => {
    it('should call the correct endpoint to delete a query program', async () => {
      // Setup the mock response for a successful deletion
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method
      const result = await queryProgramsClient.deleteQueryProgram('qp-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1',
        {
          permanent: false,
        },
      );

      // Verify the result
      expect(result.data).toBeUndefined();
    });

    it('should handle permanent deletion parameter', async () => {
      // Setup the mock response for a successful permanent deletion
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method with permanent=true
      const result = await queryProgramsClient.deleteQueryProgram('qp-1', true);

      // Verify the HTTP client was called correctly with permanent=true
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1',
        {
          permanent: true,
        },
      );

      // Verify the result
      expect(result.data).toBeUndefined();
    });
  });

  describe('executeQueryProgram', () => {
    it('should call the correct endpoint to execute a query program', async () => {
      // Mock request parameters
      const executeParams = {
        param1: 'value1',
        param2: 42,
      };

      // Mock response data
      const mockResponse = {
        result: [
          { id: 1, name: 'Test 1' },
          { id: 2, name: 'Test 2' },
        ],
        metadata: {
          executionTime: 0.15,
          queryProgramId: 'qp-1',
        },
        success: true,
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await queryProgramsClient.executeQueryProgram(
        'qp-1',
        executeParams,
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1/execute',
        executeParams,
      );

      // Verify the result
      // TypeScript doesn't know that we've mocked this to return an ApiResponse
      // and not a ReadableStream, so we need to cast
      expect((result as ApiResponse<QueryResponse>).data).toEqual(mockResponse);
    });

    it('should handle null parameters when executing a query program', async () => {
      // Mock response data
      const mockResponse = {
        result: [],
        metadata: {
          executionTime: 0.05,
          queryProgramId: 'qp-1',
        },
        success: true,
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method with undefined parameters (testing line 118 branch)
      const result = await queryProgramsClient.executeQueryProgram(
        'qp-1',
        undefined,
      );

      // Verify the HTTP client was called correctly with empty object
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1/execute',
        {},
      );

      // Verify the result
      // TypeScript doesn't know that we've mocked this to return an ApiResponse
      // and not a ReadableStream, so we need to cast
      expect((result as ApiResponse<QueryResponse>).data).toEqual(mockResponse);
    });
  });

  describe('executeQueryProgramStream', () => {
    it('should call the correct endpoint to execute a query program with streaming', async () => {
      // Mock request parameters
      const executeParams = {
        param1: 'value1',
        param2: 42,
        stream: true,
      };

      // Mock stream response
      const mockStream = new ReadableStream();

      // Setup the mock response
      vi.mocked(mockHttpClient.createStream).mockResolvedValueOnce(mockStream);

      // Call the method
      const result = await queryProgramsClient.executeQueryProgramStream(
        'qp-1',
        executeParams,
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.createStream).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1/execute',
        {
          url: '/v1/queryprograms/qp-1/execute',
          method: 'POST',
          jsonBody: executeParams,
          headers: {
            Accept: 'text/event-stream',
          },
        },
      );

      // Verify the result is a stream
      expect(result).toBe(mockStream);
    });

    it('should handle null parameters when executing a query program with streaming', async () => {
      // Mock stream response
      const mockStream = new ReadableStream();

      // Setup the mock response
      vi.mocked(mockHttpClient.createStream).mockResolvedValueOnce(mockStream);

      // Call the method with undefined parameters (testing line 135 branch)
      const result = await queryProgramsClient.executeQueryProgramStream(
        'qp-1',
        undefined,
      );

      // Verify the HTTP client was called correctly with empty object
      expect(mockHttpClient.createStream).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1/execute',
        {
          url: '/v1/queryprograms/qp-1/execute',
          method: 'POST',
          jsonBody: {},
          headers: {
            Accept: 'text/event-stream',
          },
        },
      );

      // Verify the result is a stream
      expect(result).toBe(mockStream);
    });
  });

  describe('validateQueryProgram', () => {
    it('should call the correct endpoint to validate a query program', async () => {
      // Mock request data
      const validateParams = {
        name: 'New Query Program',
        projectId: 'project-1',
        query: 'SELECT * FROM users',
        parameters: [
          {
            name: 'param1',
            type: 'string',
            required: true,
          },
        ],
      };

      // Mock response data
      const mockResponse = {
        valid: true,
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result =
        await queryProgramsClient.validateQueryProgram(validateParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/queryprograms/validate',
        validateParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should filter out null and undefined values when validating', async () => {
      // Mock request data with some null values
      const validateParams = {
        name: 'New Query Program',
        projectId: 'project-1',
        query: 'SELECT * FROM users',
        parameters: null,
        description: undefined,
      };

      // Expected filtered parameters
      const expectedFilteredParams = {
        name: 'New Query Program',
        projectId: 'project-1',
        query: 'SELECT * FROM users',
      };

      // Mock response data
      const mockResponse = {
        valid: true,
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result =
        await queryProgramsClient.validateQueryProgram(validateParams);

      // Verify the HTTP client was called correctly with filtered parameters
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/queryprograms/validate',
        expectedFilteredParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle validation errors', async () => {
      // Mock request data
      const validateParams = {
        name: 'Invalid Query Program',
        projectId: 'project-1',
        query: 'INVALID SQL QUERY',
      };

      // Mock response data with errors
      const mockResponse = {
        valid: false,
        errors: ['Invalid SQL syntax', 'Unknown table referenced'],
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result =
        await queryProgramsClient.validateQueryProgram(validateParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/queryprograms/validate',
        validateParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('getQueryProgramHistory', () => {
    it('should call the correct endpoint to get query program execution history', async () => {
      // Mock response data
      const mockHistory = [
        {
          id: 'exec-1',
          queryProgramId: 'qp-1',
          timestamp: '2025-01-01T12:00:00Z',
          executionTime: 0.15,
          success: true,
          result: [{ id: 1, name: 'Test 1' }],
        },
        {
          id: 'exec-2',
          queryProgramId: 'qp-1',
          timestamp: '2025-01-02T12:00:00Z',
          executionTime: 0.2,
          success: true,
          result: [{ id: 2, name: 'Test 2' }],
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockHistory,
      });

      // Call the method
      const result = await queryProgramsClient.getQueryProgramHistory('qp-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1/history',
        {
          params: undefined,
        },
      );

      // Verify the result
      expect(result.data).toEqual(mockHistory);
    });

    it('should handle pagination and date filter parameters', async () => {
      // Mock response data
      const mockHistory = [
        {
          id: 'exec-1',
          queryProgramId: 'qp-1',
          timestamp: '2025-01-01T12:00:00Z',
          executionTime: 0.15,
          success: true,
          result: [{ id: 1, name: 'Test 1' }],
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockHistory,
      });

      // Call the method with parameters
      const params = {
        page: 1,
        limit: 10,
        start_date: '2025-01-01',
        end_date: '2025-01-02',
      };
      const result = await queryProgramsClient.getQueryProgramHistory(
        'qp-1',
        params,
      );

      // Verify the HTTP client was called correctly with the parameters
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1/history',
        {
          params,
        },
      );

      // Verify the result
      expect(result.data).toEqual(mockHistory);
    });
  });

  describe('createQueryProgramModel', () => {
    it('should call the correct endpoint to create a model from a query program', async () => {
      // Mock response data
      const mockResponse = {
        id: 'qp-1',
        name: 'Query Program 1',
        projectId: 'project-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
        published: true,
        modelId: 'model-1',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await queryProgramsClient.createQueryProgramModel('qp-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1/create-model',
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('publishQueryProgram', () => {
    it('should call the correct endpoint to publish a query program with default groupSlots', async () => {
      // Mock response data
      const mockResponse = {
        id: 'qp-1',
        name: 'Query Program 1',
        projectId: 'project-1',
        published: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method with default groupSlots parameter (false)
      const result = await queryProgramsClient.publishQueryProgram('qp-1');

      // Verify the HTTP client was called correctly with default group_slots = false
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1/publish',
        { group_slots: false },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle explicitly passing false for the groupSlots parameter', async () => {
      // Mock response data
      const mockResponse = {
        id: 'qp-1',
        name: 'Query Program 1',
        projectId: 'project-1',
        published: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method with explicit groupSlots = false
      const result = await queryProgramsClient.publishQueryProgram(
        'qp-1',
        false,
      );

      // Verify the HTTP client was called correctly with group_slots = false
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1/publish',
        { group_slots: false },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle the groupSlots parameter when set to true', async () => {
      // Mock response data
      const mockResponse = {
        id: 'qp-1',
        name: 'Query Program 1',
        projectId: 'project-1',
        published: true,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method with groupSlots = true
      const result = await queryProgramsClient.publishQueryProgram(
        'qp-1',
        true,
      );

      // Verify the HTTP client was called correctly with group_slots = true
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1/publish',
        { group_slots: true },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle errors when publishing a query program', async () => {
      // Setup the mock to return an error
      const mockError = createErrorFromStatus(
        404,
        'not_found',
        'Query program not found',
      );

      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        error: mockError,
      });

      // Call the method
      const result =
        await queryProgramsClient.publishQueryProgram('qp-nonexistent');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-nonexistent/publish',
        { group_slots: false },
      );

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });

    it('should handle publishing an already published query program', async () => {
      // Mock response data for an already published program
      const mockResponse = {
        id: 'qp-1',
        name: 'Query Program 1',
        projectId: 'project-1',
        published: true, // Already published
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await queryProgramsClient.publishQueryProgram('qp-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1/publish',
        { group_slots: false },
      );

      // Verify the result shows it's still published
      expect((result as ApiResponse<QueryProgram>).data?.published).toBe(true);
    });
  });

  describe('getCoverage', () => {
    it('should call the correct endpoint to get coverage information', async () => {
      // Mock response data
      const mockResponse = {
        total: 10,
        covered: 8,
        coverage: 0.8,
        details: {
          tables: ['users', 'orders', 'products'],
          uncoveredTables: ['payments', 'shipments'],
        },
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await queryProgramsClient.getCoverage('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/queryprograms/coverage/project-1',
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });
});
