import { sharedClient, ApiResponse } from '@/core/shared-client.js';
import { I7YPendingJob } from './database.js';

export interface ParameterConfig {
  value: string;
  required: boolean;
}

export interface ParameterGroup {
  required: boolean;
  parameters: Array<{
    key: string;
    value: string;
  }>;
}

export interface HttpBodyConfig {
  type: string; // 'raw', 'form-data', 'x-www-form-urlencoded'
  contentType?: string;
  content?: string;
  parameters?: Record<string, string>;
}

export interface HttpAuthConfig {
  apiKey?: {
    name: string;
    value: string;
    location: string;
  };
  bearerToken?: string;
  basicAuth?: {
    username: string;
    password: string;
  };
}

export interface TestHttpConnectionRequest {
  url: string;
  method: string;
  headers?: Record<string, string>;
  parameters?: Record<string, ParameterConfig>;
  parameterGroups?: ParameterGroup[];
  authType?: string;
  auth?: HttpAuthConfig;
  body?: HttpBodyConfig;
}

export interface TestHttpConnectionResponse {
  success: boolean;
  status: number;
  responseTime: number;
  contentType: string;
  size: number;
  data: any;
  headers?: Record<string, string>;
}

export interface ExecuteHttpRequestRequest extends TestHttpConnectionRequest {
  projectId: string;
  datasourceId: string;
  connectSpec?: Record<string, any>;
}

export interface ExecuteHttpRequestResponse {
  jobs: I7YPendingJob[];
}

export const httpApi = {
  testConnection: async (
    requestConfig: TestHttpConnectionRequest,
  ): Promise<ApiResponse<TestHttpConnectionResponse>> => {
    return sharedClient.post<TestHttpConnectionResponse>(
      '/v1/http/test-connection',
      {
        body: requestConfig,
      },
    );
  },

  executeRequest: async (
    requestConfig: ExecuteHttpRequestRequest,
  ): Promise<ApiResponse<ExecuteHttpRequestResponse>> => {
    const payload = {
      ...requestConfig,
      connectSpec: requestConfig.connectSpec,
    };

    return sharedClient.post<ExecuteHttpRequestResponse>(
      '/v1/http/execute-request',
      {
        body: payload,
      },
    );
  },
};
