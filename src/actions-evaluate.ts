import { postStream, post } from './client';
import { ApiResponse, Graph } from './types';

interface EvaluateQueryprogramRequest {
  project_id: string;
  queryprogram_id: string;
  stream?: boolean; // Optional parameter to control streaming
}

interface ReadableAnswerRequest {
  query: string;
}

export const evaluateActionsApi = {
  // Evaluate a query program with streaming response
  evaluateQueryprogram: async (
    request: EvaluateQueryprogramRequest
  ): Promise<ReadableStream<any>> => {
    return postStream<any>('/v1/actions/evaluate/queryprogram', {
      body: {
        project_id: request.project_id,
        queryprogram_id: request.queryprogram_id,
        stream: true // Explicitly set streaming to true
      }
    });
  },

  // Evaluate a query program with non-streaming response
  evaluateQueryprogramSync: async (
    request: EvaluateQueryprogramRequest
  ): Promise<ApiResponse<any>> => {
    return post<any>('/v1/actions/evaluate/queryprogram', {
      body: {
        project_id: request.project_id,
        queryprogram_id: request.queryprogram_id,
        stream: false // Explicitly set streaming to false
      }
    });
  },

  // Analyze a query program to get its graph representation
  analyzeQueryProgram: async (
    request: EvaluateQueryprogramRequest
  ): Promise<ApiResponse<Graph>> => {
    return post<Graph>('/v1/actions/evaluate/queryprogram/graph', {
      body: {
        project_id: request.project_id,
        queryprogram_id: request.queryprogram_id
      }
    });
  },

  // Get readable answer for query response
  readableAnswerToQueryresponse: async (
    query_response_id: string,
    query: string
  ): Promise<ReadableStream<any>> => {
    return postStream<any>(
      `/v1/actions/generate/readableanswer-to-queryresponse/${query_response_id}`,
      {
        body: { query }
      }
    );
  }
};
