import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatalinesClient } from '../../src/clients/datalines-client.js';
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

describe('DatalinesClient', () => {
  let datalinesClient: DatalinesClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a new mock HttpClient instance
    mockHttpClient = new HttpClient({
      baseUrl: 'https://api.infactory.ai',
      apiKey: 'test-api-key',
    });

    // Create a new DatalinesClient with the mock HttpClient
    datalinesClient = new DatalinesClient(mockHttpClient);
  });

  describe('getDatalines', () => {
    it('should call the correct endpoint to get all datalines', async () => {
      // Mock response data
      const mockDatalines = [
        {
          id: 'dl-1',
          name: 'Dataline 1',
          projectId: 'project-1',
          dataobjectId: 'do-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'dl-2',
          name: 'Dataline 2',
          projectId: 'project-1',
          dataobjectId: 'do-2',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockDatalines,
      });

      // Call the method
      const result = await datalinesClient.getDatalines();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/datalines', {
        params: {},
      });

      // Verify the result
      expect(result.data).toEqual(mockDatalines);
    });

    it('should filter by datasource ID when provided', async () => {
      // Mock response data
      const mockDatalines = [
        {
          id: 'dl-1',
          name: 'Dataline 1',
          projectId: 'project-1',
          dataobjectId: 'do-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockDatalines,
      });

      // Call the method with datasource ID
      const result = await datalinesClient.getDatalines('ds-1');

      // Verify the HTTP client was called correctly with datasourceId parameter
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/datalines', {
        params: { datasourceId: 'ds-1' },
      });

      // Verify the result
      expect(result.data).toEqual(mockDatalines);
    });

    it('should handle errors when getting datalines', async () => {
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
      const result = await datalinesClient.getDatalines();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/datalines', {
        params: {},
      });

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getProjectDatalines', () => {
    it('should call the correct endpoint to get datalines for a project', async () => {
      // Mock response data
      const mockDatalines = [
        {
          id: 'dl-1',
          name: 'Dataline 1',
          projectId: 'project-1',
          dataobjectId: 'do-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'dl-2',
          name: 'Dataline 2',
          projectId: 'project-1',
          dataobjectId: 'do-2',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockDatalines,
      });

      // Call the method
      const result = await datalinesClient.getProjectDatalines('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/datalines/project/project-1',
      );

      // Verify the result
      expect(result.data).toEqual(mockDatalines);
    });
  });

  describe('getDataline', () => {
    it('should call the correct endpoint to get a dataline by ID', async () => {
      // Mock response data
      const mockDataline = {
        id: 'dl-1',
        name: 'Dataline 1',
        projectId: 'project-1',
        dataobjectId: 'do-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockDataline,
      });

      // Call the method
      const result = await datalinesClient.getDataline('dl-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/datalines/dl-1');

      // Verify the result
      expect(result.data).toEqual(mockDataline);
    });
  });

  describe('createDataline', () => {
    it('should call the correct endpoint to create a dataline', async () => {
      // Mock request data
      const createParams = {
        name: 'New Dataline',
        projectId: 'project-1',
        dataobjectId: 'do-1',
        schemaCode: 'schema-code-example',
      };

      // Mock response data
      const mockResponse = {
        id: 'new-dl',
        name: 'New Dataline',
        projectId: 'project-1',
        dataobjectId: 'do-1',
        schemaCode: 'schema-code-example',
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await datalinesClient.createDataline(createParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/datalines',
        createParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('updateDataline', () => {
    it('should call the correct endpoint to update a dataline without data model', async () => {
      // Mock request data
      const updateParams = {
        name: 'Updated Dataline',
        dataobjectId: 'do-2',
      };

      // Mock response data
      const mockResponse = {
        id: 'dl-1',
        name: 'Updated Dataline',
        projectId: 'project-1',
        dataobjectId: 'do-2',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await datalinesClient.updateDataline('dl-1', updateParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/datalines/dl-1',
        updateParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle data model when updating a dataline', async () => {
      // Mock request data with data model
      const updateParams = {
        name: 'Updated Dataline',
        dataModel: {
          fields: [
            { name: 'id', type: 'string' },
            { name: 'value', type: 'number' },
          ],
        },
      };

      // Expected params sent to API
      const expectedParams = {
        name: 'Updated Dataline',
        data_model: {
          fields: [
            { name: 'id', type: 'string' },
            { name: 'value', type: 'number' },
          ],
        },
      };

      // Mock response data
      const mockResponse = {
        id: 'dl-1',
        name: 'Updated Dataline',
        projectId: 'project-1',
        dataobjectId: 'do-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await datalinesClient.updateDataline('dl-1', updateParams);

      // Verify the HTTP client was called correctly with data_model instead of dataModel
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/datalines/dl-1',
        expectedParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('updateDatalineSchema', () => {
    it('should call the correct endpoint to update a dataline schema', async () => {
      // Schema code to update
      const schemaCode = 'updated-schema-code-example';

      // Mock response data
      const mockResponse = {
        id: 'dl-1',
        name: 'Dataline 1',
        projectId: 'project-1',
        dataobjectId: 'do-1',
        schemaCode: 'updated-schema-code-example',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await datalinesClient.updateDatalineSchema(
        'dl-1',
        schemaCode,
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/datalines/dl-1/schema',
        schemaCode,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('deleteDataline', () => {
    it('should call the correct endpoint to delete a dataline', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method
      const result = await datalinesClient.deleteDataline('dl-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/v1/datalines/dl-1', {
        permanent: false,
      });

      // Verify the result has no error
      expect(result.error).toBeUndefined();
    });

    it('should support permanent deletion when specified', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method with permanent=true
      const result = await datalinesClient.deleteDataline('dl-1', true);

      // Verify the HTTP client was called correctly with permanent=true
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/v1/datalines/dl-1', {
        permanent: true,
      });

      // Verify the result has no error
      expect(result.error).toBeUndefined();
    });
  });
});
