import { describe, expect, it, vi, beforeEach, Mock } from 'vitest';
import { ActionsClient } from '../../src/clients/actions-client.js';
import { DatasourcesClient } from '../../src/clients/datasources-client.js';
import { IntegrationsClient } from '../../src/clients/integrations-client.js';
import { ConnectDatasourceParams } from '../../src/types/common.js';

describe('ActionsClient', () => {
  let datasourcesClient: {
    createDatasource: Mock;
    testDatabaseConnection: Mock;
  };
  let integrationsClient: {
    testHttpConnection: Mock;
  };
  let actionsClient: ActionsClient;

  beforeEach(() => {
    // Create mock clients
    datasourcesClient = {
      createDatasource: vi.fn(),
      testDatabaseConnection: vi.fn(),
    };
    integrationsClient = {
      testHttpConnection: vi.fn(),
    };

    // Initialize the ActionsClient with mocked dependencies
    actionsClient = new ActionsClient(
      datasourcesClient as unknown as DatasourcesClient,
      integrationsClient as unknown as IntegrationsClient,
    );
  });

  describe('connect', () => {
    it('should validate required parameters', async () => {
      const result = await actionsClient.connect({} as ConnectDatasourceParams);
      expect(result.error).toBeDefined();
      expect(result.error?.status).toBe(400);
      expect(result.error?.code).toBe('validation_error');
    });

    it('should create a datasource with minimal parameters', async () => {
      // Setup mock response
      datasourcesClient.createDatasource.mockResolvedValue({
        data: { id: 'ds-123', name: 'Test Datasource', type: 'csv' },
      });

      // Call the connect method
      const result = await actionsClient.connect({
        projectId: 'proj-123',
        name: 'Test Datasource',
        type: 'csv',
      });

      // Assertions
      expect(datasourcesClient.createDatasource).toHaveBeenCalledWith({
        projectId: 'proj-123',
        name: 'Test Datasource',
        type: 'csv',
        status: 'created',
      });
      expect(result.data).toBeDefined();
      expect(result.data?.datasource).toEqual({
        id: 'ds-123',
        name: 'Test Datasource',
        type: 'csv',
      });
      expect(result.data?.testResult).toBeDefined();
      expect(result.data?.testResult?.message).toContain(
        'CSV datasource created',
      );
    });

    it('should test database connections when appropriate', async () => {
      // Setup mock responses
      datasourcesClient.createDatasource.mockResolvedValue({
        data: { id: 'ds-456', name: 'Test DB', type: 'database' },
      });
      datasourcesClient.testDatabaseConnection.mockResolvedValue({
        data: { success: true, tables: [{ name: 'users' }] },
      });

      // Call the connect method with database params
      const result = await actionsClient.connect({
        projectId: 'proj-123',
        name: 'Test DB',
        type: 'database',
        uri: 'postgresql://localhost:5432/test',
      });

      // Assertions
      expect(datasourcesClient.createDatasource).toHaveBeenCalled();
      expect(datasourcesClient.testDatabaseConnection).toHaveBeenCalledWith(
        'postgresql://localhost:5432/test',
      );
      expect(result.data?.testResult?.success).toBe(true);
    });

    it('should handle datasource creation failure', async () => {
      // Setup mock responses
      datasourcesClient.createDatasource.mockResolvedValue({
        error: { status: 500, message: 'Internal Server Error' },
      });

      // Call the connect method
      const result = await actionsClient.connect({
        projectId: 'proj-123',
        name: 'Test Datasource',
        type: 'csv',
      });

      // Assertions
      expect(datasourcesClient.createDatasource).toHaveBeenCalled();
      expect(result.error).toBeDefined();
      expect(result.data).toBeUndefined();
    });

    it('should handle connection test failure but still return the datasource', async () => {
      // Setup mock responses
      datasourcesClient.createDatasource.mockResolvedValue({
        data: { id: 'ds-456', name: 'Test DB', type: 'database' },
      });
      datasourcesClient.testDatabaseConnection.mockResolvedValue({
        error: { status: 400, message: 'Connection refused' },
      });

      // Call the connect method
      const result = await actionsClient.connect({
        projectId: 'proj-123',
        name: 'Test DB',
        type: 'database',
        uri: 'postgresql://localhost:5432/nonexistent',
      });

      // Assertions
      expect(datasourcesClient.createDatasource).toHaveBeenCalled();
      expect(datasourcesClient.testDatabaseConnection).toHaveBeenCalled();
      expect(result.data?.datasource).toBeDefined();
      expect(result.data?.testResult?.success).toBe(false);
    });
  });
});
