import { HttpClient } from '../core/http-client.js';
import { ApiResponse } from '../types/common.js';

/**
 * Parameters for creating a Merge link token
 */
export interface CreateLinkTokenParams {
  projectId: string;
  userId: string;
  endUserOriginId: string;
  integrationType: string;
}

/**
 * Response for creating a Merge link token
 */
export interface CreateLinkTokenResponse {
  linkToken: string;
  mergeLink: string;
}

/**
 * Client for handling third-party integrations and connections
 */
export class ConnectClient {
  /**
   * Creates a new ConnectClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Create a Merge link token
   * @param params - Parameters for creating the link token
   * @returns A promise that resolves to an API response containing the link token
   */
  async createLinkToken(
    params: CreateLinkTokenParams,
  ): Promise<ApiResponse<CreateLinkTokenResponse>> {
    return this.httpClient.post<CreateLinkTokenResponse>(
      '/v1/connect/merge/link-token',
      params,
    );
  }
}
