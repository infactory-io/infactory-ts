import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import {
  ExploreClient,
  setChatMessageData,
  setConversationGraphItemData,
  setConversationGraphData,
  processReadableChatResponseStream,
} from '../../src/clients/explore-client.js';
import { HttpClient } from '../../src/core/http-client.js';
import { createErrorFromStatus } from '../../src/errors/index.js';
import type {
  BaseGraphItem,
  ChatMessage,
  ConversationGraph,
  GroupItem,
  NodeItem,
} from '../../src/types/chat.js';

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

// --- Mock Data Helper Functions ---

// Helper to create a default ChatMessage with required fields
const createMockChatMessage = (
  overrides: Partial<ChatMessage> = {},
): ChatMessage => ({
  id: 'msg-default',
  authorUserId: 'user-default',
  nodeId: 'node-default',
  conversationId: 'conv-default',
  authorRole: 'user',
  authorName: 'Default User',
  authorMetadata: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(), // ChatMessage has updatedAt
  contentType: 'text/plain',
  contentText: 'Default content',
  data: null,
  reactElement: null,
  responseFormat: null,
  status: 'ready',
  endTurn: null,
  weight: 1.0,
  recipient: 'all',
  channel: null,
  requestId: null,
  aggregateResult: null,
  toolMessages: null,
  finishDetails: null,
  attachments: null,
  formattedContent: null,
  thinking: null,
  resultType: null,
  text: null,
  ...overrides,
});

// Helper to create a default BaseGraphItem
const createMockBaseGraphItem = (
  overrides: Partial<BaseGraphItem> = {},
): BaseGraphItem => ({
  id: 'item-default',
  createdAt: new Date().toISOString(),
  kind: 'node', // Provide a default kind, will be overridden by Node/Group helpers
  ...overrides,
});

// Helper to create a default NodeItem
const createMockNodeItem = (overrides: Partial<NodeItem> = {}): NodeItem => ({
  ...createMockBaseGraphItem(),
  kind: 'node',
  message: createMockChatMessage({
    id: overrides.message?.id ?? 'msg-node-default',
    nodeId: overrides.id ?? 'node-item-default',
  }),
  status: null, // NodeItem status is null | MessageStatus
  ...overrides,
});

// Helper to create a default GroupItem
const createMockGroupItem = (
  overrides: Partial<GroupItem> = {},
): GroupItem => ({
  ...createMockBaseGraphItem(),
  kind: 'group',
  items: [],
  ...overrides,
});

// Helper to create a default ConversationGraph
const createMockConversationGraph = (
  overrides: Partial<ConversationGraph> = {},
): ConversationGraph => ({
  conversationId: 'conv-graph-default',
  items: [],
  ...overrides,
});

describe('ExploreClient', () => {
  let exploreClient: ExploreClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a new mock HttpClient instance
    mockHttpClient = new HttpClient({
      baseUrl: 'https://api.infactory.ai',
      apiKey: 'test-api-key',
    });

    // Create a new ExploreClient with the mock HttpClient
    exploreClient = new ExploreClient(mockHttpClient);
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
      const result = await exploreClient.getProjectConversations('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/explore', {
        projectId: 'project-1',
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
      const result = await exploreClient.getProjectConversations(
        'project-1',
        'qp-1',
      );

      // Verify the HTTP client was called correctly with both params
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/explore', {
        projectId: 'project-1',
        queryprogramId: 'qp-1',
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
      const result = await exploreClient.getProjectConversations('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/explore', {
        projectId: 'project-1',
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
      const result = await exploreClient.getConversation('conv-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/explore/conv-1');

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
      const result = await exploreClient.createConversation(createParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/explore', {
        projectId: 'project-1',
        title: 'New Conversation',
        defaultSlugModel: 'gpt-4',
        queryprogramId: undefined,
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
      const result = await exploreClient.createConversation(createParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/explore', {
        projectId: 'project-1',
        title: 'New Conversation with QueryProgram',
        defaultSlugModel: undefined,
        queryprogramId: 'qp-1',
      });

      // Verify the result
      expect(result.data).toEqual(mockResponse);
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
      const result = await exploreClient.sendToolCall(
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
      const result = await exploreClient.sendToolCall(
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
      const result = await exploreClient.getConversationMessages('conv-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/explore/conv-1/messages',
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
      const result = await exploreClient.getConversationMessages(
        'conv-1',
        true,
      );

      // Verify the HTTP client was called correctly with include_hidden parameter
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/explore/conv-1/messages?include_hidden=true',
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
      const result = await exploreClient.getConversationGraph('conv-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/explore/conv-1/graph',
      );

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
      const result = await exploreClient.updateConversation(
        'conv-1',
        updateParams,
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith('/v1/explore/conv-1', {
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
      const result = await exploreClient.archiveConversation('conv-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/explore/conv-1/archive',
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
      const result = await exploreClient.toggleStar('conv-1', true);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith('/v1/explore/conv-1', {
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
      const result = await exploreClient.toggleStar('conv-1', false);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith('/v1/explore/conv-1', {
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
      const result = await exploreClient.deleteConversation('conv-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/v1/explore/conv-1');

      // Verify the result
      expect(result.data).toBeUndefined();
    });
  });

  // Helper Function Tests
  describe('setChatMessageData', () => {
    it('should parse valid JSON contentText into data', () => {
      const message = createMockChatMessage({
        contentText: '{"key": "value"}',
      });
      const processedMessage = setChatMessageData(message);
      expect(processedMessage.data).toEqual({ key: 'value' });
    });

    it('should not modify data if contentText is not valid JSON', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {}); // Suppress console output
      const message = createMockChatMessage({ contentText: 'not json' });
      const processedMessage = setChatMessageData(message);
      expect(processedMessage.data).toBeNull(); // Corrected: Default is null
      expect(consoleWarnSpy).not.toHaveBeenCalled(); // Doesn't warn if not starting with {
      consoleWarnSpy.mockRestore();
    });

    it('should warn and not set data if contentText starts with { but is invalid JSON', () => {
      const consoleWarnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => {}); // Suppress console output
      const message = createMockChatMessage({
        contentText: '{invalid json',
      });
      const processedMessage = setChatMessageData(message);
      expect(processedMessage.data).toBeNull(); // Corrected: Default is null
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Error loading message.contentText as data:',
        '{invalid json',
      );
      consoleWarnSpy.mockRestore();
    });

    it('should not modify message if contentText is null', () => {
      const messageNull = createMockChatMessage({ contentText: null });
      const processedMessage = setChatMessageData(messageNull);
      expect(processedMessage.data).toBeNull();
    });
  });

  describe('setConversationGraphItemData', () => {
    it('should process message data for node items', () => {
      const nodeItem = createMockNodeItem({
        id: 'node-1',
        message: createMockChatMessage({
          id: 'msg-1',
          nodeId: 'node-1',
          contentText: '{"key": "value"}',
        }),
      });
      const processedItem = setConversationGraphItemData(nodeItem) as NodeItem;
      expect(processedItem.message?.data).toEqual({ key: 'value' });
    });

    it('should handle node items without messages', () => {
      const nodeItem = createMockNodeItem({ id: 'node-1', message: null });
      const processedItem = setConversationGraphItemData(nodeItem) as NodeItem;
      expect(processedItem.message).toBeNull();
    });

    it('should recursively process items within group items', () => {
      const groupItem = createMockGroupItem({
        id: 'group-1',
        items: [
          createMockNodeItem({
            id: 'node-1',
            message: createMockChatMessage({
              id: 'msg-1',
              nodeId: 'node-1',
              contentText: '{"key1": "value1"}',
            }),
          }),
          createMockGroupItem({
            id: 'group-2',
            items: [
              createMockNodeItem({
                id: 'node-2',
                message: createMockChatMessage({
                  id: 'msg-2',
                  nodeId: 'node-2',
                  authorRole: 'assistant',
                  contentText: '{"key2": "value2"}',
                }),
              }),
            ],
          }),
        ],
      });

      const processedItem = setConversationGraphItemData(
        groupItem,
      ) as GroupItem;
      const processedNode1 = processedItem.items[0] as NodeItem;
      const processedGroup2 = processedItem.items[1] as GroupItem;
      const processedNode2 = processedGroup2.items[0] as NodeItem;

      expect(processedNode1.message?.data).toEqual({ key1: 'value1' });
      expect(processedNode2.message?.data).toEqual({ key2: 'value2' });
    });

    it('should handle empty group items', () => {
      const groupItem = createMockGroupItem({ id: 'group-1', items: [] });
      const processedItem = setConversationGraphItemData(
        groupItem,
      ) as GroupItem;
      expect(processedItem.items).toEqual([]);
    });
  });

  describe('setConversationGraphData', () => {
    it('should process all top-level items in the graph', () => {
      const graph = createMockConversationGraph({
        conversationId: 'conv-1',
        items: [
          createMockNodeItem({
            id: 'node-1',
            message: createMockChatMessage({
              id: 'msg-1',
              nodeId: 'node-1',
              conversationId: 'conv-1',
              contentText: '{"key1": "value1"}',
            }),
          }),
          createMockGroupItem({
            id: 'group-1',
            items: [
              createMockNodeItem({
                id: 'node-2',
                message: createMockChatMessage({
                  id: 'msg-2',
                  nodeId: 'node-2',
                  conversationId: 'conv-1',
                  authorRole: 'assistant',
                  contentText: '{"key2": "value2"}',
                }),
              }),
            ],
          }),
        ],
      });
      const processedGraph = setConversationGraphData(graph);
      const processedNode1 = processedGraph.items[0] as NodeItem;
      const processedGroup1 = processedGraph.items[1] as GroupItem;
      const processedNode2 = processedGroup1.items[0] as NodeItem;

      expect(processedNode1.message?.data).toEqual({ key1: 'value1' });
      expect(processedNode2.message?.data).toEqual({ key2: 'value2' });
    });

    it('should handle an empty graph', () => {
      const graph = createMockConversationGraph({
        conversationId: 'conv-empty',
        items: [],
      });
      const processedGraph = setConversationGraphData(graph);
      expect(processedGraph.items).toEqual([]);
    });
  });
});

describe('processReadableChatResponseStream', () => {
  let mockSetStatus: Mock; // Simplified type
  const encoder = new TextEncoder();

  beforeEach(() => {
    mockSetStatus = vi.fn();
    vi.spyOn(console, 'info').mockImplementation(() => {}); // Suppress info logs
    vi.spyOn(console, 'warn').mockImplementation(() => {}); // Suppress warn logs
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to create a ReadableStream from strings
  function createStream(...chunks: string[]): ReadableStream<Uint8Array> {
    return new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => {
          controller.enqueue(encoder.encode(chunk));
        });
        controller.close();
      },
    });
  }

  it('should throw error if reader cannot be obtained', async () => {
    const stream = {
      getReader: () => null,
    } as unknown as ReadableStream<any>; // Simulate null reader
    await expect(
      processReadableChatResponseStream(stream, mockSetStatus),
    ).rejects.toThrow('No readable stream');
  });

  it('should process LLMContent events and accumulate content', async () => {
    const stream = createStream(
      'event: fooLLMContent\ndata: {"content": "Hello "}\n\n',
      'event: barLLMContent\ndata: {"content": "World!"}\n\n',
    );
    await processReadableChatResponseStream(stream, mockSetStatus);

    expect(mockSetStatus).toHaveBeenCalledTimes(2);
    expect(mockSetStatus).toHaveBeenNthCalledWith(1, {
      kind: 'thinking',
      contentType: 'fooLLMContent',
      content: 'Hello ',
      data: null,
    });
    expect(mockSetStatus).toHaveBeenNthCalledWith(2, {
      kind: 'thinking',
      contentType: 'barLLMContent',
      content: 'Hello World!', // Accumulated content
      data: null,
    });
  });

  it('should process messages events', async () => {
    const mockMessageData = { id: 'msg-1', text: 'some message' };
    const stream = createStream(
      `event: messages\ndata: ${JSON.stringify(mockMessageData)}\n\n`,
    );
    await processReadableChatResponseStream(stream, mockSetStatus);

    expect(mockSetStatus).toHaveBeenCalledTimes(1);
    expect(mockSetStatus).toHaveBeenCalledWith({
      kind: 'thinking',
      contentType: 'messages',
      content: '', // No LLMContent events
      data: mockMessageData, // Parsed data
    });
  });

  it('should process LLMToolCall events and format content', async () => {
    const stream = createStream(
      'event: LLMToolCall\ndata: {"name": "get_weather", "arguments": {}}\n\n',
      'event: LLMToolCall\ndata: {"name": "/v1/internal/api", "arguments": {}}\n\n',
    );
    await processReadableChatResponseStream(stream, mockSetStatus);

    expect(mockSetStatus).toHaveBeenCalledTimes(2);
    expect(mockSetStatus).toHaveBeenNthCalledWith(1, {
      kind: 'thinking',
      contentType: 'LLMToolCall',
      content: 'Calling `/get_weather`',
      data: null,
    });
    expect(mockSetStatus).toHaveBeenNthCalledWith(2, {
      kind: 'thinking',
      contentType: 'LLMToolCall',
      content: 'Calling `/v1/internal/api`',
      data: null,
    });
  });

  it('should handle LLMToolCall event via function-call type', async () => {
    const stream = createStream(
      'data: {"type": "function-call", "name": "my_func"}\n\n',
    );
    await processReadableChatResponseStream(stream, mockSetStatus);
    expect(mockSetStatus).toHaveBeenCalledTimes(1);
    expect(mockSetStatus).toHaveBeenCalledWith({
      kind: 'thinking',
      contentType: 'LLMToolCall',
      content: 'Calling `/my_func`',
      data: null,
    });
  });

  it('should process text events', async () => {
    const stream = createStream(
      'event: text\ndata: {"content": "processing..."}\n\n',
    );
    await processReadableChatResponseStream(stream, mockSetStatus);

    expect(mockSetStatus).toHaveBeenCalledTimes(1);
    expect(mockSetStatus).toHaveBeenCalledWith({
      kind: 'thinking',
      contentType: 'text',
      content: 'Processing data',
      data: null,
    });
  });

  it('should handle invalid JSON in data lines', async () => {
    const stream = createStream('event: messages\ndata: {invalid json\n\n');
    await processReadableChatResponseStream(stream, mockSetStatus);

    expect(mockSetStatus).toHaveBeenCalledTimes(1);
    expect(mockSetStatus).toHaveBeenCalledWith({
      kind: 'thinking',
      contentType: 'messages',
      content: '',
      data: null,
    });
    expect(console.warn).toHaveBeenCalledWith(
      'ToolChat - non-json data',
      'messages',
      '{invalid json',
    );
  });

  it('should handle unknown event types', async () => {
    const stream = createStream('event: unknown\ndata: {"foo": "bar"}\n\n');
    await processReadableChatResponseStream(stream, mockSetStatus);

    expect(mockSetStatus).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      'ToolChat - Unknown status data:',
      'unknown',
      { foo: 'bar' },
    );
  });

  it('should handle multi-line data correctly', async () => {
    // Example from SSE spec
    const stream = createStream(
      'data: YHOO\ndata: +2\ndata: 10\n\n',
      'event: end-of-stream\ndata: goodbye\n\n',
    );
    // This test primarily ensures it doesn't crash and processes events line by line.
    // The current logic only parses the last `data:` line per event block if it's JSON.
    await processReadableChatResponseStream(stream, mockSetStatus);
    expect(mockSetStatus).toHaveBeenCalledTimes(0);
    expect(console.warn).toHaveBeenCalledTimes(7);
  });

  it('should process stream with mixed events and complete', async () => {
    const stream = createStream(
      'event: fooLLMContent\ndata: {"content": "A"}\n\n',
      'event: messages\ndata: {"id": "m1"}\n\n',
      'event: barLLMContent\ndata: {"content": "B"}\n\n',
    );
    await processReadableChatResponseStream(stream, mockSetStatus);
    expect(mockSetStatus).toHaveBeenCalledTimes(3);
    // Check calls in order they happened
    expect(mockSetStatus.mock.calls[0][0]).toEqual({
      kind: 'thinking',
      contentType: 'fooLLMContent',
      content: 'A',
      data: null,
    });
    expect(mockSetStatus.mock.calls[1][0]).toEqual({
      kind: 'thinking',
      contentType: 'messages',
      content: 'A', // Content accumulated from previous event
      data: { id: 'm1' },
    });
    expect(mockSetStatus.mock.calls[2][0]).toEqual({
      kind: 'thinking',
      contentType: 'barLLMContent',
      content: 'AB', // Content accumulated
      data: null,
    });
  });
});
