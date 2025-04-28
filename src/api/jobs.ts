import { sharedClient, ApiResponse } from '@/core/shared-client.js';

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
 * Basic shape of a worker record, if you want to define it more precisely
 */
export interface Worker {
  id: string;
  name?: string;
  info?: string;
  startedAt: Date;
  stoppedAt?: Date;
  lastHeartbeat: Date;
}

// Define types for job events
export interface JobStatus {
  status: string;
  metadata?: Record<string, any>;
}

export interface JobEventPayload {
  partNumber?: number;
  etag?: string;
  progress?: number;
}

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

export const jobsApi = {
  /**
   * Submit a new job
   */
  submitJob: async (params: SubmitJobParams): Promise<ApiResponse<string>> => {
    return await sharedClient.post<string>('/v1/jobs/submit', {
      body: params,
    });
  },

  /**
   * Gets the status of a job directly by ID
   * @param jobId - ID of the job to check status for
   */
  getJobStatusById: async (jobId: string): Promise<ApiResponse<JobStatus>> => {
    return await sharedClient.get<JobStatus>(`/v1/jobs/${jobId}`);
  },

  /**
   * Gets a job by ID
   * @param jobId - ID of the job to retrieve
   */
  getJob: async (jobId: string): Promise<ApiResponse<JobStatus>> => {
    return await sharedClient.get<JobStatus>(`/v1/jobs/${jobId}`);
  },

  /**
   * Get job statuses, optionally filtered by user, project, or specific job
   */
  getJobStatus: async (
    params: GetJobStatusParams,
  ): Promise<ApiResponse<any>> => {
    return await sharedClient.get<any>('/v1/jobs/status', {
      params,
    });
  },

  /**
   * Get the history of a specific job
   */
  getJobHistory: async (jobId: string): Promise<ApiResponse<any>> => {
    return await sharedClient.get<any>(`/v1/jobs/history/${jobId}`);
  },

  /**
   * Subscribe to job events using Server-Sent Events (SSE)
   * Returns a ReadableStream of events.
   */
  subscribeJobEvents: (
    jobId: string,
    userId?: string,
    eventType?: string,
    signal?: AbortSignal,
  ) => {
    const url = `/v1/jobs/subscribe/${jobId}`;
    return sharedClient.createStream(url, {
      url,
      method: 'GET',
      params: {
        userId,
        eventType,
      },
      signal,
    });
  },

  /**
   * List the active job workers
   */
  listActiveWorkers: async (): Promise<ApiResponse<Worker[]>> => {
    return await sharedClient.get<Worker[]>('/v1/jobs/workers/active');
  },

  /**
   * Get jobs by their source information
   */
  getJobsBySource: async (params: {
    source?: string;
    sourceId?: string;
    eventType?: string;
    includeJobs?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    return await sharedClient.get<any>('/v1/jobs/by-source', {
      params: {
        source: params.source,
        sourceId: params.sourceId,
        eventType: params.eventType,
        includeJobs: params.includeJobs,
        limit: params.limit,
        offset: params.offset,
      },
    });
  },
};
