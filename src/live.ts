import { get, postStream } from './client';
import { ApiResponse, FunctionMessageReference } from './types';

export interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, any>;
  components?: Record<string, any>;
}

// Start of Selection
export interface ChatGPTTool {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: Record<string, any>;
  };
}

export const liveApi = {
  getOpenAPISpec: async (
    apiSlug: string,
    version: string
  ): Promise<ApiResponse<OpenAPISpec>> => {
    return get<OpenAPISpec>(`/live/${apiSlug}/${version}/openapi.json`);
  },

  getTools: async (
    apiSlug: string,
    version: string
  ): Promise<ApiResponse<ChatGPTTool[]>> => {
    const res = await get<any>(`/live/${apiSlug}/${version}/tools.json`);
    if (res.error) return res;

    const data = res.data;
    // Ensure data is an object with the expected keys: name, functions, and fn_mapping
    if (!data || typeof data !== 'object') {
      return { ...res, data: [] };
    }

    const tools: ChatGPTTool[] = [];
    const fnMapping = data.fn_mapping;
    const functionsList = data.functions;

    if (fnMapping && functionsList && Array.isArray(functionsList)) {
      for (const [toolName, functionName] of Object.entries(fnMapping)) {
        // Lookup the function definition that matches the function name from fn_mapping
        const fnDef = functionsList.find((fn: any) => fn.name === functionName);
        if (fnDef) {
          tools.push({
            type: toolName,
            function: {
              name: `/${apiSlug}/${version}/${fnDef.name}`,
              description: fnDef.description,
              parameters: fnDef.parameters
            }
          });
        }
      }
    }

    return { ...res, data: tools };
  },

  getApiDocs: async (
    apiSlug: string,
    version: string,
    host?: string
  ): Promise<ApiResponse<string>> => {
    const params = {} as any;
    if (host) {
      params['host'] = host;
    }
    return get<string>(`/live/${apiSlug}/${version}`, { params: params });
  },

  callCustomEndpoint: async <T = any>(
    apiSlug: string,
    version: string,
    endpointPath: string,
    queryParams?: Record<string, any>
  ): Promise<ApiResponse<T>> => {
    const params = {} as any;
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        params[key] = value;
      });
    }
    return get<T>(`/live/${apiSlug}/${version}/${endpointPath}`, {
      params: params
    });
  },

  callCustomEndpointFromChat: async <T = any>(
    apiSlug: string,
    version: string,
    endpointPath: string,
    messageReference: FunctionMessageReference,
    queryParams?: Record<string, any>
  ): Promise<ReadableStream<any>> => {
    const params = {} as any;
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        params[key] = value;
      });
    }
    return postStream<any>(`/live/${apiSlug}/${version}/${endpointPath}`, {
      params: params,
      body: messageReference
    });
  }
};
