import { postStream } from '@/core/client.js';
import { ContextInfo, ToolNameSpace } from '@/types/common.js';
import { ChatMessageCreate } from '@/api/resources/chat.js';

// Request interfaces
interface CreateApiRequest {
  api_name: string;
  api_description: string;
  known_attributes?: Record<string, any>;
  context?: Record<string, any>;
}

interface CreateDatamodelRequest {
  dataobject_id: string;
}

interface CreateFunctioncallRequest {
  conversation_id: string;
  message_create: ChatMessageCreate;
  all_tools?: ToolNameSpace;
}

interface CreateKnowledgeEntityLinkRequest {
  question: string;
  project_id: string;
  team_id?: string;
}

interface CreateQueryprogramRequest {
  question: string;
  context_info?: ContextInfo;
  project_id: string;
  additional_instructions?: string;
}

interface FixQueryprogramRequest {
  project_id: string;
  queryprogram_id: string;
  query_response_id?: string;
  context_info?: ContextInfo;
  additional_instructions?: string;
}

interface CreateQuestionsRequest {
  project_id: string;
  previous_questions?: string[];
  count?: number;
}

interface CreateReadableanswerToQueryresponseRequest {
  query?: string;
}

interface FunctionMessageReference {
  request_id: string;
  conversation_id: string;
  author_user_id?: string;
  project_id?: string;
  node_id?: string;
  channel?: string;
}

export const generateActionsApi = {
  // Create a new API endpoint
  createApi: async (params: CreateApiRequest): Promise<ReadableStream<any>> => {
    return postStream<CreateApiRequest>('/v1/actions/generate/new-api', {
      body: params,
    });
  },

  // Create a new API endpoint endpoint
  createApiEndpoint: async (
    params: CreateApiRequest,
  ): Promise<ReadableStream<any>> => {
    return postStream<CreateApiRequest>(
      '/v1/actions/generate/new-api-endpoint',
      {
        body: params,
      },
    );
  },

  // Create datamodel endpoint
  createDatamodel: async (
    params: CreateDatamodelRequest,
  ): Promise<ReadableStream<any>> => {
    return postStream<CreateDatamodelRequest>(
      '/v1/actions/generate/datamodel',
      {
        body: params,
      },
    );
  },

  // Create functioncall endpoint
  createFunctioncall: async (
    params: CreateFunctioncallRequest,
  ): Promise<ReadableStream<any>> => {
    return postStream<CreateFunctioncallRequest>(
      '/v1/actions/generate/functioncall',
      {
        body: params,
      },
    );
  },

  // Create knowledge entity link endpoint
  createKnowledgeEntityLink: async (
    params: CreateKnowledgeEntityLinkRequest,
    stream: boolean = false,
  ): Promise<ReadableStream<any>> => {
    return postStream<CreateKnowledgeEntityLinkRequest>(
      `/v1/actions/generate/knowledge/entity-link?stream=${stream}`,
      {
        body: params,
      },
    );
  },

  // Create queryprogram endpoint
  createQueryprogram: async (
    params: CreateQueryprogramRequest,
  ): Promise<ReadableStream<any>> => {
    return postStream<CreateQueryprogramRequest>(
      '/v1/actions/generate/queryprogram',
      {
        body: params,
      },
    );
  },

  fixQueryprogram: async (
    params: FixQueryprogramRequest,
  ): Promise<ReadableStream<any>> => {
    return postStream<FixQueryprogramRequest>(
      '/v1/actions/generate/queryprogram',
      {
        body: params,
      },
    );
  },

  // Create questions endpoint
  createQuestions: async (
    params: CreateQuestionsRequest,
  ): Promise<ReadableStream<any>> => {
    return postStream<CreateQuestionsRequest>(
      '/v1/actions/generate/questions',
      {
        body: params,
      },
    );
  },

  // Create readable answer to query response endpoint
  createReadableanswerToQueryresponse: async (
    queryResponseId: string,
    params: CreateReadableanswerToQueryresponseRequest,
  ): Promise<ReadableStream<any>> => {
    return postStream<CreateReadableanswerToQueryresponseRequest>(
      `/v1/actions/generate/readableanswer-to-queryresponse/${queryResponseId}`,
      {
        body: params,
      },
    );
  },

  // Create readable answer to message endpoint
  createReadableanswerToMessage: async (
    messageId: string,
    params: FunctionMessageReference,
  ): Promise<ReadableStream<any>> => {
    if (!messageId) {
      throw new Error('messageId is required');
    }
    if (!params) {
      throw new Error('conversationContext is required');
    }
    if (params.request_id.startsWith('cg_')) {
      params.request_id = params.request_id.slice(3);
    }
    return postStream<any>(
      `/v1/actions/generate/readableanswer-to-message/${messageId}`,
      {
        body: params,
      },
    );
  },
};
