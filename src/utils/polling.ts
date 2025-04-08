/**
 * Utilities for handling polling operations with improved error handling,
 * cancellation support, and exponential backoff.
 */

import { ServerError } from '../errors/index.js';

/**
 * Error thrown when a polling operation times out
 */
export class PollingTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PollingTimeoutError';
  }
}

/**
 * Error thrown when a polling operation is cancelled
 */
export class PollingCancelledError extends Error {
  constructor(message: string = 'Polling operation was cancelled') {
    super(message);
    this.name = 'PollingCancelledError';
  }
}

/**
 * Options for the polling function
 */
export interface PollingOptions<T> {
  /**
   * Maximum time to wait in seconds before timing out
   * @default 300
   */
  timeout?: number;

  /**
   * Initial polling interval in seconds
   * @default 1
   */
  initialPollInterval?: number;

  /**
   * Maximum polling interval in seconds
   * @default 30
   */
  maxPollInterval?: number;

  /**
   * Backoff multiplier for increasing poll interval
   * @default 1.5
   */
  backoffMultiplier?: number;

  /**
   * Optional AbortSignal for cancellation support
   */
  abortSignal?: AbortSignal;

  /**
   * Custom condition to determine if polling should end
   * @param result The result to check
   * @returns Whether to end polling with this result
   */
  endCondition?: (result: T) => boolean;

  /**
   * Custom error check to determine if an error occurred and polling should end
   * @param result The result to check
   * @returns Error to throw if an error is detected, or undefined to continue polling
   */
  errorCheck?: (result: T) => Error | undefined;

  /**
   * Log polling attempts (useful for debugging)
   * @default false
   */
  debug?: boolean;
}

/**
 * Default polling options
 */
const defaultPollingOptions: Required<
  Omit<PollingOptions<any>, 'abortSignal' | 'endCondition' | 'errorCheck'>
> = {
  timeout: 300,
  initialPollInterval: 1,
  maxPollInterval: 30,
  backoffMultiplier: 1.5,
  debug: false,
};

/**
 * Generic polling function with exponential backoff, proper error handling, and cancellation support
 * @param operation The async operation to poll
 * @param options Polling options
 * @returns The final result
 * @throws PollingTimeoutError when the polling times out
 * @throws PollingCancelledError when the polling is cancelled
 * @throws Error from the operation or from the errorCheck function
 */
export async function poll<T>(
  operation: () => Promise<T>,
  options: PollingOptions<T> = {},
): Promise<T> {
  const {
    timeout,
    initialPollInterval,
    maxPollInterval,
    backoffMultiplier,
    abortSignal,
    endCondition,
    errorCheck,
    debug,
  } = { ...defaultPollingOptions, ...options };

  // Start timing
  const startTime = Date.now();
  const timeoutMs = timeout * 1000;
  const endTime = startTime + timeoutMs;

  // Set up polling interval (will increase with backoff)
  let currentPollInterval = initialPollInterval * 1000;
  let attempts = 0;

  try {
    while (Date.now() < endTime) {
      // Check if operation was cancelled
      if (abortSignal?.aborted) {
        throw new PollingCancelledError();
      }

      // Execute the operation
      attempts++;
      const result = await operation();

      if (debug) {
        console.log(`Polling attempt ${attempts}: received result`, result);
      }

      // Check for errors if an error checker was provided
      if (errorCheck) {
        const error = errorCheck(result);
        if (error) {
          throw error;
        }
      }

      // Check if the result satisfies the end condition
      if (!endCondition || endCondition(result)) {
        return result;
      }

      // Calculate remaining time
      const remainingTime = endTime - Date.now();

      // No time left for another attempt
      if (remainingTime <= 0) {
        break;
      }

      // Apply exponential backoff, but cap at maximum interval
      currentPollInterval = Math.min(
        currentPollInterval * backoffMultiplier,
        maxPollInterval * 1000,
      );

      // Don't wait longer than the remaining time
      const waitTime = Math.min(currentPollInterval, remainingTime);

      if (debug) {
        console.log(`Waiting ${waitTime / 1000}s before next poll attempt`);
      }

      // Wait before polling again
      await new Promise<void>((resolve, reject) => {
        // Set up timeout
        const timeoutId = setTimeout(() => {
          // Clean up abort listener if it exists
          if (abortSignal) {
            abortSignal.removeEventListener('abort', abortHandler);
          }
          resolve();
        }, waitTime);

        // Set up abort handler if abort signal was provided
        const abortHandler = () => {
          clearTimeout(timeoutId);
          reject(new PollingCancelledError());
        };

        // Add abort listener if abort signal was provided
        if (abortSignal) {
          abortSignal.addEventListener('abort', abortHandler, { once: true });
        }
      });
    }

    // If we get here, we've timed out
    throw new PollingTimeoutError(
      `Polling timed out after ${timeout} seconds (${attempts} attempts)`,
    );
  } catch (error) {
    // If it's already one of our error types, rethrow as is
    if (
      error instanceof PollingTimeoutError ||
      error instanceof PollingCancelledError
    ) {
      throw error;
    }

    // Otherwise wrap in a ServerError with a more descriptive message
    throw error instanceof Error
      ? new ServerError(`Polling failed: ${error.message}`)
      : new ServerError(`Polling failed: ${String(error)}`);
  }
}
