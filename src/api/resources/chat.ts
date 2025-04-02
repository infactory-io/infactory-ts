// import * as React from "react";
import {
  ChatMessage,
  ConversationGraph,
  GraphItem,
  MessageStatus,
} from '@/types/chat.js';
import { del, get, patch, post, postStream } from '@/core/client.js';
import { ApiResponse } from '@/types/common.js';

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  starred?: boolean;
  archived?: boolean;
  messages?: ChatMessage[];
  queryprogram_id?: string | null;
}

export interface CreateConversationParams {
  project_id: string;
  title?: string;
  default_slug_model?: string;
  queryprogram_id?: string | null;
}

export interface UpdateConversationParams {
  title?: string;
  is_starred?: boolean;
  is_archived?: boolean;
  default_slug_model?: string;
}

export interface ChatMessageCreate {
  conversation_id: string;
  project_id: string;
  queryprogram_id?: string | null;
  content: string;
  author_role?: string;
  content_type?: string;
  author_user_id?: string | null;
  parent_message_id?: string | null;
  api_endpoints?: [string, string][] | null;
  model?: string;
  temperature?: number;
  max_tokens?: number | null;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export const setChatMessageData = (message: ChatMessage): ChatMessage => {
  // Safely parse `content_text` to set `data` field in the message
  try {
    if (
      message.content_text &&
      typeof message.content_text === 'string' &&
      message.content_text.startsWith('{')
    ) {
      message.data = JSON.parse(message.content_text);
    }
  } catch (e) {
    console.warn(
      'Error loading message.content_text as data:',
      message.content_text,
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
  setStatus: React.Dispatch<React.SetStateAction<MessageStatus | null>>,
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
            content_type: eventType,
            content: content,
            data: null,
          });
        } else if (eventType === 'messages') {
          setStatus({
            kind: 'thinking',
            content_type: eventType,
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
            content_type: 'LLMToolCall',
            content: 'Calling `' + endpoint + '`',
            data: null,
          });
        } else if (eventType === 'text' && status_data.content) {
          setStatus({
            kind: 'thinking',
            content_type: eventType,
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
    const params: Record<string, string> = { project_id: projectId };
    if (queryProgramId) {
      params['queryprogram_id'] = queryProgramId;
    }
    return await get<Conversation[]>(`/v1/chat`, {
      params: params,
    });
  },

  // Get a specific conversation
  getConversation: async (
    conversationId: string,
  ): Promise<ApiResponse<Conversation>> => {
    return await get<Conversation>(`/v1/chat/${conversationId}`);
  },

  // Create a new conversation
  createConversation: async (
    params: CreateConversationParams,
  ): Promise<ApiResponse<Conversation>> => {
    return await post<Conversation>('/v1/chat', {
      body: {
        project_id: params.project_id,
        title: params.title,
        default_slug_model: params.default_slug_model,
        queryprogram_id: params.queryprogram_id,
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

    return postStream<ChatMessageCreate>(url, {
      params: queryParams,
      body: params,
    });
  },

  // NEW: Send a tool call message through the chat interface.
  // It calls the /live/<toolName> endpoint and returns a stream.
  sendToolCall: async (
    toolName: string,
    params: ChatMessageCreate,
    noReply: boolean = false,
  ): Promise<any> => {
    const queryParams: Record<string, string> = {};
    if (noReply) {
      queryParams['no_reply'] = 'true';
    }
    // Note that the URL now uses `/live/${toolName}` instead of `/v1/chat/...`
    const url = `/live/${toolName}`;

    return postStream<ChatMessageCreate>(url, {
      params: queryParams,
      body: params,
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

    return await get<ChatMessage[]>(url);
  },

  // Get a graph of the conversation
  getConversationGraph: async (
    conversationId: string,
  ): Promise<ApiResponse<ConversationGraph>> => {
    return await get<ConversationGraph>(`/v1/chat/${conversationId}/graph`);
  },

  updateConversation: async (
    conversationId: string,
    params: UpdateConversationParams,
  ): Promise<ApiResponse<Conversation>> => {
    return await patch<Conversation>(`/v1/chat/${conversationId}`, {
      body: params,
    });
  },

  // Archive a conversation
  archiveConversation: async (
    conversationId: string,
  ): Promise<ApiResponse<Conversation>> => {
    return await patch<Conversation>(`/v1/chat/${conversationId}/archive`);
  },

  // Star/unstar a conversation
  toggleStar: async (
    conversationId: string,
    starred: boolean,
  ): Promise<ApiResponse<Conversation>> => {
    const body: UpdateConversationParams = {
      is_starred: starred,
    };
    return await patch<Conversation>(`/v1/chat/${conversationId}`, {
      body,
    });
  },

  // Delete a conversation
  deleteConversation: async (
    conversationId: string,
  ): Promise<ApiResponse<void>> => {
    return await del<void>(`/v1/chat/${conversationId}`);
  },
};
