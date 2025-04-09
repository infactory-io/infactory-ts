// 'use client';
// import { ApiResponse } from '@/types/common.js';
// // This file works on the client and server
// // If on the client, it will call the /api/infactory endpoint
// // If on the server, it will call the API directly as implemented in /api/infactory/[...slug]/route.ts

// import { getConfig } from '@/config/index.js';
// import {
//   InfactoryAPIError,
//   NetworkError,
//   ValidationError,
//   createErrorFromStatus,
// } from '@/errors/index.js';

// const API_BASE_URL = '/api/infactory';

// interface RequestArgsNoBody {
//   params?: Record<string, any>;
//   options?: RequestInit;
//   headers?: Record<string, string>;
// }

// interface RequestArgs<T> extends RequestArgsNoBody {
//   body?: T;
// }

// /**
//  * @deprecated Use the HttpClient class instead.
//  * This function will be removed in a future release.
//  */
// async function fetchApi<T>(
//   endpoint: string,
//   options: RequestInit = {},
//   isAPIRequest: boolean = true,
// ): Promise<ApiResponse<T>> {
//   try {
//     options.method = (options.method || 'GET').toUpperCase();
//     const defaultHeaders: HeadersInit = {};
//     if (options.body) {
//       defaultHeaders['Content-Type'] = 'application/json';
//     }

//     const config = getConfig(true, false);
//     if (!config) {
//       throw new ValidationError(
//         'Config not found or invalid, set NF_API_KEY and NF_BASE_URL environment variables',
//         undefined,
//         { requiredEnvVars: ['NF_API_KEY', 'NF_BASE_URL'] },
//       );
//     }

//     const headers = new Headers({
//       ...defaultHeaders,
//       ...(options.headers as Record<string, string>),
//     });

//     // Only add Cookie if document exists and has a cookie
//     if (typeof document !== 'undefined' && document.cookie) {
//       headers.set('Cookie', document.cookie);
//     }

//     // Add Bearer token if API key is available
//     if (config.apiKey) {
//       headers.set('Authorization', `Bearer ${config.apiKey}`);
//     }

//     const fetchOptions: RequestInit = {
//       ...options,
//       credentials: 'include',
//       headers,
//     };

//     const isServer = typeof window === 'undefined';
//     let fullUrl = '';
//     if (isAPIRequest) {
//       fullUrl = `${isServer ? config.baseUrl : API_BASE_URL}${endpoint}`;
//     } else {
//       fullUrl = `${config.baseUrl}${endpoint}`;
//     }

//     console.log('SDK API request:', {
//       isServer,
//       method: options.method,
//       url: fullUrl,
//       headers: fetchOptions.headers,
//       body: options.body,
//     });

//     const response = await fetch(fullUrl, fetchOptions);

//     if (!response.ok) {
//       // Attempt to parse error response as JSON
//       let errorData: any = {};
//       let errorMessage = '';

//       try {
//         const contentType = response.headers.get('content-type');
//         if (contentType && contentType.includes('application/json')) {
//           const errorBody = await response.json();
//           errorData = errorBody;
//           errorMessage =
//             errorBody.message ||
//             errorBody.detail ||
//             `API request failed with status: ${response.status}`;
//         } else {
//           const errorBody = await response.text();
//           errorMessage = `API ${options.method} request failed ${response.status}: ${errorBody}`;
//         }
//       } catch (e) {
//         errorMessage = `API request failed with status: ${response.status}`;
//       }

//       // Get request ID from headers if available
//       const requestId = response.headers.get('x-request-id') || undefined;

//       // Create appropriate error based on status code
//       const error = createErrorFromStatus(
//         response.status,
//         errorData.code || 'api_error',
//         errorMessage,
//         requestId,
//         errorData.details || errorData,
//       );

//       // For client-facing errors (4xx), return in the response
//       // For server errors (5xx), throw the error
//       if (response.status < 500) {
//         return { error };
//       }

//       throw error;
//     }

//     const data = await response.json();
//     return { data: data as T };
//   } catch (error) {
//     // Handle network errors and other unexpected exceptions
//     if (error instanceof InfactoryAPIError) {
//       // Re-throw if it's already our error type
//       throw error;
//     }

//     console.error('Unexpected error in API request:', error);
//     const message =
//       error instanceof Error ? error.message : 'Unknown error occurred';

//     // Create a NetworkError for network-related issues
//     if (error instanceof TypeError && message.includes('fetch')) {
//       throw new NetworkError(`Network error: ${message}`, {
//         originalError: error,
//       });
//     }

//     // For other unexpected errors
//     throw new InfactoryAPIError(
//       500,
//       'unexpected_error',
//       `An unexpected error occurred: ${message}`,
//       undefined,
//       { originalError: error },
//     );
//   }
// }

// /**
//  * @deprecated Use the HttpClient class instead.
//  * This function will be removed in a future release.
//  */
// async function streamApi(
//   endpoint: string,
//   options: RequestInit = {},
//   isAPIRequest: boolean = true,
//   signal?: AbortSignal,
// ): Promise<ReadableStream> {
//   try {
//     options.method = (options.method || 'GET').toUpperCase();
//     const defaultHeaders: HeadersInit = {};

//     const config = getConfig(true, false);
//     if (!config) {
//       throw new ValidationError(
//         'Config not found or invalid, set NF_API_KEY and NF_BASE_URL environment variables',
//         undefined,
//         { requiredEnvVars: ['NF_API_KEY', 'NF_BASE_URL'] },
//       );
//     }
//     // Don't set Content-Type for FormData - let browser handle it
//     if (options.body && !(options.body instanceof FormData)) {
//       defaultHeaders['Content-Type'] = 'application/json';
//     }

//     const headers = new Headers({
//       ...defaultHeaders,
//       ...(options.headers as Record<string, string>),
//     });

//     // Only add Cookie if document exists and has a cookie
//     if (typeof document !== 'undefined' && document.cookie) {
//       headers.set('Cookie', document.cookie);
//     }

//     // Add Bearer token if API key is available
//     if (config.apiKey) {
//       headers.set('Authorization', `Bearer ${config.apiKey}`);
//     }

//     // Add Accept header for SSE
//     headers.set('Accept', 'text/event-stream');

//     const fetchOptions: RequestInit = {
//       ...options,
//       credentials: 'include',
//       headers,
//     };

//     const isServer = typeof window === 'undefined';
//     let fullUrl = '';
//     if (isAPIRequest) {
//       fullUrl = `${isServer ? config.baseUrl : API_BASE_URL}${endpoint}`;
//     } else {
//       fullUrl = `${config.baseUrl}${endpoint}`;
//     }

//     console.log('SDK API stream request:', {
//       isServer,
//       method: options.method,
//       url: fullUrl,
//       headers: fetchOptions.headers,
//       body: options.body,
//     });
//     const response = await fetch(fullUrl, { ...fetchOptions, signal });

//     if (!response.ok) {
//       // Attempt to parse error response as JSON
//       let errorData: any = {};
//       let errorMessage = '';

//       try {
//         const contentType = response.headers.get('content-type');
//         if (contentType && contentType.includes('application/json')) {
//           const errorBody = await response.json();
//           errorData = errorBody;
//           errorMessage =
//             errorBody.message ||
//             errorBody.detail ||
//             `API request failed with status: ${response.status}`;
//         } else {
//           const errorBody = await response.text();
//           errorMessage = `API ${options.method} request failed ${response.status}: ${errorBody}`;
//         }
//       } catch (e) {
//         errorMessage = `API request failed with status: ${response.status}`;
//       }

//       // Get request ID from headers if available
//       const requestId = response.headers.get('x-request-id') || undefined;

//       // Create appropriate error based on status code
//       const error = createErrorFromStatus(
//         response.status,
//         errorData.code || 'api_error',
//         errorMessage,
//         requestId,
//         errorData.details || errorData,
//       );

//       // For streaming API calls with client-facing errors (4xx),
//       // return a ReadableStream with the error
//       if (response.status < 500) {
//         return new ReadableStream({
//           start(controller) {
//             const errorJson = JSON.stringify({
//               error: error.toJSON(),
//             });
//             controller.enqueue(new TextEncoder().encode(errorJson));
//             controller.close();
//           },
//         });
//       }

//       throw error;
//     }
//     return response.body as ReadableStream;
//   } catch (error) {
//     // Handle network errors and other unexpected exceptions
//     if (error instanceof InfactoryAPIError) {
//       // Re-throw if it's already our error type
//       throw error;
//     }

//     console.error('Unexpected error in streaming API request:', error);
//     const message =
//       error instanceof Error ? error.message : 'Unknown error occurred';

//     // Create a NetworkError for network-related issues
//     if (error instanceof TypeError && message.includes('fetch')) {
//       throw new NetworkError(`Network error: ${message}`, {
//         originalError: error,
//       });
//     }

//     // For other unexpected errors
//     throw new InfactoryAPIError(
//       500,
//       'unexpected_error',
//       `An unexpected error occurred: ${message}`,
//       undefined,
//       { originalError: error },
//     );
//   }
// }

// async function get<T>(
//   endpoint: string,
//   args: RequestArgsNoBody = {},
//   isAPIRequest: boolean = true,
// ): Promise<ApiResponse<T>> {
//   const url = addParamsToPath(endpoint, args.params);
//   return fetchApi<T>(
//     url,
//     {
//       ...args.options,
//       method: 'GET',
//     },
//     isAPIRequest,
//   );
// }

// async function getStream(
//   endpoint: string,
//   args: RequestArgsNoBody = {},
// ) {
//   const { params = {}, options = {} } = args;
//   return streamApi(addParamsToPath(endpoint, params), {
//     ...options,
//     method: 'GET',
//   });
// }

// async function post<T, U = any>(
//   endpoint: string,
//   args: RequestArgs<U> = {},
//   isAPIRequest: boolean = true,
// ): Promise<ApiResponse<T>> {
//   const url = addParamsToPath(endpoint, args.params);
//   return fetchApi<T>(
//     url,
//     {
//       ...args.options,
//       method: 'POST',
//       body: args.body ? JSON.stringify(args.body) : undefined,
//     },
//     isAPIRequest,
//   );
// }

// async function postStream<U = any>(
//   endpoint: string,
//   args: RequestArgs<U> = {},
//   isAPIRequest: boolean = true,
//   signal?: AbortSignal,
// ) {
//   const { params = {}, body, options = {} } = args;
//   // if body is FormData, browser will handle it correctly
//   if (body instanceof FormData) {
//     return streamApi(
//       addParamsToPath(endpoint, params),
//       {
//         ...options,
//         method: 'POST',
//         body: body,
//       },
//       isAPIRequest,
//       signal,
//     );
//   }
//   return streamApi(
//     addParamsToPath(endpoint, params),
//     {
//       ...options,
//       method: 'POST',
//       body: JSON.stringify(body),
//     },
//     isAPIRequest,
//     signal,
//   );
// }

// async function put<T, U = any>(
//   endpoint: string,
//   args: RequestArgs<U> = {},
// ): Promise<ApiResponse<T>> {
//   const url = addParamsToPath(endpoint, args.params);
//   return fetchApi<T>(url, {
//     ...args.options,
//     method: 'PUT',
//     body: args.body ? JSON.stringify(args.body) : undefined,
//   });
// }

// async function putStream<U = any>(
//   endpoint: string,
//   args: RequestArgs<U> = {},
// ) {
//   const { params = {}, body, options = {} } = args;
//   return streamApi(addParamsToPath(endpoint, params), {
//     ...options,
//     method: 'PUT',
//     body: body ? JSON.stringify(body) : undefined,
//   });
// }

// async function patch<T, U = any>(
//   endpoint: string,
//   args: RequestArgs<U> = {},
// ): Promise<ApiResponse<T>> {
//   const url = addParamsToPath(endpoint, args.params);
//   return fetchApi<T>(url, {
//     ...args.options,
//     method: 'PATCH',
//     body: args.body ? JSON.stringify(args.body) : undefined,
//   });
// }

// async function patchStream<U = any>(
//   endpoint: string,
//   args: RequestArgs<U> = {},
// ) {
//   const { params = {}, body, options = {} } = args;
//   return streamApi(addParamsToPath(endpoint, params), {
//     ...options,
//     method: 'PATCH',
//     body: body ? JSON.stringify(body) : undefined,
//   });
// }

// async function del<T>(
//   endpoint: string,
//   args: RequestArgsNoBody = {},
// ): Promise<ApiResponse<T>> {
//   const url = addParamsToPath(endpoint, args.params);
//   return fetchApi<T>(url, {
//     ...args.options,
//     method: 'DELETE',
//   });
// }

// function buildQueryString(params: Record<string, any>): string {
//   const query = Object.entries(params)
//     .filter(([_, value]) => value !== undefined && value !== null)
//     .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
//     .join('&');
//   return query ? `?${query}` : '';
// }

// function addParamsToPath(
//   relativePath: string,
//   params: Record<string, any> = {},
// ): string {
//   const config = getConfig(true, false);
//   if (!config) {
//     throw new ValidationError(
//       'Config not found or invalid, set NF_API_KEY and NF_BASE_URL environment variables',
//       undefined,
//       { requiredEnvVars: ['NF_API_KEY', 'NF_BASE_URL'] },
//     );
//   }
//   const url = new URL(relativePath, config.baseUrl);
//   const existingParams = Object.fromEntries(url.searchParams.entries());
//   const mergedParams = { ...existingParams, ...params };
//   const queryString = buildQueryString(mergedParams);
//   return `${url.pathname}${queryString}`;
// }

// async function uploadFile<T>(
//   endpoint: string,
//   params: Record<string, any> = {},
//   file: File,
//   formFields: Record<string, any> = {},
//   options: RequestInit = {},
// ) {
//   const formData = new FormData();
//   formData.append('file', file);

//   // Add additional form fields
//   Object.entries(formFields).forEach(([key, value]) => {
//     if (value !== undefined && value !== null) {
//       formData.append(key, String(value));
//     }
//   });

//   return fetchApi<T>(addParamsToPath(endpoint, params), {
//     ...options,
//     method: 'POST',
//     body: formData,
//     headers: {
//       ...options.headers,
//     },
//   });
// }

// async function downloadFile<T>(
//   endpoint: string,
//   params: Record<string, any> = {},
//   defaultFilename: string = 'download.file',
// ): Promise<ApiResponse<T>> {
//   try {
//     const apiUrl = addParamsToPath(endpoint, params);
//     const isServer = typeof window === 'undefined';

//     if (isServer) {
//       // Server-side fallback, return data only
//       return fetchApi<T>(apiUrl, { method: 'GET' });
//     }

//     // Client-side: fetch the file and trigger download
//     const fullUrl = `${API_BASE_URL}${apiUrl}`;
//     console.log('SDK File download request:', fullUrl);

//     const response = await fetch(fullUrl, {
//       method: 'GET',
//       credentials: 'include',
//     });

//     if (!response.ok) {
//       throw new Error(
//         `Download failed: ${response.status} ${response.statusText}`,
//       );
//     }

//     // Get filename from headers or use default
//     const contentDisposition = response.headers.get('content-disposition');
//     let filename = defaultFilename;

//     if (contentDisposition) {
//       const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
//       if (filenameMatch && filenameMatch[1]) {
//         filename = filenameMatch[1];
//       }
//     }

//     // Convert the response to a blob and download it
//     const blob = await response.blob();
//     const objectUrl = window.URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = objectUrl;
//     link.download = filename;

//     // Append to the document, click it, and clean up
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     window.URL.revokeObjectURL(objectUrl);

//     return { data: { success: true, filename } as unknown as T };
//   } catch (error) {
//     console.error('Error downloading file:', error);
//     return {
//       error: new InfactoryAPIError(
//         500,
//         'download_error',
//         error instanceof Error ? error.message : 'Failed to download file',
//         undefined,
//         { originalError: error },
//       ),
//     };
//   }
// }
