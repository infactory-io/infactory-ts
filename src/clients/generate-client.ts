import { HttpClient } from '../core/http-client.js';
import { ApiResponse } from '../types/common.js';
import { API, APIEndpoint, QueryProgram } from '../types/common.js';
import { DataModelSchema } from '../types/data-models.js';
import {
  GenerateApiParams,
  GenerateApiEndpointParams,
  GenerateDataModelParams,
  GenerateFunctionCallParams,
  GenerateKnowledgeEntityLinkParams,
  GenerateOrFixQueryProgramParams,
  GenerateQuestionsParams,
  GenerateReadableAnswerParams,
  GenerateOntologyParams,
  GenerateKnowledgeEntityLinkResponse,
  GenerateQuestionsResponse,
  GenerateReadableAnswerResponse,
} from '../types/generate.js';

/**
 * Client for accessing AI-powered generation capabilities in the Infactory API
 */
export class GenerateClient {
  /**
   * Creates a new GenerateClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Generates a new API based on project context or description
   * @param params - Parameters for API generation
   * @returns A promise that resolves to an API response containing the generated API
   */
  async generateApi(params: GenerateApiParams): Promise<ApiResponse<API>> {
    return await this.httpClient.post<API>(
      '/v1/actions/generate/new-api',
      params,
    );
  }

  /**
   * Generates a new API endpoint based on requirements
   * @param params - Parameters for API endpoint generation
   * @returns A promise that resolves to an API response containing the generated API endpoint
   */
  async generateApiEndpoint(
    params: GenerateApiEndpointParams,
  ): Promise<ApiResponse<APIEndpoint>> {
    return await this.httpClient.post<APIEndpoint>(
      '/v1/actions/generate/new-api-endpoint',
      params,
    );
  }

  /**
   * Generates a data model schema based on data or description
   * @param params - Parameters for data model generation
   * @returns A promise that resolves to an API response containing the generated data model schema
   */
  async generateDataModel(
    params: GenerateDataModelParams,
  ): Promise<ApiResponse<DataModelSchema>> {
    return await this.httpClient.post<DataModelSchema>(
      '/v1/actions/generate/datamodel',
      params,
    );
  }

  /**
   * Generates a function call structure (e.g., for tool use)
   * @param params - Parameters for function call generation
   * @returns A promise that resolves to an API response containing the generated function call
   */
  async generateFunctionCall(
    params: GenerateFunctionCallParams,
  ): Promise<ApiResponse<Record<string, any>>> {
    return await this.httpClient.post<Record<string, any>>(
      '/v1/actions/generate/functioncall',
      params,
    );
  }

  /**
   * Generates knowledge graph entity links based on context
   * @param params - Parameters for entity link generation
   * @param stream - Whether to return a stream of events instead of a complete response
   * @returns A promise that resolves to an API response or a readable stream
   */
  async generateKnowledgeEntityLink(
    params: GenerateKnowledgeEntityLinkParams,
  ): Promise<ApiResponse<GenerateKnowledgeEntityLinkResponse>>;
  async generateKnowledgeEntityLink(
    params: GenerateKnowledgeEntityLinkParams,
    stream: true,
  ): Promise<ReadableStream<Uint8Array>>;
  async generateKnowledgeEntityLink(
    params: GenerateKnowledgeEntityLinkParams,
    stream?: boolean,
  ): Promise<
    | ApiResponse<GenerateKnowledgeEntityLinkResponse>
    | ReadableStream<Uint8Array>
  > {
    if (stream) {
      return await this.httpClient.createStream(
        '/v1/actions/generate/knowledge/entity-link',
        {
          url: '/v1/actions/generate/knowledge/entity-link',
          method: 'POST',
          params: { stream: true },
          jsonBody: params,
          headers: { Accept: 'text/event-stream' },
        },
      );
    } else {
      return await this.httpClient.post<GenerateKnowledgeEntityLinkResponse>(
        '/v1/actions/generate/knowledge/entity-link',
        params,
      );
    }
  }

  /**
   * Generates or fixes a query program based on natural language or existing program
   * @param params - Parameters for query program generation or fixing
   * @returns A promise that resolves to an API response containing the generated or fixed query program
   */
  async generateQueryProgram(
    params: GenerateOrFixQueryProgramParams,
  ): Promise<ApiResponse<QueryProgram>> {
    return await this.httpClient.post<QueryProgram>(
      '/v1/actions/generate/queryprogram',
      params,
    );
  }

  /**
   * Generates relevant questions based on project context or data
   * @param params - Parameters for question generation
   * @returns A promise that resolves to an API response containing the generated questions
   */
  async generateQuestions(
    params: GenerateQuestionsParams,
  ): Promise<ApiResponse<GenerateQuestionsResponse>> {
    return await this.httpClient.post<GenerateQuestionsResponse>(
      '/v1/actions/generate/questions',
      params,
    );
  }

  /**
   * Generates a human-readable answer from a query response ID
   * @param queryResponseId - The ID of the query response to generate an answer for
   * @param params - Parameters for readable answer generation
   * @returns A promise that resolves to an API response containing the generated answer
   */
  async generateReadableAnswerForQueryResponse(
    queryResponseId: string,
    params: GenerateReadableAnswerParams,
  ): Promise<ApiResponse<GenerateReadableAnswerResponse>> {
    return await this.httpClient.post<GenerateReadableAnswerResponse>(
      `/v1/actions/generate/readableanswer-to-queryresponse/${queryResponseId}`,
      params,
    );
  }

  /**
   * Generates a human-readable answer/explanation for a specific chat message ID
   * @param messageId - The ID of the message to generate an answer for
   * @param params - Parameters for readable answer generation
   * @returns A promise that resolves to an API response containing the generated answer
   */
  async generateReadableAnswerForMessage(
    messageId: string,
    params: GenerateReadableAnswerParams,
  ): Promise<ApiResponse<GenerateReadableAnswerResponse>> {
    return await this.httpClient.post<GenerateReadableAnswerResponse>(
      `/v1/actions/generate/readableanswer-to-message/${messageId}`,
      params,
    );
  }

  /**
   * Generates an ontology structure based on project data models
   * @param params - Parameters for ontology generation
   * @returns A promise that resolves to an API response containing the generated ontology or job status
   */
  async generateOntology(
    params: GenerateOntologyParams,
  ): Promise<ApiResponse<Record<string, any>>> {
    return await this.httpClient.post<Record<string, any>>(
      '/v1/actions/generate/ontology',
      params,
    );
  }
}
