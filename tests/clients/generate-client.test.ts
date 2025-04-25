import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateClient } from '../../src/clients/generate-client.js';
import { HttpClient } from '../../src/core/http-client.js';

// Mock the HttpClient
vi.mock('../../src/core/http-client.js', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      post: vi.fn().mockResolvedValue({ data: {} }),
      createStream: vi.fn().mockResolvedValue(new ReadableStream()),
    })),
  };
});

describe('GenerateClient', () => {
  let httpClient: HttpClient;
  let generateClient: GenerateClient;

  beforeEach(() => {
    httpClient = new HttpClient({
      baseUrl: 'https://api.example.com',
      apiKey: 'test-key',
    });
    generateClient = new GenerateClient(httpClient);
  });

  describe('generateApi', () => {
    it('should call the correct endpoint with the provided parameters', async () => {
      const params = { projectId: 'project-123', description: 'A test API' };
      await generateClient.generateApi(params);
      expect(httpClient.post).toHaveBeenCalledWith(
        '/v1/actions/generate/new-api',
        params,
      );
    });
  });

  describe('generateApiEndpoint', () => {
    it('should call the correct endpoint with the provided parameters', async () => {
      const params = { apiId: 'api-123', description: 'A test endpoint' };
      await generateClient.generateApiEndpoint(params);
      expect(httpClient.post).toHaveBeenCalledWith(
        '/v1/actions/generate/new-api-endpoint',
        params,
      );
    });
  });

  describe('generateDataModel', () => {
    it('should call the correct endpoint with the provided parameters', async () => {
      const params = {
        projectId: 'project-123',
        description: 'A test data model',
      };
      await generateClient.generateDataModel(params);
      expect(httpClient.post).toHaveBeenCalledWith(
        '/v1/actions/generate/datamodel',
        params,
      );
    });
  });

  describe('generateFunctionCall', () => {
    it('should call the correct endpoint with the provided parameters', async () => {
      const params = {
        projectId: 'project-123',
        functionSchema: '{}',
        input: 'test input',
      };
      await generateClient.generateFunctionCall(params);
      expect(httpClient.post).toHaveBeenCalledWith(
        '/v1/actions/generate/functioncall',
        params,
      );
    });
  });

  describe('generateKnowledgeEntityLink', () => {
    it('should call the correct endpoint with the provided parameters', async () => {
      const params = { projectId: 'project-123', text: 'test text' };
      await generateClient.generateKnowledgeEntityLink(params);
      expect(httpClient.post).toHaveBeenCalledWith(
        '/v1/actions/generate/knowledge/entity-link',
        params,
      );
    });

    it('should create a stream when stream parameter is true', async () => {
      const params = { projectId: 'project-123', text: 'test text' };
      await generateClient.generateKnowledgeEntityLink(params, true);
      expect(httpClient.createStream).toHaveBeenCalledWith(
        '/v1/actions/generate/knowledge/entity-link',
        {
          url: '/v1/actions/generate/knowledge/entity-link',
          method: 'POST',
          params: { stream: true },
          jsonBody: params,
          headers: { Accept: 'text/event-stream' },
        },
      );
    });
  });

  describe('generateQueryProgram', () => {
    it('should call the correct endpoint for generating a new query program', async () => {
      const params = {
        projectId: 'project-123',
        naturalLanguageQuery: 'Show me sales data',
      };
      await generateClient.generateQueryProgram(params);
      expect(httpClient.post).toHaveBeenCalledWith(
        '/v1/actions/generate/queryprogram',
        params,
      );
    });

    it('should call the correct endpoint for fixing an existing query program', async () => {
      const params = {
        queryProgramId: 'qp-123',
        errorDescription: 'Fix the join condition',
      };
      await generateClient.generateQueryProgram(params);
      expect(httpClient.post).toHaveBeenCalledWith(
        '/v1/actions/generate/queryprogram',
        params,
      );
    });
  });

  describe('generateQuestions', () => {
    it('should call the correct endpoint with the provided parameters', async () => {
      const params = { projectId: 'project-123', numberOfQuestions: 5 };
      await generateClient.generateQuestions(params);
      expect(httpClient.post).toHaveBeenCalledWith(
        '/v1/actions/generate/questions',
        params,
      );
    });
  });

  describe('generateReadableAnswerForQueryResponse', () => {
    it('should call the correct endpoint with the provided parameters', async () => {
      const queryResponseId = 'qr-123';
      const params = {
        targetAudience: 'business',
        format: 'markdown' as const,
      };
      await generateClient.generateReadableAnswerForQueryResponse(
        queryResponseId,
        params,
      );
      expect(httpClient.post).toHaveBeenCalledWith(
        `/v1/actions/generate/readableanswer-to-queryresponse/${queryResponseId}`,
        params,
      );
    });
  });

  describe('generateReadableAnswerForMessage', () => {
    it('should call the correct endpoint with the provided parameters', async () => {
      const messageId = 'msg-123';
      const params = { targetAudience: 'technical', format: 'text' as const };
      await generateClient.generateReadableAnswerForMessage(messageId, params);
      expect(httpClient.post).toHaveBeenCalledWith(
        `/v1/actions/generate/readableanswer-to-message/${messageId}`,
        params,
      );
    });
  });

  describe('generateOntology', () => {
    it('should call the correct endpoint with the provided parameters', async () => {
      const params = {
        projectId: 'project-123',
        description: 'Generate an ontology',
      };
      await generateClient.generateOntology(params);
      expect(httpClient.post).toHaveBeenCalledWith(
        '/v1/actions/generate/ontology',
        params,
      );
    });
  });
});
