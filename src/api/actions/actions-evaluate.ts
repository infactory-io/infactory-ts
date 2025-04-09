import { sharedClient, ApiResponse } from '@/core/shared-client.js';
import { Graph } from '@/types/common.js';

interface EvaluateQueryprogramRequest {
  projectId: string;
  queryprogramId: string;
  stream?: boolean; // Optional parameter to control streaming
}

export const evaluateActionsApi = {
  // Evaluate a query program with streaming response
  evaluateQueryprogram: async (
    request: EvaluateQueryprogramRequest,
  ): Promise<ReadableStream<any>> => {
    const url = '/v1/actions/evaluate/queryprogram';
    return sharedClient.createStream(url, {
      url,
      method: 'POST',
      body: JSON.stringify({
        projectId: request.projectId,
        queryprogramId: request.queryprogramId,
        stream: true, // Explicitly set streaming to true
      }),
    });
  },

  // Evaluate a query program with non-streaming response
  evaluateQueryprogramSync: async (
    request: EvaluateQueryprogramRequest,
  ): Promise<ApiResponse<any>> => {
    return await sharedClient.post<any>('/v1/actions/evaluate/queryprogram', {
      body: {
        projectId: request.projectId,
        queryprogramId: request.queryprogramId,
        stream: false, // Explicitly set streaming to false
      },
    });
  },

  // Analyze a query program to get its graph representation
  analyzeQueryProgram: async (
    request: EvaluateQueryprogramRequest,
  ): Promise<ApiResponse<Graph>> => {
    return await sharedClient.post<Graph>(
      '/v1/actions/evaluate/queryprogram/graph',
      {
        body: {
          projectId: request.projectId,
          queryprogramId: request.queryprogramId,
        },
      },
    );
  },

  // Get readable answer for query response
  readableAnswerToQueryresponse: async (
    queryResponseId: string,
    query: string,
  ): Promise<ReadableStream<any>> => {
    const url = `/v1/actions/generate/readableanswer-to-queryresponse/${queryResponseId}`;
    return sharedClient.createStream(url, {
      url,
      method: 'POST',
      body: JSON.stringify({ query }),
    });
  },
};
