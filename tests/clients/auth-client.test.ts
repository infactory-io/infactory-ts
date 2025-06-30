import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';
import { HttpClient } from '../../src/core/http-client.js';
import { AuthClient } from '../../src/clients/auth-client.js';
import { InfactoryAPIError } from '../../src/errors/index.js';
import { ApiKeyResponse } from '@/types/common.js';

// Define ApiKey locally if not exported from auth-client
interface ApiKey {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  userId: string;
  status: 'active' | 'inactive';
  apiKey?: string; // Only present on creation
}

// Mock HttpClient
vi.mock('../../src/core/http-client.js');

describe('AuthClient', () => {
  let httpClientMock: Mocked<HttpClient>;
  let authClient: AuthClient;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create a fully mocked HttpClient instance
    // Pass dummy options as the instance itself is mocked
    const actualHttpClient = new HttpClient({
      apiKey: 'dummy',
      baseUrl: 'dummy',
    });
    httpClientMock = vi.mocked(actualHttpClient, true); // true for deep mocking

    authClient = new AuthClient(httpClientMock);
    vi.clearAllMocks(); // Explicitly use vi.
  });

  // --- Test Data ---
  const mockApiKey: ApiKey = {
    id: 'key_123',
    name: 'Test Key',
    createdAt: '2023-01-01T00:00:00Z',
    lastUsedAt: null,
    userId: 'user_abc',
    status: 'active',
  };

  const mockApiKeys: ApiKey[] = [mockApiKey];
  // Correctly instantiate InfactoryAPIError with status, code, and message
  const mockError: InfactoryAPIError = new InfactoryAPIError(
    400,
    'BAD_REQUEST',
    'Bad Request',
  );

  // --- Get API Keys ---
  describe('getApiKeys', () => {
    it('should call httpClient.get and return a successful response', async () => {
      const mockResponse: ApiKeyResponse<ApiKey[]> = {
        success: true,
        data: mockApiKeys,
      };
      httpClientMock.get.mockResolvedValue(mockResponse);

      const result = await authClient.getApiKeys();

      expect(httpClientMock.get).toHaveBeenCalledOnce();
      expect(httpClientMock.get).toHaveBeenCalledWith(
        '/v1/authentication/api-keys',
      );
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.data).toBe(mockApiKeys);
    });

    it('should return an error response if httpClient.get fails', async () => {
      const mockResponse: ApiKeyResponse<ApiKey[]> = {
        success: false,
        error: mockError,
      };
      httpClientMock.get.mockResolvedValue(mockResponse);

      const result = await authClient.getApiKeys();

      expect(httpClientMock.get).toHaveBeenCalledOnce();
      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError);
    });
  });

  // --- Create API Key ---
  describe('createApiKey', () => {
    it('should call httpClient.post and return a successful response', async () => {
      const keyName = 'New Key';
      const secret = 'nf-secret123';
      const mockCreatedKey: ApiKey = {
        ...mockApiKey,
        name: keyName,
        id: 'key_456',
        apiKey: secret,
      };
      const mockResponse: ApiKeyResponse<[ApiKey, string]> = {
        success: true,
        data: [mockCreatedKey, secret],
      };
      httpClientMock.post.mockResolvedValue(mockResponse);

      const result = await authClient.createApiKey(keyName);

      expect(httpClientMock.post).toHaveBeenCalledOnce();
      // Ensure the endpoint and payload are correct
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/v1/authentication/api-key',
        { name: keyName },
      );
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.data).toEqual([mockCreatedKey, secret]);
    });

    it('should return an error response if httpClient.post fails', async () => {
      const mockResponse: ApiKeyResponse<[ApiKey, string]> = {
        success: false,
        error: mockError,
      };
      httpClientMock.post.mockResolvedValue(mockResponse);

      const result = await authClient.createApiKey('Fail Key');

      expect(httpClientMock.post).toHaveBeenCalledOnce();
      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError);
    });
  });

  // --- Rename API Key ---
  describe('renameApiKey', () => {
    it('should call httpClient.patch and return a successful response', async () => {
      const keyId = 'key_123';
      const newName = 'Renamed Key';
      const mockRenamedKey: ApiKey = { ...mockApiKey, name: newName };
      const mockResponse: ApiKeyResponse<ApiKey> = {
        success: true,
        data: mockRenamedKey,
      };
      httpClientMock.patch.mockResolvedValue(mockResponse);

      const result = await authClient.renameApiKey(keyId, newName);

      expect(httpClientMock.patch).toHaveBeenCalledOnce();
      expect(httpClientMock.patch).toHaveBeenCalledWith(
        `/v1/authentication/api-key/${keyId}`,
        { name: newName },
      );
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.data).toBe(mockRenamedKey);
    });

    it('should return an error response if httpClient.patch fails', async () => {
      const mockResponse: ApiKeyResponse<ApiKey> = {
        success: false,
        error: mockError,
      };
      httpClientMock.patch.mockResolvedValue(mockResponse);

      const result = await authClient.renameApiKey('key_123', 'Fail Rename');

      expect(httpClientMock.patch).toHaveBeenCalledOnce();
      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError);
    });
  });

  // --- Enable API Key ---
  describe('enableApiKey', () => {
    it('should call httpClient.patch and return a successful response', async () => {
      const keyId = 'key_123';
      const mockEnabledKey: ApiKey = { ...mockApiKey, status: 'active' };
      const mockResponse: ApiKeyResponse<ApiKey> = {
        success: true,
        data: mockEnabledKey,
      };
      httpClientMock.patch.mockResolvedValue(mockResponse);

      const result = await authClient.enableApiKey(keyId);

      expect(httpClientMock.patch).toHaveBeenCalledOnce();
      expect(httpClientMock.patch).toHaveBeenCalledWith(
        `/v1/authentication/api-key/${keyId}/enable`,
        {},
      );
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.data).toBe(mockEnabledKey);
    });

    it('should return an error response if httpClient.patch fails', async () => {
      const mockResponse: ApiKeyResponse<ApiKey> = {
        success: false,
        error: mockError,
      };
      httpClientMock.patch.mockResolvedValue(mockResponse);

      const result = await authClient.enableApiKey('key_123');

      expect(httpClientMock.patch).toHaveBeenCalledOnce();
      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError);
    });
  });

  // --- Disable API Key ---
  describe('disableApiKey', () => {
    it('should call httpClient.patch and return a successful response', async () => {
      const keyId = 'key_123';
      const mockDisabledKey: ApiKey = { ...mockApiKey, status: 'inactive' };
      const mockResponse: ApiKeyResponse<ApiKey> = {
        success: true,
        data: mockDisabledKey,
      };
      httpClientMock.patch.mockResolvedValue(mockResponse);

      const result = await authClient.disableApiKey(keyId);

      expect(httpClientMock.patch).toHaveBeenCalledOnce();
      expect(httpClientMock.patch).toHaveBeenCalledWith(
        `/v1/authentication/api-key/${keyId}/disable`,
        {},
      );
      expect(result).toEqual(mockResponse);
      expect(result.success).toBe(true);
      expect(result.data).toBe(mockDisabledKey);
    });

    it('should return an error response if httpClient.patch fails', async () => {
      const mockResponse: ApiKeyResponse<ApiKey> = {
        success: false,
        error: mockError,
      };
      httpClientMock.patch.mockResolvedValue(mockResponse);

      const result = await authClient.disableApiKey('key_123');

      expect(httpClientMock.patch).toHaveBeenCalledOnce();
      expect(result.success).toBe(false);
      expect(result.error).toBe(mockError);
    });
  });

  // --- Delete API Key ---
  describe('deleteApiKey', () => {
    it('should call httpClient.delete and return a successful response', async () => {
      const keyId = 'key_123';
      const mockResponse: ApiKeyResponse<void> = { success: true };
      httpClientMock.delete.mockResolvedValue(mockResponse);

      const result = await authClient.deleteApiKey(keyId);

      expect(httpClientMock.delete).toHaveBeenCalledOnce();
      expect(httpClientMock.delete).toHaveBeenCalledWith(
        `/v1/authentication/api-key/${keyId}`,
      );
      expect(result).toEqual(mockResponse);
      expect(result.data).toBeUndefined();
    });

    it('should return an error response if httpClient.delete fails', async () => {
      const mockResponse: ApiKeyResponse<void> = {
        success: false,
        error: mockError,
      };
      httpClientMock.delete.mockResolvedValue(mockResponse);

      const result = await authClient.deleteApiKey('key_123');

      expect(httpClientMock.delete).toHaveBeenCalledOnce();
      expect(result.error).toBe(mockError);
    });
  });
});
