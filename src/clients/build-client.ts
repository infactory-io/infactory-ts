import { HttpClient } from '../core/http-client.js';
import { ApiResponse } from '../types/common.js';
import { QueryProgram, CreateQueryProgramParams } from '../types/common.js';

/**
 * Parameters for creating cues
 */
export interface CreateCuesParams {
  projectId: string;
  previousQuestions: string[];
  count: number;
  guidance?: string;
}

/**
 * Client for building and generating assets in the Infactory API
 */
export class BuildClient {
  /**
   * Creates a new BuildClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Create a new query program
   * @param params - Parameters for creating the query program
   * @returns A promise that resolves to an API response containing the created query program
   */
  async createQueryProgram(
    params: CreateQueryProgramParams,
  ): Promise<ApiResponse<QueryProgram>> {
    return this.httpClient.post<QueryProgram>(
      '/v1/build/query_program',
      params,
    );
  }

  /**
   * Create cues for a query program
   * @param params - Parameters for creating cues
   * @returns A promise that resolves to an API response
   */
  async createCues(params: CreateCuesParams): Promise<ApiResponse<any>> {
    return this.httpClient.post<any>('/v1/build/cues', params);
  }
}
