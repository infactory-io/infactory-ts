/**
 * Unit tests for the polling utility and refactored polling methods
 */

import { jest } from '@jest/globals';
import {
  poll,
  PollingTimeoutError,
  PollingCancelledError,
} from '../utils/polling.js';

// Define test interfaces for our test cases
interface CountResult {
  count: number;
}

interface StatusResult {
  status: string;
}

describe('Polling Utility', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('should resolve when condition is met', async () => {
    // Setup a mock operation that succeeds on the third call
    const mockOperation = jest.fn<() => Promise<CountResult>>();
    mockOperation
      .mockResolvedValueOnce({ count: 0 })
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 2 });

    // Create a promise that will resolve when poll resolves
    const pollPromise = poll<CountResult>(mockOperation, {
      timeout: 10,
      initialPollInterval: 1,
      endCondition: (result: CountResult) => result.count >= 2,
    });

    // Fast-forward timers to simulate waiting for the poll interval
    jest.advanceTimersByTime(1000); // First poll interval
    await Promise.resolve(); // Let promises resolve
    jest.advanceTimersByTime(1000); // Second poll interval
    await Promise.resolve(); // Let promises resolve

    // Verify the result
    const result = await pollPromise;
    expect(result).toEqual({ count: 2 });
    expect(mockOperation).toHaveBeenCalledTimes(3);
  });

  test('should implement exponential backoff', async () => {
    // Setup a mock operation that never succeeds within our timeframe
    const mockOperation = jest
      .fn<() => Promise<CountResult>>()
      .mockResolvedValue({ count: 0 });

    // Start polling with exponential backoff
    const pollPromise = poll<CountResult>(mockOperation, {
      timeout: 10,
      initialPollInterval: 1,
      maxPollInterval: 4,
      backoffMultiplier: 2,
      endCondition: (result: CountResult) => result.count > 0,
    });

    // First interval: 1 second
    jest.advanceTimersByTime(1000);
    await Promise.resolve();
    expect(mockOperation).toHaveBeenCalledTimes(1);

    // Second interval: 2 seconds (1 * 2)
    jest.advanceTimersByTime(2000);
    await Promise.resolve();
    expect(mockOperation).toHaveBeenCalledTimes(2);

    // Third interval: 4 seconds (2 * 2, capped at maxPollInterval)
    jest.advanceTimersByTime(4000);
    await Promise.resolve();
    expect(mockOperation).toHaveBeenCalledTimes(3);

    // Fourth interval: 4 seconds (still at max)
    jest.advanceTimersByTime(4000);
    await Promise.resolve();
    expect(mockOperation).toHaveBeenCalledTimes(4);

    // We'll timeout soon (we've used 11 seconds out of 10)
    await expect(pollPromise).rejects.toThrow(PollingTimeoutError);
  });

  test('should throw PollingTimeoutError when timeout is reached', async () => {
    // Setup a mock operation that never succeeds
    const mockOperation = jest
      .fn<() => Promise<StatusResult>>()
      .mockResolvedValue({ status: 'pending' });

    // Start polling with a short timeout
    const pollPromise = poll<StatusResult>(mockOperation, {
      timeout: 5,
      initialPollInterval: 1,
      endCondition: (result: StatusResult) => result.status === 'completed',
    });

    // Advance time past the timeout
    jest.advanceTimersByTime(6000);
    await Promise.resolve();

    // Verify timeout error is thrown
    await expect(pollPromise).rejects.toThrow(PollingTimeoutError);
  });

  test('should throw PollingCancelledError when aborted', async () => {
    // Setup abort controller
    const abortController = new AbortController();
    const signal = abortController.signal;

    // Setup a mock operation
    const mockOperation = jest
      .fn<() => Promise<StatusResult>>()
      .mockResolvedValue({ status: 'pending' });

    // Start polling with abort signal
    const pollPromise = poll<StatusResult>(mockOperation, {
      timeout: 10,
      initialPollInterval: 1,
      abortSignal: signal,
      endCondition: (result: StatusResult) => result.status === 'completed',
    });

    // First interval completes
    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    // Abort during the next interval
    abortController.abort();
    await Promise.resolve();

    // Verify cancellation error is thrown
    await expect(pollPromise).rejects.toThrow(PollingCancelledError);
  });

  test('should propagate errors from the operation', async () => {
    // Setup a mock operation that throws an error
    const testError = new Error('Operation failed');
    const mockOperation = jest
      .fn<() => Promise<StatusResult>>()
      .mockResolvedValueOnce({ status: 'pending' })
      .mockRejectedValueOnce(testError);

    // Start polling
    const pollPromise = poll<StatusResult>(mockOperation, {
      timeout: 10,
      initialPollInterval: 1,
      endCondition: (result: StatusResult) => result.status === 'completed',
    });

    // First interval completes successfully
    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    // Second interval throws error
    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    // Verify error is propagated
    await expect(pollPromise).rejects.toThrow('Operation failed');
  });
});
