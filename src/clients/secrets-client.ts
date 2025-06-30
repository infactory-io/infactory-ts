import { HttpClient } from '../core/http-client.js';
import {
  ApiResponse,
  Credential,
  Secret,
  CreateCredentialParams,
  CreateSecretParams,
} from '../types/common.js';

/**
 * Client for managing secrets and credentials in the Infactory API
 */
export class SecretsClient {
  /**
   * Creates a new SecretsClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  // -------------------- Credential Methods --------------------

  /**
   * Get all credentials
   * @returns A promise that resolves to an API response containing an array of credentials
   */
  async getCredentials(): Promise<ApiResponse<Credential[]>> {
    return await this.httpClient.get<Credential[]>('/v1/credentials');
  }

  /**
   * Get credentials for a specific project
   * @param projectId - The ID of the project to get credentials for
   * @returns A promise that resolves to an API response containing an array of credentials
   */
  async getProjectCredentials(
    projectId: string,
  ): Promise<ApiResponse<Credential[]>> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    return await this.httpClient.get<Credential[]>(
      `/v1/projects/${projectId}/credentials`,
    );
  }

  /**
   * Get a specific credential by ID
   * @param credentialId - The ID of the credential to retrieve
   * @returns A promise that resolves to an API response containing the credential
   */
  async getCredential(credentialId: string): Promise<ApiResponse<Credential>> {
    if (!credentialId) {
      throw new Error('Credential ID is required');
    }
    return await this.httpClient.get<Credential>(
      `/v1/credentials/${credentialId}`,
    );
  }

  /**
   * Create a new credential
   * @param params - Parameters for creating the credential
   * @returns A promise that resolves to an API response containing the created credential
   */
  async createCredential(
    params: CreateCredentialParams,
  ): Promise<ApiResponse<Credential>> {
    if (!params.name || params.name === '') {
      throw new Error('Credential name is required');
    }
    if (!params.organizationId) {
      throw new Error('Organization ID is required');
    }
    if (!params.type) {
      throw new Error('Credential type is required');
    }

    return await this.httpClient.post<Credential>('/v1/credentials', params);
  }

  /**
   * Update an existing credential
   * @param credentialId - The ID of the credential to update
   * @param params - Parameters for updating the credential
   * @returns A promise that resolves to an API response containing the updated credential
   */
  async updateCredential(
    credentialId: string,
    params: Partial<CreateCredentialParams>,
  ): Promise<ApiResponse<Credential>> {
    if (!credentialId) {
      throw new Error('Credential ID is required');
    }

    return await this.httpClient.patch<Credential>(
      `/v1/credentials/${credentialId}`,
      params,
    );
  }

  /**
   * Delete a credential
   * @param credentialId - The ID of the credential to delete
   * @returns A promise that resolves to an API response
   */
  async deleteCredential(credentialId: string): Promise<ApiResponse<void>> {
    if (!credentialId) {
      throw new Error('Credential ID is required');
    }

    return await this.httpClient.delete<void>(
      `/v1/credentials/${credentialId}`,
    );
  }

  // -------------------- Secret Methods --------------------

  /**
   * Get secrets for a team
   * @param teamId - Optional team ID to filter secrets
   * @param type - Optional secret type to filter by
   * @returns A promise that resolves to an API response containing an array of secrets
   */
  async getSecrets(
    teamId?: string,
    type?: string,
  ): Promise<ApiResponse<Secret[]>> {
    if (teamId) {
      const queryParams = type ? `?type=${type}` : '';
      return await this.httpClient.get<Secret[]>(
        `/v1/secrets/${teamId}${queryParams}`,
      );
    }
    // Fallback for backward compatibility or getting all secrets across teams
    return await this.httpClient.get<Secret[]>('/v1/secrets');
  }

  /**
   * Get secrets for a specific project
   * @param projectId - The ID of the project to get secrets for
   * @returns A promise that resolves to an API response containing an array of secrets
   */
  async getProjectSecrets(projectId: string): Promise<ApiResponse<Secret[]>> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    return await this.httpClient.get<Secret[]>(
      `/v1/projects/${projectId}/secrets`,
    );
  }

  /**
   * Get a specific secret by ID
   * @param teamId - The ID of the team the secret belongs to
   * @param key - The key (or ID) of the secret to retrieve
   * @returns A promise that resolves to an API response containing the secret
   */
  async getSecret(teamId: string, key: string): Promise<ApiResponse<Secret>> {
    if (!teamId) {
      throw new Error('Team ID is required');
    }
    if (!key) {
      throw new Error('Secret key/ID is required');
    }
    return await this.httpClient.get<Secret>(`/v1/secrets/${teamId}/${key}`);
  }

  /**
   * Create a new secret
   * @param params - Parameters for creating the secret
   * @returns A promise that resolves to an API response containing the created secret
   */
  async createSecret(params: CreateSecretParams): Promise<ApiResponse<Secret>> {
    if (!params.name || params.name === '') {
      throw new Error('Secret name is required');
    }
    if (!params.teamId) {
      throw new Error('Team ID is required');
    }
    if (!params.value) {
      throw new Error('Secret value is required');
    }

    // Extract teamId for URL path and remove it from the request body
    const { teamId, ...bodyParams } = params;

    return await this.httpClient.post<Secret>(
      `/v1/secrets/${teamId}`,
      bodyParams,
    );
  }

  /**
   * Update an existing secret
   * @param teamId - The team ID the secret belongs to
   * @param key - The key/ID of the secret to update
   * @param params - Parameters for updating the secret
   * @returns A promise that resolves to an API response containing the updated secret
   */
  async updateSecret(
    teamId: string,
    key: string,
    params: Partial<CreateSecretParams>,
  ): Promise<ApiResponse<Secret>> {
    if (!teamId) {
      throw new Error('Team ID is required');
    }
    if (!key) {
      throw new Error('Secret key/ID is required');
    }

    // Ensure teamId isn't included in params to avoid duplication
    const { teamId: _, ...bodyParams } = params as any;

    return await this.httpClient.patch<Secret>(
      `/v1/secrets/${teamId}/${key}`,
      bodyParams,
    );
  }

  /**
   * Delete a secret
   * @param teamId - The team ID the secret belongs to
   * @param key - The key/ID of the secret to delete
   * @returns A promise that resolves to an API response
   */
  async deleteSecret(teamId: string, key: string): Promise<ApiResponse<void>> {
    if (!teamId) {
      throw new Error('Team ID is required');
    }
    if (!key) {
      throw new Error('Secret key/ID is required');
    }

    return await this.httpClient.delete<void>(`/v1/secrets/${teamId}/${key}`);
  }
}
