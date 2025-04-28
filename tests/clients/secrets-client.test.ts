import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecretsClient } from '../../src/clients/secrets-client.js';
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

describe('SecretsClient', () => {
  let secretsClient: SecretsClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a new mock HttpClient instance
    mockHttpClient = new HttpClient({
      baseUrl: 'https://api.infactory.ai',
      apiKey: 'test-api-key',
    });

    // Create a new SecretsClient with the mock HttpClient
    secretsClient = new SecretsClient(mockHttpClient);
  });

  // -------------------- Credential Tests --------------------

  describe('getCredentials', () => {
    it('should call the correct endpoint to list credentials', async () => {
      // Mock response data
      const mockCredentials = [
        {
          id: 'credential-1',
          name: 'Credential 1',
          type: 'aws',
          organizationId: 'org-1',
          config: { key: 'value1' },
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'credential-2',
          name: 'Credential 2',
          type: 'gcp',
          organizationId: 'org-1',
          config: { key: 'value2' },
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockCredentials,
      });

      // Call the method
      const result = await secretsClient.getCredentials();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/credentials');

      // Verify the result
      expect(result.data).toEqual(mockCredentials);
    });

    it('should handle errors when listing credentials', async () => {
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
      const result = await secretsClient.getCredentials();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/credentials');

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getProjectCredentials', () => {
    it('should call the correct endpoint to get project credentials', async () => {
      // Mock response data
      const mockCredentials = [
        {
          id: 'credential-1',
          name: 'Credential 1',
          type: 'aws',
          organizationId: 'org-1',
          config: { key: 'value1' },
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockCredentials,
      });

      // Call the method
      const result = await secretsClient.getProjectCredentials('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/projects/project-1/credentials',
      );

      // Verify the result
      expect(result.data).toEqual(mockCredentials);
    });

    it('should validate projectId is provided', async () => {
      // Call without projectId
      await expect(secretsClient.getProjectCredentials('')).rejects.toThrow(
        'Project ID is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('getCredential', () => {
    it('should call the correct endpoint to get a credential by ID', async () => {
      // Mock response data
      const mockCredential = {
        id: 'credential-1',
        name: 'Credential 1',
        type: 'aws',
        organizationId: 'org-1',
        config: { key: 'value1' },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockCredential,
      });

      // Call the method
      const result = await secretsClient.getCredential('credential-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/credentials/credential-1',
      );

      // Verify the result
      expect(result.data).toEqual(mockCredential);
    });

    it('should validate credentialId is provided', async () => {
      // Call without credentialId
      await expect(secretsClient.getCredential('')).rejects.toThrow(
        'Credential ID is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('createCredential', () => {
    it('should call the correct endpoint to create a credential', async () => {
      // Mock request data
      const createParams = {
        name: 'New Credential',
        type: 'aws',
        organizationId: 'org-1',
        config: { accessKey: 'key', secretKey: 'secret' },
      };

      // Mock response data
      const mockResponse = {
        id: 'new-credential',
        name: 'New Credential',
        type: 'aws',
        organizationId: 'org-1',
        config: { accessKey: 'key', secretKey: 'secret' },
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await secretsClient.createCredential(createParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/credentials',
        createParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should validate name is provided', async () => {
      // Call without name
      await expect(
        secretsClient.createCredential({
          name: '',
          type: 'aws',
          organizationId: 'org-1',
          config: {},
        }),
      ).rejects.toThrow('Credential name is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should validate organizationId is provided', async () => {
      // Call without organizationId
      await expect(
        secretsClient.createCredential({
          name: 'New Credential',
          type: 'aws',
          organizationId: '',
          config: {},
        }),
      ).rejects.toThrow('Organization ID is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should validate type is provided', async () => {
      // Call without type
      await expect(
        secretsClient.createCredential({
          name: 'New Credential',
          type: '',
          organizationId: 'org-1',
          config: {},
        }),
      ).rejects.toThrow('Credential type is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });

  describe('updateCredential', () => {
    it('should call the correct endpoint to update a credential', async () => {
      // Mock request data
      const updateParams = {
        name: 'Updated Credential',
        config: { accessKey: 'newKey' },
      };

      // Mock response data
      const mockResponse = {
        id: 'credential-1',
        name: 'Updated Credential',
        type: 'aws',
        organizationId: 'org-1',
        config: { accessKey: 'newKey' },
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await secretsClient.updateCredential(
        'credential-1',
        updateParams,
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/credentials/credential-1',
        updateParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should validate credentialId is provided', async () => {
      // Call without credentialId
      await expect(
        secretsClient.updateCredential('', { name: 'Updated Credential' }),
      ).rejects.toThrow('Credential ID is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.patch).not.toHaveBeenCalled();
    });
  });

  describe('deleteCredential', () => {
    it('should call the correct endpoint to delete a credential', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method
      const result = await secretsClient.deleteCredential('credential-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/v1/credentials/credential-1',
      );

      // Verify the result has no error
      expect(result.error).toBeUndefined();
    });

    it('should validate credentialId is provided', async () => {
      // Call without credentialId
      await expect(secretsClient.deleteCredential('')).rejects.toThrow(
        'Credential ID is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.delete).not.toHaveBeenCalled();
    });
  });

  // -------------------- Secret Tests --------------------

  describe('getSecrets', () => {
    it('should call the correct endpoint to list secrets', async () => {
      // Mock response data
      const mockSecrets = [
        {
          id: 'secret-1',
          name: 'Secret 1',
          teamId: 'team-1',
          value: 'value1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'secret-2',
          name: 'Secret 2',
          teamId: 'team-1',
          value: 'value2',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockSecrets,
      });

      // Call the method
      const result = await secretsClient.getSecrets();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/secrets');

      // Verify the result
      expect(result.data).toEqual(mockSecrets);
    });

    it('should handle errors when listing secrets', async () => {
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
      const result = await secretsClient.getSecrets();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/secrets');

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getProjectSecrets', () => {
    it('should call the correct endpoint to get project secrets', async () => {
      // Mock response data
      const mockSecrets = [
        {
          id: 'secret-1',
          name: 'Secret 1',
          teamId: 'team-1',
          value: 'value1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockSecrets,
      });

      // Call the method
      const result = await secretsClient.getProjectSecrets('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/projects/project-1/secrets',
      );

      // Verify the result
      expect(result.data).toEqual(mockSecrets);
    });

    it('should validate projectId is provided', async () => {
      // Call without projectId
      await expect(secretsClient.getProjectSecrets('')).rejects.toThrow(
        'Project ID is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('getSecret', () => {
    it('should call the correct endpoint to get a secret by ID', async () => {
      // Mock response data
      const mockSecret = {
        id: 'secret-1',
        name: 'Secret 1',
        teamId: 'team-1',
        value: 'value1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockSecret,
      });

      // Call the method
      const result = await secretsClient.getSecret('team-1', 'secret-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/secrets/team-1/secret-1',
      );

      // Verify the result
      expect(result.data).toEqual(mockSecret);
    });

    it('should validate parameters are provided', async () => {
      // Call without teamId
      await expect(secretsClient.getSecret('', 'secret-1')).rejects.toThrow(
        'Team ID is required',
      );

      // Call without key/secretId
      await expect(secretsClient.getSecret('team-1', '')).rejects.toThrow(
        'Secret key/ID is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('createSecret', () => {
    it('should call the correct endpoint to create a secret', async () => {
      // Mock request data
      const createParams = {
        name: 'New Secret',
        teamId: 'team-1',
        value: 'secret-value',
      };

      // Mock response data
      const mockResponse = {
        id: 'new-secret',
        name: 'New Secret',
        teamId: 'team-1',
        value: 'secret-value',
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await secretsClient.createSecret(createParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/secrets/team-1', {
        name: 'New Secret',
        value: 'secret-value',
      });

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should validate name is provided', async () => {
      // Call without name
      await expect(
        secretsClient.createSecret({
          name: '',
          teamId: 'team-1',
          value: 'secret-value',
        }),
      ).rejects.toThrow('Secret name is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should validate teamId is provided', async () => {
      // Call without teamId
      await expect(
        secretsClient.createSecret({
          name: 'New Secret',
          teamId: '',
          value: 'secret-value',
        }),
      ).rejects.toThrow('Team ID is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should validate value is provided', async () => {
      // Call without value
      await expect(
        secretsClient.createSecret({
          name: 'New Secret',
          teamId: 'team-1',
          value: '',
        }),
      ).rejects.toThrow('Secret value is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });

  describe('updateSecret', () => {
    it('should call the correct endpoint to update a secret', async () => {
      // Mock request data
      const updateParams = {
        name: 'Updated Secret',
        value: 'new-value',
      };

      // Mock response data
      const mockResponse = {
        id: 'secret-1',
        name: 'Updated Secret',
        teamId: 'team-1',
        value: 'new-value',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await secretsClient.updateSecret(
        'team-1',
        'secret-1',
        updateParams,
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/secrets/team-1/secret-1',
        updateParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should validate parameters are provided', async () => {
      // Call without teamId
      await expect(
        secretsClient.updateSecret('', 'secret-1', { name: 'Updated Secret' }),
      ).rejects.toThrow('Team ID is required');

      // Call without secretId/key
      await expect(
        secretsClient.updateSecret('team-1', '', { name: 'Updated Secret' }),
      ).rejects.toThrow('Secret key/ID is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.patch).not.toHaveBeenCalled();
    });
  });

  describe('deleteSecret', () => {
    it('should call the correct endpoint to delete a secret', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method
      const result = await secretsClient.deleteSecret('team-1', 'secret-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/v1/secrets/team-1/secret-1',
      );

      // Verify the result has no error
      expect(result.error).toBeUndefined();
    });

    it('should validate parameters are provided', async () => {
      // Call without teamId
      await expect(secretsClient.deleteSecret('', 'secret-1')).rejects.toThrow(
        'Team ID is required',
      );

      // Call without secretId/key
      await expect(secretsClient.deleteSecret('team-1', '')).rejects.toThrow(
        'Secret key/ID is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.delete).not.toHaveBeenCalled();
    });
  });
});
