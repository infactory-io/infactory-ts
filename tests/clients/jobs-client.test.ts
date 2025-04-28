import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  JobsClient,
  SubmitJobParams,
  JobStatus,
  Worker,
} from '../../src/clients/jobs-client.js';
import { HttpClient } from '../../src/core/http-client.js';
import { createErrorFromStatus } from '../../src/errors/index.js';

// Mock the HttpClient
vi.mock('../../src/core/http-client.js', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      createStream: vi.fn(),
    })),
  };
});

describe('JobsClient', () => {
  let jobsClient: JobsClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a new mock HttpClient instance
    mockHttpClient = new HttpClient({
      baseUrl: 'https://api.infactory.ai',
      apiKey: 'test-api-key',
    });

    // Create a new JobsClient with the mock HttpClient
    jobsClient = new JobsClient(mockHttpClient);
  });

  describe('submitJob', () => {
    it('should call the correct endpoint to submit a job', async () => {
      // Mock request data
      const submitParams: SubmitJobParams = {
        projectId: 'project-1',
        jobType: 'data-import',
        payload: { sourceFile: 'data.csv' },
      };

      // Mock response data
      const mockJobId = 'job-123';

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockJobId,
      });

      // Call the method
      const result = await jobsClient.submitJob(submitParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/jobs/submit',
        submitParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockJobId);
    });

    it('should throw an error if required parameters are missing', async () => {
      // Test missing jobType
      const invalidParams1: SubmitJobParams = {
        projectId: 'project-1',
        payload: { sourceFile: 'data.csv' },
      } as unknown as SubmitJobParams; // Cast to bypass TS error

      await expect(jobsClient.submitJob(invalidParams1)).rejects.toThrow(
        'Job type is required',
      );

      // Test missing payload
      const invalidParams2: SubmitJobParams = {
        projectId: 'project-1',
        jobType: 'data-import',
      } as SubmitJobParams; // Cast to bypass TS error

      await expect(jobsClient.submitJob(invalidParams2)).rejects.toThrow(
        'Job payload is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should handle errors when submitting a job', async () => {
      // Mock request data
      const submitParams: SubmitJobParams = {
        projectId: 'project-1',
        jobType: 'data-import',
        payload: { sourceFile: 'data.csv' },
      };

      // Setup the mock to return an error
      const mockError = createErrorFromStatus(
        500,
        'server_error',
        'Internal server error',
      );

      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        error: mockError,
      });

      // Call the method
      const result = await jobsClient.submitJob(submitParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/jobs/submit',
        submitParams,
      );

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getJobStatusById', () => {
    it('should call the correct endpoint to get job status by ID', async () => {
      // Mock response data
      const mockJobStatus: JobStatus = {
        status: 'completed',
        metadata: { completedAt: '2025-01-01T00:00:00Z' },
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockJobStatus,
      });

      // Call the method
      const result = await jobsClient.getJobStatusById('job-123');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/jobs/job-123');

      // Verify the result
      expect(result.data).toEqual(mockJobStatus);
    });

    it('should throw an error if job ID is missing', async () => {
      await expect(jobsClient.getJobStatusById('')).rejects.toThrow(
        'Job ID is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should handle errors when getting job status', async () => {
      // Setup the mock to return an error
      const mockError = createErrorFromStatus(
        404,
        'not_found',
        'Job not found',
      );

      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        error: mockError,
      });

      // Call the method
      const result = await jobsClient.getJobStatusById('non-existent-job');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/jobs/non-existent-job',
      );

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getJob', () => {
    it('should call the correct endpoint to get a job by ID', async () => {
      // Mock response data
      const mockJobStatus: JobStatus = {
        status: 'completed',
        metadata: { completedAt: '2025-01-01T00:00:00Z' },
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockJobStatus,
      });

      // Call the method
      const result = await jobsClient.getJob('job-123');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/jobs/job-123');

      // Verify the result
      expect(result.data).toEqual(mockJobStatus);
    });

    it('should throw an error if job ID is missing', async () => {
      await expect(jobsClient.getJob('')).rejects.toThrow('Job ID is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('getJobStatus', () => {
    it('should call the correct endpoint to get job statuses', async () => {
      // Mock request parameters
      const params = {
        projectId: 'project-1',
        lastN: 10,
      };

      // Mock response data
      const mockJobStatuses = [
        {
          jobId: 'job-123',
          status: 'completed',
          metadata: { completedAt: '2025-01-01T00:00:00Z' },
        },
        {
          jobId: 'job-456',
          status: 'failed',
          metadata: { error: 'Process failed' },
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockJobStatuses,
      });

      // Call the method
      const result = await jobsClient.getJobStatus(params);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/jobs/status',
        params,
      );

      // Verify the result
      expect(result.data).toEqual(mockJobStatuses);
    });
  });

  describe('getJobHistory', () => {
    it('should call the correct endpoint to get job history', async () => {
      // Mock response data
      const mockJobHistory = [
        {
          timestamp: '2025-01-01T00:00:00Z',
          status: 'created',
        },
        {
          timestamp: '2025-01-01T00:01:00Z',
          status: 'processing',
        },
        {
          timestamp: '2025-01-01T00:02:00Z',
          status: 'completed',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockJobHistory,
      });

      // Call the method
      const result = await jobsClient.getJobHistory('job-123');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/jobs/history/job-123',
      );

      // Verify the result
      expect(result.data).toEqual(mockJobHistory);
    });

    it('should throw an error if job ID is missing', async () => {
      await expect(jobsClient.getJobHistory('')).rejects.toThrow(
        'Job ID is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('subscribeJobEvents', () => {
    it('should create a stream for job events', async () => {
      // Mock response stream
      const mockStream = new ReadableStream();

      // Setup the mock response
      vi.mocked(mockHttpClient.createStream).mockResolvedValueOnce(mockStream);

      // Call the method
      const result = await jobsClient.subscribeJobEvents(
        'job-123',
        'user-1',
        'status',
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.createStream).toHaveBeenCalledWith(
        '/v1/jobs/subscribe/job-123',
        {
          url: '/v1/jobs/subscribe/job-123',
          method: 'GET',
          params: {
            userId: 'user-1',
            eventType: 'status',
          },
        },
        undefined,
      );

      // Verify the result
      expect(result).toEqual(mockStream);
    });

    it('should throw an error if job ID is missing', async () => {
      await expect(jobsClient.subscribeJobEvents('')).rejects.toThrow(
        'Job ID is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.createStream).not.toHaveBeenCalled();
    });
  });

  describe('listActiveWorkers', () => {
    it('should call the correct endpoint to list active workers', async () => {
      // Mock response data
      const mockWorkers: Worker[] = [
        {
          id: 'worker-1',
          name: 'Worker 1',
          info: 'Processing data imports',
          startedAt: new Date('2025-01-01T00:00:00Z'),
          lastHeartbeat: new Date('2025-01-01T00:05:00Z'),
        },
        {
          id: 'worker-2',
          name: 'Worker 2',
          info: 'Processing notifications',
          startedAt: new Date('2025-01-01T00:00:00Z'),
          lastHeartbeat: new Date('2025-01-01T00:05:00Z'),
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockWorkers,
      });

      // Call the method
      const result = await jobsClient.listActiveWorkers();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/jobs/workers/active',
      );

      // Verify the result
      expect(result.data).toEqual(mockWorkers);
    });
  });

  describe('getJobsBySource', () => {
    it('should call the correct endpoint to get jobs by source', async () => {
      // Mock request parameters
      const params = {
        source: 'github',
        sourceId: 'repo-123',
        eventType: 'push',
        limit: 5,
      };

      // Mock response data
      const mockJobs = [
        {
          id: 'job-123',
          source: 'github',
          sourceId: 'repo-123',
          eventType: 'push',
          status: 'completed',
        },
        {
          id: 'job-456',
          source: 'github',
          sourceId: 'repo-123',
          eventType: 'push',
          status: 'failed',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockJobs,
      });

      // Call the method
      const result = await jobsClient.getJobsBySource(params);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/jobs/by-source',
        params,
      );

      // Verify the result
      expect(result.data).toEqual(mockJobs);
    });
  });
});
