/**
 * Error handling utilities for the Infactory SDK
 */
import { InfactoryAPIError, createErrorFromStatus } from '@/errors/index.js';
import {
  isHttpValidationError,
  formatValidationErrors,
} from '@/types/errors.js';

/**
 * Process an error response from the API
 *
 * @param response The HTTP response object
 * @param method The HTTP method that was used (GET, POST, etc.)
 * @returns An object containing the error data and message
 */
export async function processErrorResponse(
  response: Response,
  method: string,
): Promise<{
  errorData: any;
  errorMessage: string;
}> {
  let errorData: any = {};
  let errorMessage = '';

  try {
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorBody = await response.json();
      errorData = errorBody;

      // Handle validation errors according to OpenAPI schema
      if (isHttpValidationError(errorBody)) {
        errorMessage = formatValidationErrors(errorBody.detail);
        errorData = { validationErrors: errorBody.detail };
      } else {
        errorMessage =
          errorBody.message ||
          errorBody.detail ||
          `API request failed with status: ${response.status}`;
      }
    } else {
      const errorBody = await response.text();
      errorMessage = `API ${method} request failed ${response.status}: ${errorBody}`;
    }
  } catch {
    errorMessage = `API request failed with status: ${response.status}`;
  }

  return { errorData, errorMessage };
}

/**
 * Create an appropriate error object from an API response
 *
 * @param response The HTTP response object
 * @param method The HTTP method that was used (GET, POST, etc.)
 * @returns A promise resolving to an InfactoryAPIError
 */
export async function createErrorFromResponse(
  response: Response,
  method: string,
): Promise<InfactoryAPIError> {
  const { errorData, errorMessage } = await processErrorResponse(
    response,
    method,
  );
  const requestId = response.headers.get('x-request-id') || undefined;

  return createErrorFromStatus(
    response.status,
    errorData.code || 'api_error',
    errorMessage,
    requestId,
    errorData.details || errorData,
  );
}
