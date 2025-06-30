// Using a generic type instead of ReactNode from React

export interface ChatMessage {
  id: string;
  authorUserId: string | null;
  nodeId: string | null;
  conversationId: string;
  authorRole: string;
  authorName: string | null;
  authorMetadata: string | null;
  createdAt: string;
  updatedAt: string;
  contentType: string;
  contentText: string | null;
  data: Record<string, any> | null; // TODO replace with specific types
  reactElement: any; // Generic replacement for ReactNode
  responseFormat: string | null;
  status: string;
  endTurn: boolean | null;
  weight: number;
  recipient: string;
  channel: string | null;

  // Enhanced metadata fields
  requestId: string | null;

  // Tool usage and execution results
  aggregateResult: string | null;
  toolMessages: string | null;
  finishDetails: string | null;
  attachments: string | null;
  formattedContent: string | null;
  thinking: string | null;
  resultType: string | null;
  text: string | null;

  // Relations - these will be populated by Prisma
  conversation?: any;
  node?: any;
  user?: any;
}

// Base structure for graph items
export interface BaseGraphItem {
  id: string;
  createdAt: string; // ISO datetime string
  kind: 'node' | 'group';
}

export interface MessageStatus {
  kind: 'thinking' | 'done' | 'stopped' | 'error';
  contentType?: string;
  content: string | null;
  data: Record<string, any> | null;
}

export interface NodeItem extends BaseGraphItem {
  kind: 'node';
  message: null | ChatMessage;
  status: null | MessageStatus;
}

export interface GroupItem extends BaseGraphItem {
  kind: 'group';
  items: GraphItem[];
}

export type GraphItem = NodeItem | GroupItem;

export interface ConversationGraph {
  conversationId: string; // UUID string
  items: GraphItem[];
}

export interface ChatMessageCreate {
  conversation_id: string;
  project_id: string;
  queryprogram_id?: string | null;
  content: string;
  conversation_mode?: 'explore' | 'chat';
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
