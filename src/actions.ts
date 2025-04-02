import { post, postStream } from './client';
import { ApiResponse } from './types';

interface LoadAnalyzeResponse {
  result: string;
  message: string;
}

interface LoadResponse {
  result: string;
  message: string;
}

interface AskEvaluateResponse {
  result: string;
  message: string;
}

interface AskResponse {
  result: string;
  message: string;
}

interface GenerateQueriesResponse {
  result: string;
  message: string;
}

interface CompileResponse {
  result: string;
  message: string;
}

export const actionsApi = {
  loadAnalyze: async (
    projectId: string,
    dataobjectId: string,
    file: File
  ): Promise<ApiResponse<LoadAnalyzeResponse>> => {
    const formData = new FormData();
    formData.append('file', file);

    return post<LoadAnalyzeResponse, FormData>(
      `/v1/actions/load/analyze/${projectId}/${dataobjectId}`,
      {
        body: formData
      }
    );
  },

  load: async (
    projectId: string,
    file: File
  ): Promise<ApiResponse<LoadResponse>> => {
    const formData = new FormData();
    formData.append('file', file);

    return post<LoadResponse, FormData>(`/v1/actions/load/${projectId}`, {
      body: formData
    });
  },

  askEvaluate: async (
    queryProgramId: string,
    transformFileId: string,
    datalineId: string,
    query: string
  ): Promise<ApiResponse<AskEvaluateResponse>> => {
    return post<AskEvaluateResponse, string>(
      `/v1/actions/ask/evaluate/${queryProgramId}/${transformFileId}/${datalineId}`,
      {
        body: query
      }
    );
  },

  ask: async (
    transformFileId: string,
    datalineId: string,
    query: string
  ): Promise<ApiResponse<AskResponse>> => {
    return post<AskResponse, string>(
      `/v1/actions/ask/${transformFileId}/${datalineId}`,
      {
        body: query
      }
    );
  },

  generateQueries: async (
    transformFileId: string,
    datalineId: string,
    query: string
  ): Promise<ApiResponse<GenerateQueriesResponse>> => {
    return post<GenerateQueriesResponse, string>(
      `/v1/actions/generate/queries/${transformFileId}/${datalineId}`,
      {
        body: query
      }
    );
  },

  askCompileGenerate: async (
    queryProgramId: string | 'new',
    transformFileId: string,
    datalineId: string,
    query: string
  ): Promise<ApiResponse<CompileResponse>> => {
    return post<CompileResponse, string>(
      `/v1/actions/ask/compile/generate/${queryProgramId}/${transformFileId}/${datalineId}`,
      {
        body: query
      }
    );
  },

  askCompile: async (
    transformFileId: string,
    datalineId: string,
    query: string
  ): Promise<ApiResponse<CompileResponse>> => {
    return post<CompileResponse, string>(
      `/v1/actions/ask/compile/${transformFileId}/${datalineId}`,
      {
        body: query
      }
    );
  },

  askCompileUpdate: async (
    queryProgramId: string,
    transformFileId: string,
    datalineId: string,
    query: string
  ): Promise<ApiResponse<CompileResponse>> => {
    return post<CompileResponse, string>(
      `/v1/actions/ask/compile/update/${queryProgramId}/${transformFileId}/${datalineId}`,
      {
        body: query
      }
    );
  }
};
