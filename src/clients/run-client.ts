import { HttpClient } from '../core/http-client.js';
import { ApiResponse } from '../types/common.js';
import { ChatMessageCreate } from '../types/chat.js';

/**
 * Parameters for evaluating a query program
 */
export interface EvaluateQueryProgramParams {
  projectId: string;
  queryprogramId: string;
  stream?: boolean;
  [key: string]: any;
}

/**
 * Client for executing published APIs and query programs in the Infactory API
 */
export class RunClient {
  /**
   * Creates a new RunClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Create a chat completion using project APIs as tools
   * @param projectId - The ID of the project
   * @param params - The chat message creation parameters
   * @returns A promise that resolves to a readable stream of the response
   */
  async chatCompletions(
    projectId: string,
    params: ChatMessageCreate,
  ): Promise<ReadableStream<Uint8Array>> {
    const url = `/v1/run/${projectId}/chat/completions`;
    return this.httpClient.createStream(url, {
      url,
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Evaluate a query program
   * @param params - Parameters for evaluating the query program
   * @returns A promise that resolves to an API response containing the evaluation result
   */
  async evaluateQueryProgram(
    params: EvaluateQueryProgramParams,
  ): Promise<ApiResponse<any>> {
    const url = '/v1/run/queryprogram';
    return this.httpClient.post<any>(url, params);
  }
}
