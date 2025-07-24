/**
 * Utilities for handling event-based streaming responses
 */
import { ApiResponse } from '@/types/common.js';
import { InfactoryAPIError } from '@/errors/index.js';
import { isReadableStream } from './stream.js';

/**
 * Event types for SSE (Server-Sent Events)
 */
export enum EventType {
  CHAT_MESSAGE = 'chat_message',
  TOOL_CALL = 'tool_call',
  TOOL_RESULT = 'tool_result',
  ERROR = 'error',
  COMPLETE = 'complete',
  DATA = 'data',
  QUERY_PROGRAM = 'QueryProgram',
  MESSAGES = 'messages',
  USAGE = 'usage',
  LLM_CONTENT = 'LLMContent',
}

/**
 * Interface for parsed SSE events
 */
export interface EventData {
  type: EventType;
  data: any;
  id?: string;
  retry?: number;
}

/**
 * Options for processing event streams
 */
export interface EventStreamOptions {
  onEvent?: (event: EventData) => void;
  onComplete?: (data: any) => void;
  onError?: (error: InfactoryAPIError) => void;
}

/**
 * Process a server-sent events (SSE) stream
 * @param stream The SSE stream to process
 * @param options Options for handling events
 * @returns A promise that resolves when the stream is complete
 */
export async function processEventStream<T>(
  streamOrResponse: ReadableStream<Uint8Array> | ApiResponse<T>,
  options: EventStreamOptions = {},
): Promise<ApiResponse<T>> {
  // If it's already an ApiResponse, just return it
  if (!isReadableStream(streamOrResponse)) {
    return streamOrResponse;
  }

  const reader = streamOrResponse.getReader();
  let buffer = '';
  let finalResult: any = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Convert the chunk to a string and add to buffer
      const chunk = new TextDecoder().decode(value);
      buffer += chunk;

      // console.log('buffer', buffer);

      // Process events in the buffer
      const events = parseEvents(buffer);
      if (events.length > 0) {
        // Update the buffer to remove processed events
        const lastEvent = events[events.length - 1];
        const lastEventIndex = buffer.lastIndexOf(`id: ${lastEvent.id}`);
        if (lastEventIndex !== -1) {
          const endOfLastEvent = buffer.indexOf('\n\n', lastEventIndex) + 2;
          buffer = buffer.substring(endOfLastEvent);
        }

        // Process each event
        for (const event of events) {
          // Call the event handler if provided
          if (options.onEvent) {
            options.onEvent(event);
          }

          // Handle specific event types
          switch (event.type) {
            case EventType.COMPLETE:
              finalResult = event.data;
              if (options.onComplete) {
                options.onComplete(event.data);
              }
              break;
            case EventType.ERROR:
              if (options.onError) {
                const error = new InfactoryAPIError(
                  event.data.status || 500,
                  event.data.code || 'stream_error',
                  event.data.message || 'Error in event stream',
                  event.data.requestId,
                  event.data.details,
                );
                options.onError(error);
              }
              break;
          }
        }
      }
    }

    // Return the final result
    return { data: finalResult || ({} as T) };
  } catch (error) {
    console.error('Error processing event stream:', error);
    const apiError = new InfactoryAPIError(
      500,
      'event_stream_processing_error',
      error instanceof Error ? error.message : 'Error processing event stream',
      undefined,
      { originalError: error },
    );

    if (options.onError) {
      options.onError(apiError);
    }

    return { error: apiError };
  } finally {
    reader.releaseLock();
  }
}

/**
 * Parse Server-Sent Events from a buffer
 * @param buffer String buffer containing SSE data
 * @returns Array of parsed events
 */
export function parseEvents(buffer: string): EventData[] {
  const events: EventData[] = [];
  const eventChunks = buffer
    .split('\n\n')
    .filter((chunk) => chunk.trim() !== '');

  for (const chunk of eventChunks) {
    const event: Partial<EventData> = { data: {} };
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (!line || line.trim() === '') continue;

      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;

      const field = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      switch (field) {
        case 'event':
          event.type = value as EventType;
          break;
        case 'data':
          try {
            event.data = JSON.parse(value);
          } catch {
            event.data = value;
          }
          break;
        case 'id':
          event.id = value;
          break;
        case 'retry':
          event.retry = parseInt(value, 10);
          break;
      }
    }

    // Default to DATA event type if none specified
    if (!event.type) {
      event.type = EventType.DATA;
    }

    events.push(event as EventData);
  }

  return events;
}

/**
 * Parse the SSE event-style response into a list of events
 * @param sseData The SSE data to parse
 * @returns An array of events
 */
// export function parseSSEEvents(sseData: string) {
//   const events: { event: string; data: any }[] = [];
//   // Split by double newlines (end of event)
//   const rawEvents = sseData.split(/\r?\n\r?\n/);
//   for (const rawEvent of rawEvents) {
//       if (!rawEvent.trim()) continue;
//       const lines = rawEvent.split(/\r?\n/);
//       let eventType = '';
//       const dataLines: string[] = [];
//       for (const line of lines) {
//           if (line.startsWith('event: ')) {
//               eventType = line.slice(7).trim();
//           } else if (line.startsWith('data: ')) {
//               dataLines.push(line.slice(6));
//           }
//       }
//       if (eventType && dataLines.length > 0) {
//           // Try to parse JSON, fallback to string
//           let data: any = dataLines.join('\n');
//           try {
//               data = JSON.parse(data);
//           } catch {
//               // leave as string
//           }
//           events.push({ event: eventType, data });
//       }
//   }
//   return events;
// }

/**
 * Process a chat stream response with specialized handling for chat events
 * @param stream The chat stream to process
 * @param options Options for handling chat events
 * @returns A promise that resolves when the chat is complete
 */
export async function processChatStream<T>(
  streamOrResponse: ReadableStream<Uint8Array> | ApiResponse<T>,
  options: {
    onMessage?: (message: any) => void;
    onToolCall?: (toolCall: any) => void;
    onToolResult?: (result: any) => void;
    onComplete?: (data: any) => void;
    onError?: (error: InfactoryAPIError) => void;
  } = {},
): Promise<ApiResponse<T>> {
  return processEventStream<T>(streamOrResponse, {
    onEvent: (event) => {
      switch (event.type) {
        case EventType.CHAT_MESSAGE:
          if (options.onMessage) {
            options.onMessage(event.data);
          }
          break;
        case EventType.TOOL_CALL:
          if (options.onToolCall) {
            options.onToolCall(event.data);
          }
          break;
        case EventType.TOOL_RESULT:
          if (options.onToolResult) {
            options.onToolResult(event.data);
          }
          break;
      }
    },
    onComplete: options.onComplete,
    onError: options.onError,
  });
}
