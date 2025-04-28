// src/clients/chat-client.ts

import { HttpClient } from '../core/http-client.js';
import { ApiResponse } from '../types/common.js';
import {
  ChatMessage,
  ConversationGraph,
  GraphItem,
  MessageStatus,
} from '../types/chat.js';

/**
 * Represents a conversation in the chat system
 */
export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  starred?: boolean;
  archived?: boolean;
  messages?: ChatMessage[];
  queryprogramId?: string | null;
}

/**
 * Parameters for creating a new conversation
 */
export interface CreateConversationParams {
  projectId: string;
  title?: string;
  defaultSlugModel?: string;
  queryprogramId?: string | null;
}

/**
 * Parameters for updating an existing conversation
 */
export interface UpdateConversationParams {
  title?: string;
  isStarred?: boolean;
  isArchived?: boolean;
  defaultSlugModel?: string;
}

/**
 * Parameters for creating a new chat message
 */
export interface ChatMessageCreate {
  conversationId: string;
  projectId: string;
  queryprogramId?: string | null;
  content: string;
  authorRole?: string;
  contentType?: string;
  authorUserId?: string | null;
  parentMessageId?: string | null;
  apiEndpoints?: [string, string][] | null;
  model?: string;
  temperature?: number;
  maxTokens?: number | null;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

/**
 * Safely parses contentText to set the data field in a message
 * @param message - The chat message to process
 * @returns The processed message object
 */
// EXPORTED HELPER
export const setChatMessageData = (message: ChatMessage): ChatMessage => {
  // Safely parse `content_text` to set `data` field in the message
  try {
    if (
      message.contentText &&
      typeof message.contentText === 'string' &&
      message.contentText.startsWith('{')
    ) {
      message.data = JSON.parse(message.contentText);
    }
  } catch {
    console.warn(
      'Error loading message.contentText as data:',
      message.contentText,
    );
  }
  return message;
};

/**
 * Sets data for a graph item based on its kind
 * @param item - The graph item to process
 * @returns The processed graph item
 */
// EXPORTED HELPER
export const setConversationGraphItemData = (item: GraphItem): GraphItem => {
  if (item.kind === 'node') {
    if (item.message) {
      item.message = setChatMessageData(item.message);
    }
  }
  if (item.kind === 'group') {
    for (let i = 0; i < item.items.length; i++) {
      item.items[i] = setConversationGraphItemData(item.items[i]);
    }
  }
  return item;
};

/**
 * Sets data for all items in a conversation graph
 * @param graph - The conversation graph to process
 * @returns The processed conversation graph
 */
// EXPORTED HELPER
export const setConversationGraphData = (
  graph: ConversationGraph,
): ConversationGraph => {
  for (let i = 0; i < graph.items.length; i++) {
    graph.items[i] = setConversationGraphItemData(graph.items[i]);
  }
  return graph;
};

/**
 * Processes a readable chat response stream and updates the status
 * @param stream - The readable stream to process
 * @param setStatus - Callback function to update status
 * @returns Promise that resolves when the stream is fully processed
 */
// EXPORTED HELPER
export const processReadableChatResponseStream = async (
  stream: ReadableStream,
  setStatus: (status: MessageStatus) => void,
): Promise<void> => {
  const reader = stream?.getReader();
  if (!reader) {
    throw new Error('No readable stream');
  }
  const decoder = new TextDecoder();

  let buffer = '';
  let content = '';
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    const text = decoder.decode(value);
    buffer += text;
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    let eventType: string | null = null;

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
        continue; // Skip the event line
      }
      if (line.trim().length === 0) {
        eventType = null;
        continue; // Skip empty lines
      }
      // Process data lines only
      if (line.startsWith('data: ')) {
        const dataStr = line.slice(6).trim();
        if (!dataStr) continue;

        let status_data = null as any;
        try {
          status_data = JSON.parse(dataStr);
          if (!eventType?.endsWith('LLMContent')) {
            console.info('ToolChat', eventType, status_data);
          }
        } catch {
          console.warn('ToolChat - non-json data', eventType, dataStr);
        }

        // Now process the status data
        if (
          eventType?.endsWith('LLMContent') &&
          'content' in status_data &&
          status_data.content
        ) {
          content += status_data.content;
          setStatus({
            kind: 'thinking',
            contentType: eventType,
            content: content,
            data: null,
          });
        } else if (eventType === 'messages') {
          setStatus({
            kind: 'thinking',
            contentType: eventType,
            content: content,
            data: status_data,
          });
          // Add a message to the conversationGraphItems
        } else if (
          eventType === 'LLMToolCall' ||
          status_data?.type === 'function-call'
        ) {
          let endpoint = status_data?.name;
          if (endpoint && !endpoint.startsWith('/')) {
            endpoint = '/' + endpoint;
          }
          setStatus({
            kind: 'thinking',
            contentType: 'LLMToolCall',
            content: 'Calling `' + endpoint + '`',
            data: null,
          });
        } else if (eventType === 'text' && status_data.content) {
          setStatus({
            kind: 'thinking',
            contentType: eventType,
            content: 'Processing data',
            data: null,
          });
        } else {
          console.warn(
            'ToolChat - Unknown status data:',
            eventType,
            status_data,
          );
        }
      }
    }
  }
  reader.releaseLock();
};

/**
 * Client for managing chats and conversations in the Infactory API
 */
export class ChatClient {
  /**
   * Creates a new ChatClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Get all conversations for a project
   * @param projectId - The ID of the project
   * @param queryProgramId - Optional query program ID to filter conversations
   * @returns A promise that resolves to an API response containing an array of conversations
   */
  async getProjectConversations(
    projectId: string,
    queryProgramId?: string,
  ): Promise<ApiResponse<Conversation[]>> {
    const params: Record<string, string> = { projectId: projectId };
    if (queryProgramId) {
      params['queryprogramId'] = queryProgramId;
    }
    return await this.httpClient.get<Conversation[]>(`/v1/chat`, {
      params: params,
    });
  }

  /**
   * Get a specific conversation by ID
   * @param conversationId - The ID of the conversation to retrieve
   * @returns A promise that resolves to an API response containing the conversation
   */
  async getConversation(
    conversationId: string,
  ): Promise<ApiResponse<Conversation>> {
    return await this.httpClient.get<Conversation>(
      `/v1/chat/${conversationId}`,
    );
  }

  /**
   * Create a new conversation
   * @param params - Parameters for creating the conversation
   * @returns A promise that resolves to an API response containing the created conversation
   */
  async createConversation(
    params: CreateConversationParams,
  ): Promise<ApiResponse<Conversation>> {
    return await this.httpClient.post<Conversation>('/v1/chat', {
      body: {
        projectId: params.projectId,
        title: params.title,
        defaultSlugModel: params.defaultSlugModel,
        queryprogramId: params.queryprogramId,
      },
    });
  }

  /**
   * Send a message to a conversation
   * @param conversationId - The ID of the conversation
   * @param params - Parameters for creating the message
   * @param noReply - Whether to prevent an AI response (defaults to false)
   * @returns A promise that resolves to a readable stream of the response
   */
  async sendMessage(
    conversationId: string,
    params: ChatMessageCreate,
    noReply: boolean = false,
  ): Promise<ReadableStream<Uint8Array>> {
    const queryParams: Record<string, string> = {};
    if (noReply) {
      queryParams['no_reply'] = 'true';
    }
    const url = `/v1/chat/${conversationId}`;

    return this.httpClient.createStream(url, {
      url,
      method: 'POST',
      params: queryParams,
      body: JSON.stringify(params),
    });
  }

  /**
   * Send a tool call message through the chat interface
   * @param toolName - The name of the tool to call
   * @param params - Parameters for creating the message
   * @param noReply - Whether to prevent an AI response (defaults to false)
   * @returns A promise that resolves to a readable stream of the response
   */
  async sendToolCall(
    toolName: string,
    params: ChatMessageCreate,
    noReply: boolean = false,
  ): Promise<ReadableStream<Uint8Array>> {
    const queryParams: Record<string, string> = {};
    if (noReply) {
      queryParams['noReply'] = 'true';
    }
    const url = `/live/${toolName}`;

    return this.httpClient.createStream(url, {
      url,
      method: 'POST',
      params: queryParams,
      body: JSON.stringify(params),
    });
  }

  /**
   * Get messages for a conversation
   * @param conversationId - The ID of the conversation
   * @param includeHidden - Whether to include hidden messages (defaults to false)
   * @returns A promise that resolves to an API response containing an array of messages
   */
  async getConversationMessages(
    conversationId: string,
    includeHidden: boolean = false,
  ): Promise<ApiResponse<ChatMessage[]>> {
    const queryParams = new URLSearchParams();
    if (includeHidden) {
      queryParams.append('include_hidden', 'true');
    }
    const queryString = queryParams.toString();
    const url = `/v1/chat/${conversationId}/messages${queryString ? `?${queryString}` : ''}`;

    return await this.httpClient.get<ChatMessage[]>(url);
  }

  /**
   * Get a graph representation of the conversation
   * @param conversationId - The ID of the conversation
   * @returns A promise that resolves to an API response containing the conversation graph
   */
  async getConversationGraph(
    conversationId: string,
  ): Promise<ApiResponse<ConversationGraph>> {
    return await this.httpClient.get<ConversationGraph>(
      `/v1/chat/${conversationId}/graph`,
    );
  }

  /**
   * Update an existing conversation
   * @param conversationId - The ID of the conversation to update
   * @param params - Parameters for updating the conversation
   * @returns A promise that resolves to an API response containing the updated conversation
   */
  async updateConversation(
    conversationId: string,
    params: UpdateConversationParams,
  ): Promise<ApiResponse<Conversation>> {
    return await this.httpClient.patch<Conversation>(
      `/v1/chat/${conversationId}`,
      {
        body: params,
      },
    );
  }

  /**
   * Archive a conversation
   * @param conversationId - The ID of the conversation to archive
   * @returns A promise that resolves to an API response containing the archived conversation
   */
  async archiveConversation(
    conversationId: string,
  ): Promise<ApiResponse<Conversation>> {
    return await this.httpClient.patch<Conversation>(
      `/v1/chat/${conversationId}/archive`,
    );
  }

  /**
   * Star or unstar a conversation
   * @param conversationId - The ID of the conversation to star/unstar
   * @param starred - Whether the conversation should be starred (true) or unstarred (false)
   * @returns A promise that resolves to an API response containing the updated conversation
   */
  async toggleStar(
    conversationId: string,
    starred: boolean,
  ): Promise<ApiResponse<Conversation>> {
    const body: UpdateConversationParams = {
      isStarred: starred,
    };
    return await this.httpClient.patch<Conversation>(
      `/v1/chat/${conversationId}`,
      {
        body,
      },
    );
  }

  /**
   * Delete a conversation
   * @param conversationId - The ID of the conversation to delete
   * @returns A promise that resolves to an API response with the deletion result
   */
  async deleteConversation(conversationId: string): Promise<ApiResponse<void>> {
    return await this.httpClient.delete<void>(`/v1/chat/${conversationId}`);
  }
}
