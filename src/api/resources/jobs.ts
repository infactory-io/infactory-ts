import { sharedClient, type ApiResponse } from '@/core/shared-client.js';

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
    return await sharedClient.get<JobStatus>(`/v1/jobs/${jobId}`);
  },

  /**
   * Gets a job by ID
   * @param jobId - ID of the job to retrieve
   */
  getJob: async (jobId: string): Promise<ApiResponse<JobStatus>> => {
    return await sharedClient.get<JobStatus>(`/v1/jobs/${jobId}`);
  },
};
