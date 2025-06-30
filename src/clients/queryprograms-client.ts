import { HttpClient } from '../core/http-client.js';
import { ApiResponse, Graph } from '../types/common.js';
import {
  QueryProgram,
  CreateQueryProgramParams,
  QueryResponse,
  PaginationParams,
} from '../types/common.js';

/**
 * Client for managing query programs in the Infactory API
 */
export class QueryProgramsClient {
  /**
   * Creates a new QueryProgramsClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * List all query programs for a project
   * @param params - Optional pagination parameters
   * @returns A promise that resolves to an API response containing an array of query programs
   */
  async listQueryPrograms(
    params?: PaginationParams & { projectId: string },
  ): Promise<ApiResponse<QueryProgram[]>> {
    return await this.httpClient.get<QueryProgram[]>(
      `/v1/queryprograms`,
      params,
    );
  }

  /**
   * Get a specific query program by ID
   * @param id - The ID of the query program to retrieve
   * @returns A promise that resolves to an API response containing the query program
   */
  async getQueryProgram(id: string): Promise<ApiResponse<QueryProgram>> {
    return await this.httpClient.get<QueryProgram>(`/v1/queryprograms/${id}`);
  }

  /**
   * Create a new query program
   * @param params - Parameters for creating the query program
   * @returns A promise that resolves to an API response containing the created query program
   */
  async createQueryProgram(
    params: CreateQueryProgramParams,
  ): Promise<ApiResponse<QueryProgram>> {
    return await this.httpClient.post<QueryProgram>(
      '/v1/queryprograms',
      params,
    );
  }

  /**
   * Update an existing query program
   * @param id - The ID of the query program to update
   * @param params - Parameters for updating the query program
   * @returns A promise that resolves to an API response containing the updated query program
   */
  async updateQueryProgram(
    id: string,
    params: Partial<CreateQueryProgramParams>,
  ): Promise<ApiResponse<QueryProgram>> {
    return await this.httpClient.patch<QueryProgram>(
      `/v1/queryprograms/${id}`,
      params,
    );
  }

  /**
   * Delete a query program
   * @param id - The ID of the query program to delete
   * @param permanent - Whether to permanently delete the query program (default: false)
   * @returns A promise that resolves to an API response with the deletion result
   */
  async deleteQueryProgram(
    id: string,
    permanent: boolean = false,
  ): Promise<ApiResponse<void>> {
    return await this.httpClient.delete<void>(`/v1/queryprograms/${id}`, {
      permanent: permanent,
    });
  }

  // /**
  //  * Execute a query program synchronously (replacement for executeQueryProgram)
  //  * @param queryProgramId - The ID of the query program to execute
  //  * @param inputData - Optional input data for the query program (currently unused)
  //  * @returns A promise that resolves to an API response containing the query result
  //  */
  // async executeQueryProgram(
  //   queryProgramId: string,
  //   // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   inputData?: Record<string, any>,
  // ): Promise<ApiResponse<QueryResponse> | ReadableStream<any>> {
  //   // This method now uses evaluateQueryProgramSync internally
  //   // since the original executeQueryProgram endpoint is returning 404 errors

  //   // Note: inputData is currently not used because evaluateQueryProgramSync doesn't support it
  //   // We need to extract the project ID from the query program ID
  //   // For now, we'll use the queryProgramId for both parameters
  //   // This should be updated when the proper project ID is available
  //   return await this.evaluateQueryProgramSync(queryProgramId, queryProgramId);
  // }

  // /**
  //  * Execute a query program with streaming response
  //  * @param id - The ID of the query program to execute
  //  * @param params - Optional parameters for streaming execution
  //  * @returns A promise that resolves to a readable stream of execution events
  //  */
  // async executeQueryProgramStream(
  //   id: string,
  //   params?: Record<string, any>,
  // ): Promise<ReadableStream<Uint8Array>> {
  //   return await this.httpClient.createStream(
  //     `/v1/queryprograms/${id}/execute`,
  //     {
  //       url: `/v1/queryprograms/${id}/execute`,
  //       method: 'POST',
  //       jsonBody: params || {},
  //       headers: {
  //         Accept: 'text/event-stream',
  //       },
  //     },
  //   );
  // }

  /**
   * Validate a query program without executing it
   * @param params - Parameters of the query program to validate
   * @returns A promise that resolves to an API response with validation results
   */
  async validateQueryProgram(
    params: CreateQueryProgramParams,
  ): Promise<ApiResponse<{ valid: boolean; errors?: string[] }>> {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value != null),
    );
    return await this.httpClient.post<{ valid: boolean; errors?: string[] }>(
      '/v1/queryprograms/validate',
      filteredParams,
    );
  }

  /**
   * Get execution history for a query program
   * @param id - The ID of the query program
   * @param params - Optional pagination and date filter parameters
   * @returns A promise that resolves to an API response containing the execution history
   */
  async getQueryProgramHistory(
    id: string,
    params?: PaginationParams & { start_date?: string; end_date?: string },
  ): Promise<ApiResponse<QueryResponse[]>> {
    return await this.httpClient.get<QueryResponse[]>(
      `/v1/queryprograms/${id}/history`,
      {
        params: params,
      },
    );
  }

  /**
   * Create a model from a query program
   * @param queryProgramId - The ID of the query program
   * @returns A promise that resolves to an API response containing the updated query program
   */
  async createQueryProgramModel(
    queryProgramId: string,
  ): Promise<ApiResponse<QueryProgram>> {
    return await this.httpClient.post<QueryProgram>(
      `/v1/queryprograms/${queryProgramId}/create-model`,
    );
  }

  /**
   * Publish a query program, making it available for API endpoints
   * @param id - The ID of the query program to publish
   * @param groupSlots - Whether to group slots in the published query program
   * @returns A promise that resolves to an API response containing the published query program
   */
  async publishQueryProgram(
    id: string,
    groupSlots: boolean = false,
  ): Promise<ApiResponse<QueryProgram>> {
    return await this.httpClient.patch<QueryProgram>(
      `/v1/queryprograms/${id}/publish`,
      { group_slots: groupSlots },
    );
  }

  /**
   * Unpublish a query program
   * @param id - The ID of the query program to unpublish
   * @returns A promise that resolves to an API response containing the unpublished query program
   */
  async unpublishQueryProgram(id: string): Promise<ApiResponse<QueryProgram>> {
    return await this.httpClient.patch<QueryProgram>(
      `/v1/queryprograms/${id}/unpublish`,
    );
  }

  /**
   * Evaluate a query program with streaming response
   * @param projectId - The ID of the project
   * @param queryprogramId - The ID of the query program to evaluate
   * @returns A promise that resolves to a readable stream of evaluation events
   */
  async evaluateQueryProgram(
    projectId: string,
    queryprogramId: string,
    params?: Record<string, any>,
  ): Promise<ReadableStream<Uint8Array>> {
    params = params || {};
    let url = '/v1/run/queryprogram';
    const query_params = new URLSearchParams(params).toString();
    if (query_params) {
      url = `${url}?${query_params}`;
    }

    return await this.httpClient.createStream(url, {
      url: url,
      method: 'POST',
      jsonBody: {
        projectId,
        queryprogramId,
        stream: true, // Explicitly set streaming to true
      },
      headers: {
        Accept: 'text/event-stream',
      },
    });
  }

  /**
   * Evaluate a query program with non-streaming response
   * @param projectId - The ID of the project
   * @param queryprogramId - The ID of the query program to evaluate
   * @returns A promise that resolves to an API response containing the evaluation result
   */
  async evaluateQueryProgramSync(
    projectId: string,
    queryprogramId: string,
    params?: Record<string, any>,
  ): Promise<ApiResponse<any>> {
    params = params || {};
    let url = '/v1/run/queryprogram';
    const query_params = new URLSearchParams(params).toString();
    if (query_params) {
      url = `${url}?${query_params}`;
    }
    return await this.httpClient.post<any>(
      url,
      {
        projectId,
        queryprogramId,
        stream: false, // Explicitly set streaming to false
      },
      params,
    );
  }

  /**
   * Analyze a query program to get its graph representation
   * @param projectId - The ID of the project
   * @param queryprogramId - The ID of the query program to analyze
   * @returns A promise that resolves to an API response containing the graph representation
   */
  async analyzeQueryProgram(
    projectId: string,
    queryprogramId: string,
  ): Promise<ApiResponse<Graph>> {
    return await this.httpClient.post<Graph>(
      '/v1/actions/evaluate/queryprogram/graph',
      {
        projectId,
        queryprogramId,
      },
    );
  }

  /**
   * Get readable answer for query response
   * @param queryResponseId - The ID of the query response
   * @param query - The query to generate a readable answer for
   * @returns A promise that resolves to a readable stream of the answer
   */
  async getReadableAnswerForQueryResponse(
    queryResponseId: string,
    query: string,
  ): Promise<ReadableStream<Uint8Array>> {
    return await this.httpClient.createStream(
      `/v1/actions/generate/readableanswer-to-queryresponse/${queryResponseId}`,
      {
        url: `/v1/actions/generate/readableanswer-to-queryresponse/${queryResponseId}`,
        method: 'POST',
        jsonBody: { query },
        headers: {
          Accept: 'text/event-stream',
        },
      },
    );
  }
}
