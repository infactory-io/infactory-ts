import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DatasourcesClient } from '../../src/clients/datasources-client.js';
import { HttpClient } from '../../src/core/http-client.js';
import { createErrorFromStatus } from '../../src/errors/index.js';
import { SampleTablesRequest } from '@/types/common.js';
import { uploadCsvFile } from '../../src/utils/uploadCsvFile.js';

// Mock dependencies
vi.mock('fs', () => ({
  default: {
    statSync: vi.fn().mockReturnValue({ size: 1024 }),
    createReadStream: vi.fn().mockReturnValue('mock-file-stream'),
    existsSync: vi.fn().mockReturnValue(true),
  },
  statSync: vi.fn().mockReturnValue({ size: 1024 }),
  createReadStream: vi.fn().mockReturnValue('mock-file-stream'),
  existsSync: vi.fn().mockReturnValue(true),
}));

vi.mock('path', () => ({
  basename: vi.fn().mockReturnValue('test.csv'),
  extname: vi.fn().mockReturnValue('.csv'),
}));

vi.mock('form-data', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      append: vi.fn(),
    })),
  };
});

// Mock the uploadCsvFile function
vi.mock('../../src/utils/uploadCsvFile', () => ({
  uploadCsvFile: vi.fn().mockResolvedValue({
    datasource_id: 'ds-1',
    message: 'Upload successful',
    redirect_to: '/datasources/ds-1',
    success: true,
  }),
}));

// Mock the HttpClient
vi.mock('../../src/core/http-client', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
      createStream: vi.fn(),
      getIsServer: vi.fn(),
      getApiKey: vi.fn().mockReturnValue('test-api-key'),
      getBaseUrl: vi.fn().mockReturnValue('https://api.infactory.ai'),
    })),
  };
});

describe('DatasourcesClient', () => {
  let datasourcesClient: DatasourcesClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a new mock HttpClient instance
    mockHttpClient = new HttpClient({
      baseUrl: 'https://api.infactory.ai',
      apiKey: 'test-api-key',
    });

    // Set up getIsServer to return true for server-side tests
    vi.mocked(mockHttpClient.getIsServer).mockReturnValue(true);

    // Set up uploadCsvFile mock
    vi.mocked(uploadCsvFile).mockResolvedValue({
      datasource_id: 'ds-1',
      message: 'Upload successful',
      redirect_to: '/datasources/ds-1',
      success: true,
    });

    // Create a new DatasourcesClient with the mock HttpClient
    datasourcesClient = new DatasourcesClient(mockHttpClient);
  });

  describe('getProjectDatasources', () => {
    it('should call the correct endpoint to get datasources for a project', async () => {
      // Mock response data
      const mockDatasources = [
        {
          id: 'ds-1',
          name: 'Datasource 1',
          projectId: 'project-1',
          type: 'csv',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'ds-2',
          name: 'Datasource 2',
          projectId: 'project-1',
          type: 'postgresql',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockDatasources,
      });

      // Call the method
      const result = await datasourcesClient.getProjectDatasources('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/datasources/project/project-1',
      );

      // Verify the result
      expect(result.data).toEqual(mockDatasources);
    });

    it('should handle errors when getting project datasources', async () => {
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
      const result = await datasourcesClient.getProjectDatasources('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/datasources/project/project-1',
      );

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getDatasource', () => {
    it('should call the correct endpoint to get a datasource by ID', async () => {
      // Mock response data
      const mockDatasource = {
        id: 'ds-1',
        name: 'Datasource 1',
        projectId: 'project-1',
        type: 'csv',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockDatasource,
      });

      // Call the method
      const result = await datasourcesClient.getDatasource('ds-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/datasources/ds-1');

      // Verify the result
      expect(result.data).toEqual(mockDatasource);
    });
  });

  describe('createDatasource', () => {
    it('should call the correct endpoint to create a datasource', async () => {
      // Mock request data
      const createParams = {
        name: 'New Datasource',
        projectId: 'project-1',
        type: 'csv',
        uri: 's3://bucket/path/to/file.csv',
      };

      // Mock response data
      const mockResponse = {
        id: 'new-ds',
        name: 'New Datasource',
        projectId: 'project-1',
        type: 'csv',
        uri: 's3://bucket/path/to/file.csv',
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await datasourcesClient.createDatasource(createParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/datasources',
        createParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('uploadCsvFile', () => {
    it('should create a datasource and upload a file', async () => {
      const projectId = 'project-1';
      const csvFilePath = '/path/to/test.csv';

      // Mock datasource creation response
      const mockDatasource = {
        id: 'ds-1',
        name: 'test.csv 2025-01-01T00-00-00Z',
        projectId: 'project-1',
        type: 'csv',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockDatasource,
      });

      // Call the method
      const result = await datasourcesClient.uploadCsvFile(
        projectId,
        csvFilePath,
      );

      // Verify datasource creation was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/datasources', {
        name: expect.any(String),
        projectId: 'project-1',
        type: 'csv',
      });

      // Verify uploadCsvFile was called
      expect(uploadCsvFile).toHaveBeenCalledWith({
        projectId: 'project-1',
        datasourceId: 'ds-1',
        file: '/path/to/test.csv',
        accessToken: 'test-api-key',
        baseUrl: 'https://api.infactory.ai',
      });

      // Verify the returned data
      expect(result).toEqual({
        datasource: mockDatasource,
        uploadResponse: {
          datasource_id: 'ds-1',
          message: 'Upload successful',
          redirect_to: '/datasources/ds-1',
          success: true,
        },
      });
    });

    it('should handle errors during datasource creation', async () => {
      // Setup the mock to return an error during datasource creation
      const mockError = createErrorFromStatus(
        400,
        'bad_request',
        'Invalid project ID',
      );

      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        error: mockError,
      });

      // Call the method and expect it to throw
      await expect(
        datasourcesClient.uploadCsvFile('project-1', '/path/to/test.csv'),
      ).rejects.toEqual(mockError);
    });

    it('should handle errors when uploadCsvFile fails', async () => {
      // Mock datasource creation response
      const mockDatasource = {
        id: 'ds-1',
        name: 'test.csv 2025-01-01T00-00-00Z',
        projectId: 'project-1',
        type: 'csv',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      // Setup the mock responses
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockDatasource,
      });

      // Mock uploadCsvFile to throw an error
      const uploadError = new Error('Upload failed');
      vi.mocked(uploadCsvFile).mockRejectedValueOnce(uploadError);

      // Call the method and expect it to throw
      await expect(
        datasourcesClient.uploadCsvFile('project-1', '/path/to/test.csv'),
      ).rejects.toThrow('Upload failed');
    });

    it('should handle case where datasource data is null', async () => {
      // Setup the mock response with data: null
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: null, // Datasource is null
      });

      // Call the method and expect it to throw with specific error message
      await expect(
        datasourcesClient.uploadCsvFile('project-1', '/path/to/test.csv'),
      ).rejects.toThrow(
        'Error creating datasource: Datasource ID is missing or invalid',
      );
    });

    it('should handle errors during datasource creation', async () => {
      // Mock datasource creation response with error
      const datasourceError = createErrorFromStatus(
        500,
        'server_error',
        'Datasource creation failed',
      );
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        error: datasourceError,
      });

      // Call the method and expect it to throw
      await expect(
        datasourcesClient.uploadCsvFile('project-1', '/path/to/test.csv'),
      ).rejects.toEqual(datasourceError);
    });

    it('should handle errors during file upload', async () => {
      // Mock create datasource response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: { id: 'ds-1', name: 'test.csv 2025-01-01T00-00-00Z' },
      });

      // Mock uploadCsvFile to throw an error
      const uploadError = new Error('Upload failed');
      vi.mocked(uploadCsvFile).mockRejectedValueOnce(uploadError);

      // Call the method and expect it to throw
      await expect(
        datasourcesClient.uploadCsvFile('project-1', '/path/to/test.csv'),
      ).rejects.toEqual(uploadError);
    });

    it('should use custom datasource name when provided', async () => {
      const customName = 'Custom Datasource Name';

      // Mock create datasource response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: { id: 'ds-1', name: customName },
      });

      // Call the method with a custom datasource name
      const result = await datasourcesClient.uploadCsvFile(
        'project-1',
        '/path/to/test.csv',
        10,
        customName,
      );

      // Verify the datasource was created with the custom name
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/datasources',
        expect.objectContaining({
          name: customName,
          projectId: 'project-1',
          type: 'csv',
        }),
      );

      // Verify uploadCsvFile was called
      expect(uploadCsvFile).toHaveBeenCalledWith({
        projectId: 'project-1',
        datasourceId: 'ds-1',
        file: '/path/to/test.csv',
        accessToken: 'test-api-key',
        baseUrl: 'https://api.infactory.ai',
      });

      // Verify the returned data contains the custom name
      expect(result.datasource.name).toEqual(customName);
    });
  });

  describe('cloneDatasource', () => {
    it('should call the correct endpoint to clone a datasource', async () => {
      // Mock response data
      const mockDatasource = {
        id: 'ds-clone',
        name: 'Datasource Clone',
        projectId: 'project-2', // New project ID
        type: 'csv',
        createdAt: '2025-01-04T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockDatasource,
      });

      // Call the method
      const result = await datasourcesClient.cloneDatasource(
        'ds-1',
        'project-2',
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/datasources/ds-1/clone',
        {
          new_projectId: 'project-2',
        },
      );

      // Verify the result
      expect(result.data).toEqual(mockDatasource);
    });
  });

  describe('getDatasourceWithDatalines', () => {
    it('should call the correct endpoint to get a datasource with datalines', async () => {
      // Mock response data
      const mockDatasourceWithDatalines = {
        id: 'ds-1',
        name: 'Datasource 1',
        projectId: 'project-1',
        type: 'csv',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        dataobjects: [
          {
            id: 'obj-1',
            bucket: 'test-bucket',
            key: 'test-key',
            fileType: 'csv',
            fileSize: 1024,
            etag: 'test-etag',
            mimeType: 'text/csv',
            metadata: {},
            datasourceId: 'ds-1',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
            deletedAt: null,
          },
        ],
        status: 'ready',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockDatasourceWithDatalines,
      });

      // Call the method
      const result = await datasourcesClient.getDatasourceWithDatalines('ds-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/datasources/ds-1/with_datalines',
      );

      // Verify the result
      expect(result.data).toEqual(mockDatasourceWithDatalines);
    });

    it('should handle errors when getting datasource with datalines', async () => {
      // Setup the mock to return an error
      const mockError = createErrorFromStatus(
        404,
        'not_found',
        'Datasource not found',
      );

      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        error: mockError,
      });

      // Call the method
      const result =
        await datasourcesClient.getDatasourceWithDatalines('non-existent-id');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/datasources/non-existent-id/with_datalines',
      );

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('updateDatasource', () => {
    it('should call the correct endpoint to update a datasource', async () => {
      // Mock request data
      const updateParams = {
        name: 'Updated Datasource',
        type: 'postgresql',
        credentials: {
          host: 'localhost',
          port: 5432,
          database: 'testdb',
          username: 'user',
          password: 'password',
        },
      };

      // Mock response data
      const mockResponse = {
        id: 'ds-1',
        name: 'Updated Datasource',
        projectId: 'project-1',
        type: 'postgresql',
        credentials: {
          host: 'localhost',
          port: 5432,
          database: 'testdb',
          username: 'user',
          password: '********', // Password masked in response
        },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await datasourcesClient.updateDatasource(
        'ds-1',
        updateParams,
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/datasources/ds-1',
        updateParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('deleteDatasource', () => {
    it('should call the correct endpoint to delete a datasource', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method
      const result = await datasourcesClient.deleteDatasource('ds-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/v1/datasources/ds-1?permanent=false',
      );

      // Verify the result
      expect(result.data).toBeUndefined();
    });

    it('should handle permanent deletion', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method with permanent = true
      const result = await datasourcesClient.deleteDatasource('ds-1', true);

      // Verify the HTTP client was called correctly with permanent = true
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/v1/datasources/ds-1?permanent=true',
      );

      // Verify the result
      expect(result.data).toBeUndefined();
    });
  });

  describe('getOntologyGraph', () => {
    it('should call the correct endpoint to get the ontology graph for a datasource', async () => {
      // Mock response data
      const mockGraph = {
        nodes: [
          {
            id: 'node-1',
            type: 'entity',
            data: {
              label: 'User',
              nodeType: 'entity',
            },
          },
          {
            id: 'node-2',
            type: 'entity',
            data: {
              label: 'Order',
              nodeType: 'entity',
            },
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            type: 'relationship',
            data: {
              label: 'places',
            },
          },
        ],
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockGraph,
      });

      // Call the method
      const result = await datasourcesClient.getOntologyGraph('ds-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/datasources/ds-1/ontology_mapping',
      );

      // Verify the result
      expect(result.data).toEqual(mockGraph);
    });
  });

  describe('uploadDatasource', () => {
    it('should call the correct endpoint to upload a file to a datasource', async () => {
      // Mock FormData instance
      const mockFormData = new FormData();

      // Mock stream response
      const mockStream = new ReadableStream();
      vi.mocked(mockHttpClient.createStream).mockResolvedValueOnce(mockStream);

      // Call the method
      const result = await datasourcesClient.uploadDatasource(
        'project-1',
        'ds-1',
        mockFormData as any,
        'job-123',
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.createStream).toHaveBeenCalledWith(
        expect.stringContaining('/v1/actions/load/project-1'),
        expect.objectContaining({
          method: 'POST',
          params: {
            jobId: 'job-123',
            datasourceId: 'ds-1',
          },
        }),
      );

      // Verify the result is a stream
      expect(result).toBe(mockStream);
    });
  });

  describe('testConnection', () => {
    it('should call the correct endpoint to test a database connection', async () => {
      // Mock response data
      const mockResponse = {
        success: true,
        tables: [
          {
            name: 'users',
            estimatedRows: 1000,
            estimatedSize: '1 MB',
            columnCount: 5,
          },
          {
            name: 'orders',
            estimatedRows: 5000,
            estimatedSize: '5 MB',
            columnCount: 8,
          },
        ],
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const connectionString = 'postgresql://user:password@localhost:5432/mydb';
      const result =
        await datasourcesClient.testDatabaseConnection(connectionString);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/database/test-connection',
        {
          body: { connectionString: connectionString },
        },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle errors when testing a database connection', async () => {
      // Setup the mock to return an error
      const mockError = createErrorFromStatus(
        500,
        'server_error',
        'Internal server error',
      );

      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        error: mockError,
      });

      // Call the method
      const connectionString = 'postgresql://user:password@localhost:5432/mydb';
      const result =
        await datasourcesClient.testDatabaseConnection(connectionString);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/database/test-connection',
        {
          body: { connectionString: connectionString },
        },
      );

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('sampleTables', () => {
    it('should call the correct endpoint to sample tables from a database', async () => {
      // Mock response data
      const mockResponse = {
        dataObjects: {
          users: 'data-obj-1',
          orders: 'data-obj-2',
        },
        jobs: [
          {
            jobType: 'sample_tables',
            projectId: 'project-1',
            userId: 'user-1',
            parentJobId: null,
            metadata: {},
            payload: {},
          },
        ],
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method with type assertion to handle the interface mismatch
      const request = {
        connectionString: 'postgresql://user:password@localhost:5432/mydb',
        tableNames: ['users', 'orders'],
        projectId: 'project-1',
        datasourceId: 'ds-1',
        name: 'sampled_tables',
      } as SampleTablesRequest;
      const result = await datasourcesClient.sampleDatabaseTables(request);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/database/sample-tables',
        {
          body: {
            connectionString: request.connectionString,
            tableNames: request.tableNames,
            projectId: request.projectId,
            datasourceId: request.datasourceId,
            name: request.name,
          },
        },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('executeSql', () => {
    it('should call the correct endpoint to execute custom SQL', async () => {
      // Mock response data
      const mockResponse = {
        jobs: [
          {
            jobType: 'execute_sql',
            projectId: 'project-1',
            userId: 'user-1',
            parentJobId: null,
            metadata: {},
            payload: {},
          },
        ],
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method with type assertion to handle the interface mismatch
      const request = {
        connectionString: 'postgresql://user:password@localhost:5432/mydb',
        sqlQuery: 'SELECT * FROM users LIMIT 10',
        samplingSqlQuery: 'SELECT * FROM users LIMIT 5',
        projectId: 'project-1',
        datasourceId: 'ds-1',
        name: 'custom_sql_run',
      };
      const result = await datasourcesClient.executeCustomSql(request as any);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/database/execute-custom-sql',
        {
          body: {
            connectionString: request.connectionString,
            sqlQuery: request.sqlQuery,
            samplingSqlQuery: request.samplingSqlQuery,
            projectId: request.projectId,
            datasourceId: request.datasourceId,
            name: request.name,
          },
        },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('validateQuery', () => {
    it('should call the correct endpoint to validate a SQL query', async () => {
      // Mock response data
      const mockResponse = {
        rowCount: 100,
        valid: true,
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method with type assertion to handle the interface mismatch
      const request = {
        connectionString: 'postgresql://user:password@localhost:5432/mydb',
        sqlQuery: 'SELECT * FROM users',
      };
      const result = await datasourcesClient.validateSqlQuery(request as any);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/database/validate-sql-query',
        {
          body: {
            connectionString: request.connectionString,
            sqlQuery: request.sqlQuery,
          },
        },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle invalid SQL queries', async () => {
      // Mock response data for invalid SQL
      const mockResponse = {
        rowCount: 0,
        valid: false,
        message: 'Syntax error in SQL statement',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method with type assertion to handle the interface mismatch
      const request = {
        connectionString: 'postgresql://user:password@localhost:5432/mydb',
        sqlQuery: 'SELECT * FROM non_existent_table',
      };
      const result = await datasourcesClient.validateSqlQuery(request as any);

      // Verify the result indicates an invalid query
      expect(result.data).toEqual(mockResponse);
      expect(result.data?.valid).toBe(false);
    });
  });

  describe('validateSyntax', () => {
    it('should call the correct endpoint to validate SQL syntax', async () => {
      // Mock response data
      const mockResponse = {
        valid: true,
        rowCount: 0,
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method with object parameter
      const request = {
        connectionString: 'postgresql://user:password@localhost:5432/mydb',
        sqlQuery: 'SELECT * FROM users',
      };
      const result = await datasourcesClient.validateSqlSyntax(request);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/database/validate-sql-syntax',
        {
          body: {
            connectionString: request.connectionString,
            sqlQuery: request.sqlQuery,
          },
        },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('extractParameters', () => {
    it('should call the correct endpoint to extract parameters from a SQL query', async () => {
      // Mock response data
      const mockResponse = {
        parameters: [
          {
            type: 'string',
            field: 'status',
            operator: '=',
            value: '',
            displayName: 'status',
          },
          {
            type: 'date',
            field: 'created_at',
            operator: '>',
            value: '',
            displayName: 'start_date',
          },
        ],
        parsedQuery: 'SELECT * FROM users WHERE status = ? AND created_at > ?',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const sqlQuery =
        "SELECT * FROM users WHERE status = '{{status}}' AND created_at > '{{start_date}}'";
      const result = await datasourcesClient.extractSqlParameters(sqlQuery);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/database/extract-sql-parameters',
        {
          body: { sqlQuery: sqlQuery },
        },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle SQL queries with no parameters', async () => {
      // Mock response data for SQL with no parameters
      const mockResponse = {
        parameters: [],
        parsedQuery: 'SELECT * FROM users',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const sqlQuery = 'SELECT * FROM users';
      const result = await datasourcesClient.extractSqlParameters(sqlQuery);

      // Verify the result has no parameters
      expect(result.data).toEqual(mockResponse);
      expect(result.data?.parameters).toHaveLength(0);
    });
  });
});
