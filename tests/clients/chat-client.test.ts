import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatClient } from '../../src/clients/chat-client.js';
import { HttpClient } from '../../src/core/http-client.js';
import { createErrorFromStatus } from '../../src/errors/index.js';

// Mock the HttpClient
vi.mock('../../src/core/http-client', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      request: vi.fn(),
      createStream: vi.fn(),
      getIsServer: vi.fn(),
    })),
  };
});

describe('ChatClient', () => {
  let chatClient: ChatClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a new mock HttpClient instance
    mockHttpClient = new HttpClient({
      baseUrl: 'https://api.infactory.ai',
      apiKey: 'test-api-key',
    });

    // Create a new ChatClient with the mock HttpClient
    chatClient = new ChatClient(mockHttpClient);
  });

  describe('getProjectConversations', () => {
    it('should call the correct endpoint to get conversations for a project', async () => {
      // Mock response data
      const mockConversations = [
        {
          id: 'conv-1',
          title: 'Conversation 1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          starred: false,
          archived: false,
        },
        {
          id: 'conv-2',
          title: 'Conversation 2',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
          starred: true,
          archived: false,
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockConversations,
      });

      // Call the method
      const result = await chatClient.getProjectConversations('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/chat', {
        params: { projectId: 'project-1' },
      });

      // Verify the result
      expect(result.data).toEqual(mockConversations);
    });

    it('should include queryprogramId when provided', async () => {
      // Mock response data
      const mockConversations = [
        {
          id: 'conv-1',
          title: 'Conversation 1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          queryprogramId: 'qp-1',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockConversations,
      });

      // Call the method with queryProgramId
      const result = await chatClient.getProjectConversations(
        'project-1',
        'qp-1',
      );

      // Verify the HTTP client was called correctly with both params
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/chat', {
        params: { projectId: 'project-1', queryprogramId: 'qp-1' },
      });

      // Verify the result
      expect(result.data).toEqual(mockConversations);
    });

    it('should handle errors when getting project conversations', async () => {
      // Setup the mock to return an error
      const mockError = createErrorFromStatus(
        500,
        'server_error',
        'Internal server error',
      );

      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        error: mockError,
      });

      // Call the method
      const result = await chatClient.getProjectConversations('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/chat', {
        params: { projectId: 'project-1' },
      });

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getConversation', () => {
    it('should call the correct endpoint to get a conversation by ID', async () => {
      // Mock response data
      const mockConversation = {
        id: 'conv-1',
        title: 'Conversation 1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        starred: false,
        archived: false,
        messages: [],
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockConversation,
      });

      // Call the method
      const result = await chatClient.getConversation('conv-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/chat/conv-1');

      // Verify the result
      expect(result.data).toEqual(mockConversation);
    });
  });

  describe('createConversation', () => {
    it('should call the correct endpoint to create a conversation', async () => {
      // Mock request data
      const createParams = {
        projectId: 'project-1',
        title: 'New Conversation',
        defaultSlugModel: 'gpt-4',
      };

      // Mock response data
      const mockResponse = {
        id: 'new-conv-1',
        title: 'New Conversation',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        projectId: 'project-1',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await chatClient.createConversation(createParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/chat', {
        body: {
          projectId: 'project-1',
          title: 'New Conversation',
          defaultSlugModel: 'gpt-4',
          queryprogramId: undefined,
        },
      });

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should support creating a conversation with a queryprogram ID', async () => {
      // Mock request data
      const createParams = {
        projectId: 'project-1',
        title: 'New Conversation with QueryProgram',
        queryprogramId: 'qp-1',
      };

      // Mock response data
      const mockResponse = {
        id: 'new-conv-2',
        title: 'New Conversation with QueryProgram',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        projectId: 'project-1',
        queryprogramId: 'qp-1',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await chatClient.createConversation(createParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/chat', {
        body: {
          projectId: 'project-1',
          title: 'New Conversation with QueryProgram',
          defaultSlugModel: undefined,
          queryprogramId: 'qp-1',
        },
      });

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('sendMessage', () => {
    it('should call the correct endpoint to send a message to a conversation', async () => {
      // Mock request data
      const messageParams = {
        conversationId: 'conv-1',
        projectId: 'project-1',
        content: 'Hello, world!',
        authorRole: 'user',
      };

      // Mock stream response
      const mockStream = new ReadableStream();

      // Setup the mock response
      vi.mocked(mockHttpClient.createStream).mockResolvedValueOnce(mockStream);

      // Call the method
      const result = await chatClient.sendMessage('conv-1', messageParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.createStream).toHaveBeenCalledWith(
        '/v1/chat/conv-1',
        {
          url: '/v1/chat/conv-1',
          method: 'POST',
          params: {},
          body: JSON.stringify(messageParams),
        },
      );

      // Verify the result is the stream
      expect(result).toBe(mockStream);
    });

    it('should support the noReply parameter', async () => {
      // Mock request data
      const messageParams = {
        conversationId: 'conv-1',
        projectId: 'project-1',
        content: 'Hello, world!',
      };

      // Mock stream response
      const mockStream = new ReadableStream();

      // Setup the mock response
      vi.mocked(mockHttpClient.createStream).mockResolvedValueOnce(mockStream);

      // Call the method with noReply = true
      const result = await chatClient.sendMessage(
        'conv-1',
        messageParams,
        true,
      );

      // Verify the HTTP client was called correctly with no_reply parameter
      expect(mockHttpClient.createStream).toHaveBeenCalledWith(
        '/v1/chat/conv-1',
        {
          url: '/v1/chat/conv-1',
          method: 'POST',
          params: { no_reply: 'true' },
          body: JSON.stringify(messageParams),
        },
      );

      // Verify the result is the stream
      expect(result).toBe(mockStream);
    });
  });

  describe('sendToolCall', () => {
    it('should call the correct endpoint to send a tool call', async () => {
      // Mock request data
      const messageParams = {
        conversationId: 'conv-1',
        projectId: 'project-1',
        content: 'Execute tool',
      };

      // Mock stream response
      const mockStream = new ReadableStream();

      // Setup the mock response
      vi.mocked(mockHttpClient.createStream).mockResolvedValueOnce(mockStream);

      // Call the method
      const result = await chatClient.sendToolCall(
        'execute-tool',
        messageParams,
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.createStream).toHaveBeenCalledWith(
        '/live/execute-tool',
        {
          url: '/live/execute-tool',
          method: 'POST',
          params: {},
          body: JSON.stringify(messageParams),
        },
      );

      // Verify the result is the stream
      expect(result).toBe(mockStream);
    });

    it('should support the noReply parameter for tool calls', async () => {
      // Mock request data
      const messageParams = {
        conversationId: 'conv-1',
        projectId: 'project-1',
        content: 'Execute tool without reply',
      };

      // Mock stream response
      const mockStream = new ReadableStream();

      // Setup the mock response
      vi.mocked(mockHttpClient.createStream).mockResolvedValueOnce(mockStream);

      // Call the method with noReply = true
      const result = await chatClient.sendToolCall(
        'execute-tool',
        messageParams,
        true,
      );

      // Verify the HTTP client was called correctly with noReply parameter
      expect(mockHttpClient.createStream).toHaveBeenCalledWith(
        '/live/execute-tool',
        {
          url: '/live/execute-tool',
          method: 'POST',
          params: { noReply: 'true' },
          body: JSON.stringify(messageParams),
        },
      );

      // Verify the result is the stream
      expect(result).toBe(mockStream);
    });
  });

  describe('getConversationMessages', () => {
    it('should call the correct endpoint to get messages for a conversation', async () => {
      // Mock response data
      const mockMessages = [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          authorRole: 'user',
          content: 'Hello',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          contentType: 'text',
          status: 'completed',
        },
        {
          id: 'msg-2',
          conversationId: 'conv-1',
          authorRole: 'assistant',
          content: 'How can I help you?',
          createdAt: '2025-01-01T00:00:01Z',
          updatedAt: '2025-01-01T00:00:01Z',
          contentType: 'text',
          status: 'completed',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockMessages,
      });

      // Call the method
      const result = await chatClient.getConversationMessages('conv-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/chat/conv-1/messages',
      );

      // Verify the result
      expect(result.data).toEqual(mockMessages);
    });

    it('should support the includeHidden parameter', async () => {
      // Mock response data with hidden messages
      const mockMessages = [
        {
          id: 'msg-1',
          conversationId: 'conv-1',
          authorRole: 'user',
          content: 'Hello',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          contentType: 'text',
          status: 'completed',
        },
        {
          id: 'msg-hidden',
          conversationId: 'conv-1',
          authorRole: 'system',
          content: 'Hidden message',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          contentType: 'text',
          status: 'completed',
          hidden: true,
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockMessages,
      });

      // Call the method with includeHidden = true
      const result = await chatClient.getConversationMessages('conv-1', true);

      // Verify the HTTP client was called correctly with include_hidden parameter
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/chat/conv-1/messages?include_hidden=true',
      );

      // Verify the result
      expect(result.data).toEqual(mockMessages);
    });
  });

  describe('getConversationGraph', () => {
    it('should call the correct endpoint to get the graph for a conversation', async () => {
      // Mock response data
      const mockGraph = {
        conversationId: 'conv-1',
        items: [
          {
            id: 'node-1',
            createdAt: '2025-01-01T00:00:00Z',
            kind: 'node',
            message: {
              id: 'msg-1',
              conversationId: 'conv-1',
              authorRole: 'user',
              content: 'Hello',
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-01-01T00:00:00Z',
              contentType: 'text',
              status: 'completed',
            },
            status: null,
          },
        ],
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockGraph,
      });

      // Call the method
      const result = await chatClient.getConversationGraph('conv-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/chat/conv-1/graph');

      // Verify the result
      expect(result.data).toEqual(mockGraph);
    });
  });

  describe('updateConversation', () => {
    it('should call the correct endpoint to update a conversation', async () => {
      // Mock update parameters
      const updateParams = {
        title: 'Updated Conversation Title',
        isStarred: true,
      };

      // Mock response data
      const mockUpdatedConversation = {
        id: 'conv-1',
        title: 'Updated Conversation Title',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:10Z',
        starred: true,
        archived: false,
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockUpdatedConversation,
      });

      // Call the method
      const result = await chatClient.updateConversation(
        'conv-1',
        updateParams,
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith('/v1/chat/conv-1', {
        body: updateParams,
      });

      // Verify the result
      expect(result.data).toEqual(mockUpdatedConversation);
    });
  });

  describe('archiveConversation', () => {
    it('should call the correct endpoint to archive a conversation', async () => {
      // Mock response data
      const mockArchivedConversation = {
        id: 'conv-1',
        title: 'Conversation 1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:10Z',
        archived: true,
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockArchivedConversation,
      });

      // Call the method
      const result = await chatClient.archiveConversation('conv-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/chat/conv-1/archive',
      );

      // Verify the result
      expect(result.data).toEqual(mockArchivedConversation);
    });
  });

  describe('toggleStar', () => {
    it('should call the correct endpoint to star a conversation', async () => {
      // Mock response data
      const mockStarredConversation = {
        id: 'conv-1',
        title: 'Conversation 1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:10Z',
        starred: true,
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockStarredConversation,
      });

      // Call the method to star the conversation
      const result = await chatClient.toggleStar('conv-1', true);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith('/v1/chat/conv-1', {
        body: {
          isStarred: true,
        },
      });

      // Verify the result
      expect(result.data).toEqual(mockStarredConversation);
    });

    it('should call the correct endpoint to unstar a conversation', async () => {
      // Mock response data
      const mockUnstarredConversation = {
        id: 'conv-1',
        title: 'Conversation 1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:10Z',
        starred: false,
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockUnstarredConversation,
      });

      // Call the method to unstar the conversation
      const result = await chatClient.toggleStar('conv-1', false);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith('/v1/chat/conv-1', {
        body: {
          isStarred: false,
        },
      });

      // Verify the result
      expect(result.data).toEqual(mockUnstarredConversation);
    });
  });

  describe('deleteConversation', () => {
    it('should call the correct endpoint to delete a conversation', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method
      const result = await chatClient.deleteConversation('conv-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/v1/chat/conv-1');

      // Verify the result
      expect(result.data).toBeUndefined();
    });
  });
});
