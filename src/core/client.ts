'use client';
import { ApiResponse } from '@/types/common.js';
// This file works on the client and server
// If on the client, it will call the /api/infactory endpoint
// If on the server, it will call the API directly as implemented in /api/infactory/[...slug]/route.ts

import { getConfig } from '@/config/index.js';

const API_BASE_URL = '/api/infactory';

interface RequestArgsNoBody {
  params?: Record<string, any>;
  options?: RequestInit;
}

interface RequestArgs<T> extends RequestArgsNoBody {
  body?: T;
}

class InfactorySDKError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'InfactorySDKError';
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  isAPIRequest: boolean = true,
): Promise<ApiResponse<T>> {
  options.method = (options.method || 'GET').toUpperCase();
  const defaultHeaders: HeadersInit = {};
  if (options.body) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config = getConfig(true, false);
  if (!config) {
    throw new Error(
      'Config not found or invalid, set NF_API_KEY and NF_BASE_URL environment variables',
    );
  }

  const headers = new Headers({
    ...defaultHeaders,
    ...(options.headers as Record<string, string>),
  });

  // Only add Cookie if document exists and has a cookie
  if (typeof document !== 'undefined' && document.cookie) {
    headers.set('Cookie', document.cookie);
  }

  // Add Bearer token if API key is available
  if (config.api_key) {
    headers.set('Authorization', `Bearer ${config.api_key}`);
  }

  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers,
  };

  const isServer = typeof window === 'undefined';
  let fullUrl = '';
  if (isAPIRequest) {
    fullUrl = `${isServer ? config.base_url : API_BASE_URL}${endpoint}`;
  } else {
    fullUrl = `${config.base_url}${endpoint}`;
  }

  console.log('SDK API request:', {
    isServer,
    method: options.method,
    url: fullUrl,
    headers: fetchOptions.headers,
    body: options.body,
  });

  const response = await fetch(fullUrl, fetchOptions);

  if (!response.ok) {
    const errorBody = await response.text();
    const errorMessage = `API ${options.method} request failed ${response.status}: ${fullUrl} ${JSON.stringify(fetchOptions)} ${errorBody}`;
    if (response.status < 500) {
      return {
        error: {
          status: response.status,
          message: errorMessage,
        },
      };
    }
    throw new InfactorySDKError(response.status, errorMessage);
  }

  const data = await response.json();
  return { data: data as T };
}

export async function streamApi(
  endpoint: string,
  options: RequestInit = {},
  isAPIRequest: boolean = true,
  signal?: AbortSignal,
): Promise<ReadableStream> {
  options.method = (options.method || 'GET').toUpperCase();
  const defaultHeaders: HeadersInit = {};

  const config = getConfig(true, false);
  if (!config) {
    throw new Error(
      'Config not found or invalid, set NF_API_KEY and NF_BASE_URL environment variables',
    );
  }
  // Don't set Content-Type for FormData - let browser handle it
  if (options.body && !(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const headers = new Headers({
    ...defaultHeaders,
    ...(options.headers as Record<string, string>),
  });

  // Only add Cookie if document exists and has a cookie
  if (typeof document !== 'undefined' && document.cookie) {
    headers.set('Cookie', document.cookie);
  }

  // Add Bearer token if API key is available
  if (config.api_key) {
    headers.set('Authorization', `Bearer ${config.api_key}`);
  }

  // Add Accept header for SSE
  headers.set('Accept', 'text/event-stream');

  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers,
  };

  const isServer = typeof window === 'undefined';
  let fullUrl = '';
  if (isAPIRequest) {
    fullUrl = `${isServer ? config.base_url : API_BASE_URL}${endpoint}`;
  } else {
    fullUrl = `${config.base_url}${endpoint}`;
  }

  console.log('SDK API stream request:', {
    isServer,
    method: options.method,
    url: fullUrl,
    headers: fetchOptions.headers,
    body: options.body,
  });
  const response = await fetch(fullUrl, { ...fetchOptions, signal });

  if (!response.ok) {
    const errorBody = await response.text();
    let errorJson = {};
    let errorMessage = '';
    console.error(errorBody);
    try {
      errorJson = JSON.parse(errorBody || '{}');
      errorMessage = `API ${options.method} request failed ${response.status}: ${JSON.stringify(errorJson)}`;
    } catch (e) {
      errorMessage = `API ${options.method} request failed ${response.status}: ${errorBody}`;
    }
    if (response.status < 500) {
      return new ReadableStream({
        start(controller) {
          const error = JSON.stringify({
            error: {
              status: response.status,
              message: errorMessage,
            },
          });
          controller.enqueue(new TextEncoder().encode(error));
          controller.close();
        },
      });
    }
    throw new InfactorySDKError(response.status, errorMessage);
  }
  return response.body as ReadableStream;
}

export async function get<T>(
  endpoint: string,
  args: RequestArgsNoBody = {},
  isAPIRequest: boolean = true,
): Promise<ApiResponse<T>> {
  const url = addParamsToPath(endpoint, args.params);
  return fetchApi<T>(
    url,
    {
      ...args.options,
      method: 'GET',
    },
    isAPIRequest,
  );
}

export async function getStream(
  endpoint: string,
  args: RequestArgsNoBody = {},
) {
  const { params = {}, options = {} } = args;
  return streamApi(addParamsToPath(endpoint, params), {
    ...options,
    method: 'GET',
  });
}

export async function post<T, U = any>(
  endpoint: string,
  args: RequestArgs<U> = {},
  isAPIRequest: boolean = true,
): Promise<ApiResponse<T>> {
  const url = addParamsToPath(endpoint, args.params);
  return fetchApi<T>(
    url,
    {
      ...args.options,
      method: 'POST',
      body: args.body ? JSON.stringify(args.body) : undefined,
    },
    isAPIRequest,
  );
}

export async function postStream<U = any>(
  endpoint: string,
  args: RequestArgs<U> = {},
  isAPIRequest: boolean = true,
  signal?: AbortSignal,
) {
  const { params = {}, body, options = {} } = args;
  // if body is FormData, browser will handle it correctly
  if (body instanceof FormData) {
    return streamApi(
      addParamsToPath(endpoint, params),
      {
        ...options,
        method: 'POST',
        body: body,
      },
      isAPIRequest,
      signal,
    );
  }
  return streamApi(
    addParamsToPath(endpoint, params),
    {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    },
    isAPIRequest,
    signal,
  );
}

export async function put<T, U = any>(
  endpoint: string,
  args: RequestArgs<U> = {},
): Promise<ApiResponse<T>> {
  const url = addParamsToPath(endpoint, args.params);
  return fetchApi<T>(url, {
    ...args.options,
    method: 'PUT',
    body: args.body ? JSON.stringify(args.body) : undefined,
  });
}

export async function putStream<U = any>(
  endpoint: string,
  args: RequestArgs<U> = {},
) {
  const { params = {}, body, options = {} } = args;
  return streamApi(addParamsToPath(endpoint, params), {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function patch<T, U = any>(
  endpoint: string,
  args: RequestArgs<U> = {},
): Promise<ApiResponse<T>> {
  const url = addParamsToPath(endpoint, args.params);
  return fetchApi<T>(url, {
    ...args.options,
    method: 'PATCH',
    body: args.body ? JSON.stringify(args.body) : undefined,
  });
}

export async function patchStream<U = any>(
  endpoint: string,
  args: RequestArgs<U> = {},
) {
  const { params = {}, body, options = {} } = args;
  return streamApi(addParamsToPath(endpoint, params), {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function del<T>(
  endpoint: string,
  args: RequestArgsNoBody = {},
): Promise<ApiResponse<T>> {
  const url = addParamsToPath(endpoint, args.params);
  return fetchApi<T>(url, {
    ...args.options,
    method: 'DELETE',
  });
}

function buildQueryString(params: Record<string, any>): string {
  const query = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');
  return query ? `?${query}` : '';
}

function addParamsToPath(
  relative_path: string,
  params: Record<string, any> = {},
): string {
  const config = getConfig(true, false);
  if (!config) {
    throw new Error(
      'Config not found or invalid, set NF_API_KEY and NF_BASE_URL environment variables',
    );
  }
  const url = new URL(relative_path, config.base_url);
  const existingParams = Object.fromEntries(url.searchParams.entries());
  const mergedParams = { ...existingParams, ...params };
  const queryString = buildQueryString(mergedParams);
  return `${url.pathname}${queryString}`;
}

export async function uploadFile<T>(
  endpoint: string,
  params: Record<string, any> = {},
  file: File,
  formFields: Record<string, any> = {},
  options: RequestInit = {},
) {
  const formData = new FormData();
  formData.append('file', file);

  // Add additional form fields
  Object.entries(formFields).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });

  return fetchApi<T>(addParamsToPath(endpoint, params), {
    ...options,
    method: 'POST',
    body: formData,
    headers: {
      ...options.headers,
    },
  });
}

export async function downloadFile<T>(
  endpoint: string,
  params: Record<string, any> = {},
  defaultFilename: string = 'download.file',
): Promise<ApiResponse<T>> {
  try {
    const apiUrl = addParamsToPath(endpoint, params);
    const isServer = typeof window === 'undefined';

    if (isServer) {
      // Server-side fallback, return data only
      return fetchApi<T>(apiUrl, { method: 'GET' });
    }

    // Client-side: fetch the file and trigger download
    const fullUrl = `${API_BASE_URL}${apiUrl}`;
    console.log('SDK File download request:', fullUrl);

    const response = await fetch(fullUrl, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(
        `Download failed: ${response.status} ${response.statusText}`,
      );
    }

    // Get filename from headers or use default
    const contentDisposition = response.headers.get('content-disposition');
    let filename = defaultFilename;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch && filenameMatch[1]) {
        filename = filenameMatch[1];
      }
    }

    // Convert the response to a blob and download it
    const blob = await response.blob();
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;

    // Append to the document, click it, and clean up
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(objectUrl);

    return { data: { success: true, filename } as unknown as T };
  } catch (error) {
    console.error('Error downloading file:', error);
    return {
      error: {
        status: 500,
        message:
          error instanceof Error ? error.message : 'Failed to download file',
      },
    };
  }
}
