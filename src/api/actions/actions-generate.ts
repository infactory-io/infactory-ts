import { sharedClient } from '@/core/shared-client.js';
import { ContextInfo, ToolNameSpace } from '@/types/common.js';
import { ChatMessageCreate } from '@/api/resources/chat.js';

// Request interfaces
interface CreateApiRequest {
  apiName: string;
  apiDescription: string;
  known_attributes?: Record<string, any>;
  context?: Record<string, any>;
}

interface CreateDatamodelRequest {
  dataobjectId: string;
}

interface CreateFunctioncallRequest {
  conversationId: string;
  messageCreate: ChatMessageCreate;
  allTools?: ToolNameSpace;
}

interface CreateKnowledgeEntityLinkRequest {
  question: string;
  projectId: string;
  teamId?: string;
}

interface CreateQueryprogramRequest {
  question: string;
  contextInfo?: ContextInfo;
  projectId: string;
  additionalInstructions?: string;
}

interface FixQueryprogramRequest {
  projectId: string;
  queryprogramId: string;
  queryResponseId?: string;
  contextInfo?: ContextInfo;
  additionalInstructions?: string;
}

interface CreateQuestionsRequest {
  projectId: string;
  previousQuestions?: string[];
  count?: number;
}

interface CreateReadableanswerToQueryresponseRequest {
  query?: string;
}

interface FunctionMessageReference {
  requestId: string;
  conversationId: string;
  authorUserId?: string;
  projectId?: string;
  nodeId?: string;
  channel?: string;
}

export const generateActionsApi = {
  // Create a new API endpoint
  createApi: async (params: CreateApiRequest): Promise<ReadableStream<any>> => {
    return sharedClient.createStream('/v1/actions/generate/new-api', {
      url: '/v1/actions/generate/new-api',
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Create a new API endpoint endpoint
  createApiEndpoint: async (
    params: CreateApiRequest,
  ): Promise<ReadableStream<any>> => {
    return sharedClient.createStream('/v1/actions/generate/new-api-endpoint', {
      url: '/v1/actions/generate/new-api-endpoint',
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Create datamodel endpoint
  createDatamodel: async (
    params: CreateDatamodelRequest,
  ): Promise<ReadableStream<any>> => {
    return sharedClient.createStream('/v1/actions/generate/datamodel', {
      url: '/v1/actions/generate/datamodel',
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Create functioncall endpoint
  createFunctioncall: async (
    params: CreateFunctioncallRequest,
  ): Promise<ReadableStream<any>> => {
    return sharedClient.createStream('/v1/actions/generate/functioncall', {
      url: '/v1/actions/generate/functioncall',
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Create knowledge entity link endpoint
  createKnowledgeEntityLink: async (
    params: CreateKnowledgeEntityLinkRequest,
    stream: boolean = false,
  ): Promise<ReadableStream<any>> => {
    return sharedClient.createStream(
      `/v1/actions/generate/knowledge/entity-link?stream=${stream}`,
      {
        url: `/v1/actions/generate/knowledge/entity-link?stream=${stream}`,
        method: 'POST',
        body: JSON.stringify(params),
      },
    );
  },

  // Create queryprogram endpoint
  createQueryprogram: async (
    params: CreateQueryprogramRequest,
  ): Promise<ReadableStream<any>> => {
    return sharedClient.createStream('/v1/actions/generate/queryprogram', {
      url: '/v1/actions/generate/queryprogram',
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  fixQueryprogram: async (
    params: FixQueryprogramRequest,
  ): Promise<ReadableStream<any>> => {
    return sharedClient.createStream('/v1/actions/generate/queryprogram', {
      url: '/v1/actions/generate/queryprogram',
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Create questions endpoint
  createQuestions: async (
    params: CreateQuestionsRequest,
  ): Promise<ReadableStream<any>> => {
    return sharedClient.createStream('/v1/actions/generate/questions', {
      url: '/v1/actions/generate/questions',
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Create readable answer to query response endpoint
  createReadableanswerToQueryresponse: async (
    queryResponseId: string,
    params: CreateReadableanswerToQueryresponseRequest,
  ): Promise<ReadableStream<any>> => {
    const url = `/v1/actions/generate/readableanswer-to-queryresponse/${queryResponseId}`;
    return sharedClient.createStream(url, {
      url,
      method: 'POST',
      body: JSON.stringify(params),
    });
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
    if (params.requestId.startsWith('cg_')) {
      params.requestId = params.requestId.slice(3);
    }
    const url = `/v1/actions/generate/readableanswer-to-message/${messageId}`;
    return sharedClient.createStream(url, {
      url,
      method: 'POST',
      body: JSON.stringify(params),
    });
  },
};
