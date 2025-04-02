import { fetchApi } from './client';
import { ApiResponse } from './types';
import { I7YPendingJob } from './database';

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
  response_time: number;
  content_type: string;
  size: number;
  data: any;
  headers?: Record<string, string>;
}

export interface ExecuteHttpRequestRequest extends TestHttpConnectionRequest {
  project_id: string;
  datasource_id: string;
  connect_spec?: Record<string, any>;
}

export interface ExecuteHttpRequestResponse {
  jobs: I7YPendingJob[];
}

export const httpApi = {
  testConnection: async (
    requestConfig: TestHttpConnectionRequest
  ): Promise<ApiResponse<TestHttpConnectionResponse>> => {
    return fetchApi<TestHttpConnectionResponse>('/v1/http/test-connection', {
      method: 'POST',
      body: JSON.stringify(requestConfig)
    });
  },

  executeRequest: async (
    requestConfig: ExecuteHttpRequestRequest
  ): Promise<ApiResponse<ExecuteHttpRequestResponse>> => {
    const payload = {
      ...requestConfig,
      connect_spec: requestConfig.connect_spec
    };

    return fetchApi<ExecuteHttpRequestResponse>('/v1/http/execute-request', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
