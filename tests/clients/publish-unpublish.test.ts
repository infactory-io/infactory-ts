import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryProgramsClient } from '../../src/clients/queryprograms-client.js';
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
      createStream: vi.fn(),
    })),
  };
});

describe('QueryProgramsClient - Publish/Unpublish Tests', () => {
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
  });

  describe('unpublishQueryProgram', () => {
    it('should call the correct endpoint to unpublish a query program', async () => {
      // Mock response data
      const mockResponse = {
        id: 'qp-1',
        name: 'Query Program 1',
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
      const result = await queryProgramsClient.unpublishQueryProgram('qp-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1/unpublish',
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle errors when unpublishing a query program', async () => {
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
        await queryProgramsClient.unpublishQueryProgram('qp-nonexistent');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-nonexistent/unpublish',
      );

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });

    it('should handle unpublishing an already unpublished query program', async () => {
      // Mock response data for an already unpublished program
      const mockResponse = {
        id: 'qp-1',
        name: 'Query Program 1',
        projectId: 'project-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
        published: false, // Already unpublished
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await queryProgramsClient.unpublishQueryProgram('qp-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/queryprograms/qp-1/unpublish',
      );

      // Verify the result shows it's still unpublished
      expect(result.data).toEqual(mockResponse);
      expect(result.data?.published).toBe(false);
    });
  });
});
