import { HttpClient } from '../../src/core/http-client.js';
import { User, ApiKeyResponse, ApiResponse } from '../types/common.js';

export interface ApiKey {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  lastUsed: string | null;
  displayValue?: string;
}

export class AuthClient {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Retrieves the current authenticated user's information.
   * Corresponds to GET /v1/authentication/me
   * @returns {Promise<ApiResponse<User>>} A promise that resolves with the user information.
   */
  async getMe(): Promise<ApiResponse<User>> {
    return await this.httpClient.get<User>('/v1/authentication/me');
  }

  /**
   * Get all API keys for the current user
   * @returns {Promise<ApiKeyResponse<ApiKey[]>>} A promise that resolves with the API response containing an array of API keys.
   * @example
   * const response = await client.auth.getApiKeys();
   * if (response.success) {
   *   console.log('API Keys:', response.data);
   * } else {
   *   console.error('Error getting API keys:', response.error);
   * }
   */
  async getApiKeys(): Promise<ApiKeyResponse<ApiKey[]>> {
    return (await this.httpClient.get<ApiKey[]>(
      '/v1/authentication/api-keys',
    )) as ApiKeyResponse<ApiKey[]>;
  }

  /**
   * Create a new API key
   * @param {string} name - The name for the new API key.
   * @returns {Promise<ApiKeyResponse<[ApiKey, string]>>} A promise that resolves with the API response containing the new API key and the key secret.
   * @example
   * const response = await client.auth.createApiKey('My New Key');
   * if (response.success) {
   *   const [newKey, secret] = response.data; // Note: response.data is a tuple
   *   console.log('New API Key:', newKey);
   *   console.log('Key Secret:', secret); // Store this secret securely
   * } else {
   *   console.error('Error creating API key:', response.error);
   * }
   */
  async createApiKey(name: string): Promise<ApiKeyResponse<[ApiKey, string]>> {
    return (await this.httpClient.post<[ApiKey, string]>(
      '/v1/authentication/api-keys',
      { name },
    )) as ApiKeyResponse<[ApiKey, string]>;
  }

  /**
   * Rename an existing API key
   * @param {string} keyId - The ID of the API key to rename.
   * @param {string} name - The new name for the API key.
   * @returns {Promise<ApiKeyResponse<ApiKey>>} A promise that resolves with the API response containing the updated API key.
   * @example
   * const response = await client.auth.renameApiKey('key-id-123', 'Updated Key Name');
   * if (response.success) {
   *   console.log('Renamed API Key:', response.data);
   * } else {
   *   console.error('Error renaming API key:', response.error);
   * }
   */
  async renameApiKey(
    keyId: string,
    name: string,
  ): Promise<ApiKeyResponse<ApiKey>> {
    return (await this.httpClient.patch<ApiKey>(
      `/v1/authentication/api-keys/${keyId}`,
      { name },
    )) as ApiKeyResponse<ApiKey>;
  }

  /**
   * Enable an existing API key
   * @param {string} keyId - The ID of the API key to enable.
   * @returns {Promise<ApiKeyResponse<ApiKey>>} A promise that resolves with the API response containing the enabled API key.
   * @example
   * const response = await client.auth.enableApiKey('key-id-123');
   * if (response.success) {
   *   console.log('Enabled API Key:', response.data);
   * } else {
   *   console.error('Error enabling API key:', response.error);
   * }
   */
  async enableApiKey(keyId: string): Promise<ApiKeyResponse<ApiKey>> {
    // Assuming empty body for enable/disable based on previous tests
    return (await this.httpClient.patch<ApiKey>(
      `/v1/authentication/api-keys/${keyId}/enable`,
      {},
    )) as ApiKeyResponse<ApiKey>;
  }

  /**
   * Disable an existing API key
   * @param {string} keyId - The ID of the API key to disable.
   * @returns {Promise<ApiKeyResponse<ApiKey>>} A promise that resolves with the API response containing the disabled API key.
   * @example
   * const response = await client.auth.disableApiKey('key-id-123');
   * if (response.success) {
   *   console.log('Disabled API Key:', response.data);
   * } else {
   *   console.error('Error disabling API key:', response.error);
   * }
   */
  async disableApiKey(keyId: string): Promise<ApiKeyResponse<ApiKey>> {
    return (await this.httpClient.patch<ApiKey>(
      `/v1/authentication/api-keys/${keyId}/disable`,
      {},
    )) as ApiKeyResponse<ApiKey>;
  }

  /**
   * Delete an existing API key
   * @param {string} keyId - The ID of the API key to delete.
   * @returns {Promise<ApiResponse<void>>} A promise that resolves with an empty successful API response or an error.
   * @example
   * const response = await client.auth.deleteApiKey('key-id-123');
   * if (response.success) {
   *   console.log('API Key deleted successfully.');
   * } else {
   *   console.error('Error deleting API key:', response.error);
   * }
   */
  async deleteApiKey(keyId: string): Promise<ApiResponse<void>> {
    return await this.httpClient.delete<void>(
      `/v1/authentication/api-keys/${keyId}`,
    );
  }
}
