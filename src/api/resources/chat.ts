import {
  ChatMessage,
  ConversationGraph,
  GraphItem,
  MessageStatus,
} from '@/types/chat.js';
import { sharedClient, ApiResponse } from '@/core/shared-client.js';

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

export interface CreateConversationParams {
  projectId: string;
  title?: string;
  defaultSlugModel?: string;
  queryprogramId?: string | null;
}

export interface UpdateConversationParams {
  title?: string;
  isStarred?: boolean;
  isArchived?: boolean;
  defaultSlugModel?: string;
}

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
  } catch (e) {
    console.warn(
      'Error loading message.contentText as data:',
      message.contentText,
    );
  }
  return message;
};

const setConversationGraphItemData = (item: GraphItem): GraphItem => {
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
export const setConversationGraphData = (
  graph: ConversationGraph,
): ConversationGraph => {
  for (let i = 0; i < graph.items.length; i++) {
    graph.items[i] = setConversationGraphItemData(graph.items[i]);
  }
  return graph;
};

export async function processReadableChatResponseStream(
  response: ReadableStream<any>,
  setStatus: (status: MessageStatus | null) => void,
) {
  const reader = response?.getReader();
  if (!reader) {
    throw new Error('No readable stream');
  }
  const decoder = new TextDecoder();

  // Replace the loading message with the actual stream message
  let i = 1;
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
        i += 1;
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
            console.log('ToolChat', eventType, status_data);
          }
        } catch {
          console.warn('ToolChat - non-json data', eventType, dataStr);
        }
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
}

export const chatApi = {
  // Get all conversations for a project
  getProjectConversations: async (
    projectId: string,
    queryProgramId?: string,
  ): Promise<ApiResponse<Conversation[]>> => {
    const params: Record<string, string> = { projectId: projectId };
    if (queryProgramId) {
      params['queryprogramId'] = queryProgramId;
    }
    return await sharedClient.get<Conversation[]>(`/v1/chat`, {
      params: params,
    });
  },

  // Get a specific conversation
  getConversation: async (
    conversationId: string,
  ): Promise<ApiResponse<Conversation>> => {
    return await sharedClient.get<Conversation>(`/v1/chat/${conversationId}`);
  },

  // Create a new conversation
  createConversation: async (
    params: CreateConversationParams,
  ): Promise<ApiResponse<Conversation>> => {
    return await sharedClient.post<Conversation>('/v1/chat', {
      body: {
        projectId: params.projectId,
        title: params.title,
        defaultSlugModel: params.defaultSlugModel,
        queryprogramId: params.queryprogramId,
      },
    });
  },

  // Send a message to a conversation
  sendMessage: async (
    conversationId: string,
    params: ChatMessageCreate,
    noReply: boolean = false,
  ): Promise<any> => {
    const queryParams: Record<string, string> = {};
    if (noReply) {
      queryParams['no_reply'] = 'true';
    }
    const url = `/v1/chat/${conversationId}`;

    return sharedClient.createStream(url, {
      url,
      method: 'POST',
      params: queryParams,
      body: JSON.stringify(params),
    });
  },

  // NEW: Send a tool call message through the chat interface.
  sendToolCall: async (
    toolName: string,
    params: ChatMessageCreate,
    noReply: boolean = false,
  ): Promise<any> => {
    const queryParams: Record<string, string> = {};
    if (noReply) {
      queryParams['noReply'] = 'true';
    }
    const url = `/live/${toolName}`;

    return sharedClient.createStream(url, {
      url,
      method: 'POST',
      params: queryParams,
      body: JSON.stringify(params),
    });
  },

  // Get messages for a conversation
  getConversationMessages: async (
    conversationId: string,
    includeHidden: boolean = false,
  ): Promise<ApiResponse<ChatMessage[]>> => {
    const queryParams = new URLSearchParams();
    if (includeHidden) {
      queryParams.append('include_hidden', 'true');
    }
    const queryString = queryParams.toString();
    const url = `/v1/chat/${conversationId}/messages${queryString ? `?${queryString}` : ''}`;

    return await sharedClient.get<ChatMessage[]>(url);
  },

  // Get a graph of the conversation
  getConversationGraph: async (
    conversationId: string,
  ): Promise<ApiResponse<ConversationGraph>> => {
    return await sharedClient.get<ConversationGraph>(
      `/v1/chat/${conversationId}/graph`,
    );
  },

  updateConversation: async (
    conversationId: string,
    params: UpdateConversationParams,
  ): Promise<ApiResponse<Conversation>> => {
    return await sharedClient.patch<Conversation>(
      `/v1/chat/${conversationId}`,
      {
        body: params,
      },
    );
  },

  // Archive a conversation
  archiveConversation: async (
    conversationId: string,
  ): Promise<ApiResponse<Conversation>> => {
    return await sharedClient.patch<Conversation>(
      `/v1/chat/${conversationId}/archive`,
    );
  },

  // Star/unstar a conversation
  toggleStar: async (
    conversationId: string,
    starred: boolean,
  ): Promise<ApiResponse<Conversation>> => {
    const body: UpdateConversationParams = {
      isStarred: starred,
    };
    return await sharedClient.patch<Conversation>(
      `/v1/chat/${conversationId}`,
      {
        body,
      },
    );
  },

  // Delete a conversation
  deleteConversation: async (
    conversationId: string,
  ): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(`/v1/chat/${conversationId}`);
  },
};
