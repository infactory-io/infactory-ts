// Using a generic type instead of ReactNode from React

export interface ChatMessage {
  id: string;
  author_user_id: string | null;
  node_id: string | null;
  conversation_id: string;
  author_role: string;
  author_name: string | null;
  author_metadata: string | null;
  created_at: string;
  updated_at: string;
  content_type: string;
  content_text: string | null;
  data: Record<string, any> | null; // TODO replace with specific types
  react_element: any; // Generic replacement for ReactNode
  response_format: string | null;
  status: string;
  end_turn: boolean | null;
  weight: number;
  recipient: string;
  channel: string | null;

  // Enhanced metadata fields
  request_id: string | null;

  // Tool usage and execution results
  aggregate_result: string | null;
  tool_messages: string | null;
  finish_details: string | null;
  attachments: string | null;
  formatted_content: string | null;
  thinking: string | null;
  result_type: string | null;
  text: string | null;

  // Relations - these will be populated by Prisma
  conversation?: any;
  node?: any;
  user?: any;
}

interface BaseGraphItem {
  id: string;
  created_at: string; // ISO datetime string
  kind: 'node' | 'group';
}

export interface MessageStatus {
  kind: 'thinking' | 'done' | 'stopped' | 'error';
  content_type?: string;
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
  conversation_id: string; // UUID string
  items: GraphItem[];
}
