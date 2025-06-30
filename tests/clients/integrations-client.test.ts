import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IntegrationsClient } from '../../src/clients/integrations-client.js';
import { HttpClient } from '../../src/core/http-client.js';
import { createErrorFromStatus } from '../../src/errors/index.js';

// Mock the HttpClient
vi.mock('../../src/core/http-client.js', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    })),
  };
});

describe('IntegrationsClient', () => {
  let integrationsClient: IntegrationsClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a new mock HttpClient instance
    mockHttpClient = new HttpClient({
      baseUrl: 'https://api.infactory.ai',
      apiKey: 'test-api-key',
    });

    // Create a new IntegrationsClient with the mock HttpClient
    integrationsClient = new IntegrationsClient(mockHttpClient);
  });

  // Test Fivetran Integration Methods
  describe('fivetranWebhook', () => {
    it('should call the correct endpoint with proper headers for Fivetran webhook', async () => {
      // Mock request data
      const params = {
        payload: { event: 'sync_success', data: { connector_id: '123' } },
        signatureHeader: 'test-signature-header',
      };

      // Mock response data
      const mockResponse = { success: true };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await integrationsClient.fivetranWebhook(params);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/integrations/fivetran/webhook',
        params.payload,
        { headers: { 'X-Fivetran-Signature-256': params.signatureHeader } },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  // Test Chat Integration Methods
  describe('getChatModels', () => {
    it('should call the correct endpoint to get chat models for a project', async () => {
      const projectId = 'project-123';
      const mockResponse = { models: ['gpt-3.5-turbo', 'gpt-4'] };

      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await integrationsClient.getChatModels(projectId);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v1/integrations/chat/${projectId}/models`,
      );
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('getChatTools', () => {
    it('should call the correct endpoint to get chat tools for a project', async () => {
      const projectId = 'project-123';
      const mockResponse = { tools: [{ type: 'function', name: 'test_tool' }] };

      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await integrationsClient.getChatTools(projectId);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v1/integrations/chat/${projectId}/tools.json`,
      );
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('getChatToolsCode', () => {
    it('should call the correct endpoint to get chat tools code for a project', async () => {
      const projectId = 'project-123';
      const mockResponse = 'def get_tools(): return []';

      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await integrationsClient.getChatToolsCode(projectId);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v1/integrations/chat/${projectId}/tools.py`,
      );
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('getOpenWebUITools', () => {
    it('should call the correct endpoint to get Open WebUI tools for a project', async () => {
      const projectId = 'project-123';
      const mockResponse = [{ name: 'test_tool', description: 'A test tool' }];

      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await integrationsClient.getOpenWebUITools(projectId);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v1/integrations/chat/${projectId}/open-webui-tools.json`,
      );
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('getChatToolSchema', () => {
    it('should call the correct endpoint to get chat tool schema for a project', async () => {
      const projectId = 'project-123';
      const mockResponse = { schema: { type: 'object' } };

      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await integrationsClient.getChatToolSchema(projectId);

      expect(mockHttpClient.get).toHaveBeenCalledWith(
        `/v1/integrations/chat/${projectId}/schema`,
      );
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('callChatToolFunction', () => {
    it('should call the correct endpoint to call a tool function', async () => {
      const params = {
        projectId: 'project-123',
        toolName: 'test_tool',
        params: { param1: 'value1', param2: 'value2' },
      };
      const mockResponse = { result: 'success' };

      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await integrationsClient.callChatToolFunction(params);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/v1/integrations/chat/${params.projectId}/call/${params.toolName}`,
        params.params,
      );
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('createChatCompletion', () => {
    it('should call the correct endpoint to create a chat completion', async () => {
      const projectId = 'project-123';
      const requestBody = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
      };
      const mockResponse = {
        choices: [{ message: { role: 'assistant', content: 'Hi there!' } }],
      };

      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await integrationsClient.createChatCompletion(
        projectId,
        requestBody,
      );

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `/v1/integrations/chat/${projectId}/chat/completions`,
        requestBody,
      );
      expect(result.data).toEqual(mockResponse);
    });
  });

  // Test HTTP Integration Methods
  describe('testHttpConnection', () => {
    it('should call the correct endpoint to test an HTTP connection', async () => {
      const requestConfig = {
        url: 'https://api.example.com/data',
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
      };
      const mockResponse = {
        success: true,
        status: 200,
        responseTime: 123,
        contentType: 'application/json',
        size: 1024,
        data: { results: [1, 2, 3] },
        headers: { 'content-type': 'application/json' },
      };

      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await integrationsClient.testHttpConnection(requestConfig);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/http/test-connection',
        requestConfig,
      );
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('executeHttpRequest', () => {
    it('should call the correct endpoint to execute an HTTP request', async () => {
      const requestConfig = {
        url: 'https://api.example.com/data',
        method: 'GET',
        headers: { Authorization: 'Bearer token' },
        projectId: 'project-123',
        datasourceId: 'datasource-123',
      };
      const mockResponse = {
        jobs: [{ id: 'job-1', status: 'pending' }],
      };

      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      const result = await integrationsClient.executeHttpRequest(requestConfig);

      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/http/execute-request',
        requestConfig,
      );
      expect(result.data).toEqual(mockResponse);
    });
  });

  // Test Error Handling
  describe('error handling', () => {
    it('should properly handle errors from HTTP client', async () => {
      const mockError = createErrorFromStatus(
        500,
        'server_error',
        'Internal server error',
      );

      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        error: mockError,
      });

      const result = await integrationsClient.getChatModels('project-123');

      expect(result.error).toEqual(mockError);
    });
  });
});
