import { get } from '@/core/client.js';
import { ApiResponse } from '@/types/common.js';

export interface JobStatus {
  status: string;
  metadata?: Record<string, any>;
}

export const jobsApi = {
  /**
   * Gets the status of a job
   * @param jobId - ID of the job to check status for
   */
  getJobStatus: async (jobId: string): Promise<ApiResponse<JobStatus>> => {
    return await get<JobStatus>(`/v1/jobs/${jobId}`);
  },

  /**
   * Gets a job by ID
   * @param jobId - ID of the job to retrieve
   */
  getJob: async (jobId: string): Promise<ApiResponse<JobStatus>> => {
    return await get<JobStatus>(`/v1/jobs/${jobId}`);
  },
};
