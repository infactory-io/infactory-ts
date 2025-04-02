import { get, post, postStream } from '@/core/client.js';
import { ApiResponse } from '@/types/common.js';

/**
 * Parameters for submitting a new job
 */
export interface SubmitJobParams {
  project_id?: string;
  user_id?: string;
  metadata?: string;
  payload: Record<string, any>;
  job_type: string;
  parent_job_id?: string;
  do_not_send_to_queue?: boolean;
  source_id?: string;
  source?: string;
  source_event_type?: string;
  source_metadata?: string;
}

/**
 * Parameters for retrieving job status
 */
export interface GetJobStatusParams {
  user_id?: string;
  project_id?: string;
  job_id?: string;
  last_n?: number;
}

/**
 * Basic shape of a worker record, if you want to define it more precisely
 */
export interface Worker {
  id: string;
  name?: string;
  info?: string;
  started_at: Date;
  stopped_at?: Date;
  last_heartbeat: Date;
}

// Define types for job events
export interface JobEventPayload {
  part_number?: number;
  etag?: string;
  progress?: number;
}

export interface JobEvent {
  job_id: string;
  status?: 'uploading' | 'completed' | 'failed';
  event_type?: string;
  payload?: JobEventPayload;
  timestamp: number;
  extra_data?: {
    progress: number;
  };
  data_lineage?: any;
  data_object?: any;
}
export function parseEventData(value: Uint8Array): {
  data?: JobEvent;
  error?: string;
} {
  try {
    const payload = new TextDecoder().decode(value);
    const lines = payload.split('\n').filter((line) => line.trim());

    const eventObj: { id?: string; event_type?: string; data?: JobEvent } = {};

    for (const line of lines) {
      // Better parsing of SSE format
      if (line.startsWith('id:')) {
        eventObj.id = line.substring(3).trim();
      } else if (line.startsWith('event:')) {
        eventObj.event_type = line.substring(6).trim();
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
    if (eventObj.event_type === 'NewDataObjectEvent') {
      if (eventObj.data?.data_lineage) {
        try {
          eventObj.data.data_lineage = JSON.parse(
            String(eventObj.data.data_lineage),
          );
        } catch (e) {
          return {
            error: `Invalid JSON in data_lineage: ${e instanceof Error ? String(e.message) : String(e)}`,
          };
        }
      }
      if (eventObj.data?.data_object) {
        try {
          eventObj.data.data_object = JSON.parse(
            String(eventObj.data.data_object),
          );
        } catch (e) {
          return {
            error: `Invalid JSON in data_object: ${e instanceof Error ? String(e.message) : String(e)}`,
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
    return await post<string>('/v1/jobs/submit', {
      body: params,
    });
  },

  /**
   * Get job statuses, optionally filtered by user, project, or specific job
   */
  getJobStatus: async (
    params: GetJobStatusParams,
  ): Promise<ApiResponse<any>> => {
    return await get<any>('/v1/jobs/status', {
      params,
    });
  },

  /**
   * Get the history of a specific job
   */
  getJobHistory: async (jobId: string): Promise<ApiResponse<any>> => {
    return await get<any>(`/v1/jobs/history/${jobId}`);
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
    return postStream<any>(
      `/v1/jobs/subscribe/${jobId}`,
      {
        params: {
          user_id: userId,
          event_type: eventType,
        },
      },
      false,
      signal,
    );
  },

  /**
   * List the active job workers
   */
  listActiveWorkers: async (): Promise<ApiResponse<Worker[]>> => {
    return await get<Worker[]>('/v1/jobs/workers/active');
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
    return await get<any>('/v1/jobs/by-source', {
      params: {
        source: params.source,
        source_id: params.sourceId,
        event_type: params.eventType,
        include_jobs: params.includeJobs,
        limit: params.limit,
        offset: params.offset,
      },
    });
  },
};
