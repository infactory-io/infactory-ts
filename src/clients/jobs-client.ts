import { HttpClient } from '../core/http-client.js';
import { ApiResponse } from '../types/common.js';

/**
 * Parameters for submitting a new job
 */
export interface SubmitJobParams {
  projectId?: string;
  userId?: string;
  metadata?: string;
  payload: Record<string, any>;
  jobType: string;
  parentJobId?: string;
  doNotSendToQueue?: boolean;
  sourceId?: string;
  source?: string;
  sourceEventType?: string;
  sourceMetadata?: string;
}

/**
 * Parameters for retrieving job status
 */
export interface GetJobStatusParams {
  userId?: string;
  projectId?: string;
  jobId?: string;
  lastN?: number;
}

/**
 * Basic shape of a worker record
 */
export interface Worker {
  id: string;
  name?: string;
  info?: string;
  startedAt: Date;
  stoppedAt?: Date;
  lastHeartbeat: Date;
}

/**
 * Job status information
 */
export interface JobStatus {
  status: string;
  metadata?: Record<string, any>;
}

/**
 * Payload for job events
 */
export interface JobEventPayload {
  partNumber?: number;
  etag?: string;
  progress?: number;
}

/**
 * Job event information
 */
export interface JobEvent {
  jobId: string;
  status?: 'uploading' | 'completed' | 'failed';
  eventType?: string;
  payload?: JobEventPayload;
  timestamp: number;
  extraData?: {
    progress: number;
  };
  dataLineage?: any;
  dataObject?: any;
}

/**
 * Parameters for retrieving jobs by source
 */
export interface GetJobsBySourceParams {
  source?: string;
  sourceId?: string;
  eventType?: string;
  includeJobs?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * Parses event data from a byte array
 * @param value - The byte array to parse
 * @returns An object containing the parsed data or an error message
 */
export function parseEventData(value: Uint8Array): {
  data?: JobEvent;
  error?: string;
} {
  try {
    const payload = new TextDecoder().decode(value);
    const lines = payload.split('\n').filter((line) => line.trim());

    const eventObj: { id?: string; eventType?: string; data?: JobEvent } = {};

    for (const line of lines) {
      // Better parsing of SSE format
      if (line.startsWith('id:')) {
        eventObj.id = line.substring(3).trim();
      } else if (line.startsWith('event:')) {
        eventObj.eventType = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        try {
          const jsonData = JSON.parse(line.substring(5).trim());
          eventObj.data = jsonData;
        } catch (e) {
          return {
            error: `Invalid JSON in event data: ${e instanceof Error ? String(e.message) : String(e)}`,
          };
        }
      }
    }

    // Handle special case for NewDataObjectEvent
    if (eventObj.eventType === 'NewDataObjectEvent') {
      if (eventObj.data?.dataLineage) {
        try {
          eventObj.data.dataLineage = JSON.parse(
            String(eventObj.data.dataLineage),
          );
        } catch (e) {
          return {
            error: `Invalid JSON in dataLineage: ${e instanceof Error ? String(e.message) : String(e)}`,
          };
        }
      }
      if (eventObj.data?.dataObject) {
        try {
          eventObj.data.dataObject = JSON.parse(
            String(eventObj.data.dataObject),
          );
        } catch (e) {
          return {
            error: `Invalid JSON in dataObject: ${e instanceof Error ? String(e.message) : String(e)}`,
          };
        }
      }
    }

    return { data: eventObj.data };
  } catch (error) {
    return {
      error: `Error parsing event: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Client for managing jobs in the Infactory API
 */
export class JobsClient {
  /**
   * Creates a new JobsClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Submit a new job
   * @param params - Parameters for submitting the job
   * @returns A promise that resolves to an API response containing the job ID
   */
  async submitJob(params: SubmitJobParams): Promise<ApiResponse<string>> {
    // Client-side validation
    if (!params.jobType) {
      throw new Error('Job type is required');
    }
    if (!params.payload) {
      throw new Error('Job payload is required');
    }

    return await this.httpClient.post<string>('/v1/jobs/submit', params);
  }

  /**
   * Gets the status of a job directly by ID
   * @param jobId - ID of the job to check status for
   * @returns A promise that resolves to an API response containing the job status
   */
  async getJobStatusById(jobId: string): Promise<ApiResponse<JobStatus>> {
    if (!jobId) {
      throw new Error('Job ID is required');
    }
    return await this.httpClient.get<JobStatus>(`/v1/jobs/${jobId}`);
  }

  /**
   * Gets a job by ID
   * @param jobId - ID of the job to retrieve
   * @returns A promise that resolves to an API response containing the job details
   */
  async getJob(jobId: string): Promise<ApiResponse<JobStatus>> {
    if (!jobId) {
      throw new Error('Job ID is required');
    }
    return await this.httpClient.get<JobStatus>(`/v1/jobs/${jobId}`);
  }

  /**
   * Get job statuses, optionally filtered by user, project, or specific job
   * @param params - Parameters for filtering job statuses
   * @returns A promise that resolves to an API response containing job status information
   */
  async getJobStatus(params: GetJobStatusParams): Promise<ApiResponse<any>> {
    return await this.httpClient.get<any>('/v1/jobs/status', params);
  }

  /**
   * Get the history of a specific job
   * @param jobId - ID of the job to retrieve history for
   * @returns A promise that resolves to an API response containing job history
   */
  async getJobHistory(jobId: string): Promise<ApiResponse<any>> {
    if (!jobId) {
      throw new Error('Job ID is required');
    }
    return await this.httpClient.get<any>(`/v1/jobs/history/${jobId}`);
  }

  /**
   * Subscribe to job events using Server-Sent Events (SSE)
   * @param jobId - ID of the job to subscribe to
   * @param userId - Optional user ID for filtering events
   * @param eventType - Optional event type for filtering events
   * @param signal - Optional AbortSignal for cancelling the subscription
   * @returns A ReadableStream of events
   */
  async subscribeJobEvents(
    jobId: string,
    userId?: string,
    eventType?: string,
    signal?: AbortSignal,
  ): Promise<ReadableStream<Uint8Array>> {
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    const endpoint = `/v1/jobs/subscribe/${jobId}`;
    const options = {
      url: endpoint,
      method: 'GET',
      params: {
        userId,
        eventType,
      },
    };
    return this.httpClient.createStream(endpoint, options, signal);
  }

  /**
   * List the active job workers
   * @returns A promise that resolves to an API response containing active worker information
   */
  async listActiveWorkers(): Promise<ApiResponse<Worker[]>> {
    return await this.httpClient.get<Worker[]>('/v1/jobs/workers/active');
  }

  /**
   * Get jobs by their source information
   * @param params - Parameters for filtering jobs by source
   * @returns A promise that resolves to an API response containing matching jobs
   */
  async getJobsBySource(
    params: GetJobsBySourceParams,
  ): Promise<ApiResponse<any>> {
    return await this.httpClient.get<any>('/v1/jobs/by-source', params);
  }
}
