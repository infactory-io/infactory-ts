/**
 * Utilities for handling streaming responses
 */
import { ApiResponse } from '@/types/common.js';
import { InfactoryAPIError } from '@/errors/index.js';

/**
 * Represents a response that could be either a ReadableStream or an ApiResponse
 */
export type StreamOrApiResponse<T> =
  | ReadableStream<Uint8Array>
  | ApiResponse<T>;

/**
 * Helper function to determine if a response is a ReadableStream
 */
export function isReadableStream(response: any): response is ReadableStream {
  if (response === null || response === undefined) return false;
  return typeof response.getReader === 'function';
}

/**
 * Helper function to determine if a response is an ApiResponse
 */
export function isApiResponse<T>(response: any): response is ApiResponse<T> {
  if (response === null || response === undefined) return false;
  return (
    (response as ApiResponse<T>).data !== undefined ||
    (response as ApiResponse<T>).error !== undefined
  );
}

/**
 * Process a stream response and convert it to an ApiResponse
 * @param stream The stream to process
 * @returns A promise that resolves to an ApiResponse
 */
export async function processStreamToApiResponse<T>(
  stream: ReadableStream<Uint8Array>,
): Promise<ApiResponse<T>> {
  const reader = stream.getReader();
  let result = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Convert the chunk to a string
      const chunk = new TextDecoder().decode(value);
      result += chunk;
    }

    // Try to parse the result as JSON
    try {
      const parsedResult = JSON.parse(result);

      // Check if the result contains an error
      if (parsedResult.error) {
        return { error: parsedResult.error };
      }

      // Otherwise, return the data
      return { data: parsedResult as T };
    } catch (e) {
      // If we can't parse as JSON, return the raw result as data but also include parsing error information
      // This allows consumers to know there was a parsing failure while still accessing the raw data
      return {
        data: result as unknown as T,
        error: new InfactoryAPIError(
          400,
          'json_parse_error',
          e instanceof Error ? e.message : 'Failed to parse response as JSON',
          undefined,
          {
            originalError: e,
            rawData:
              result.substring(0, 200) + (result.length > 200 ? '...' : ''),
            isParseError: true, // Use metadata field to indicate parse error
          },
        ),
      };
    }
  } catch (error) {
    // Handle stream processing errors
    console.error('Error processing stream:', error);
    return {
      error: new InfactoryAPIError(
        500,
        'stream_processing_error',
        error instanceof Error ? error.message : 'Error processing stream',
        undefined,
        { originalError: error },
      ),
    };
  } finally {
    reader.releaseLock();
  }
}
