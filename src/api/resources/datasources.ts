import type {
  Datasource,
  CreateDatasourceParams,
  DatasourceWithDatalines,
  Graph,
} from '@/types/common.js';
import { SubmitJobParams } from '@/api/jobs.js';
import * as path from 'path';
import * as fs from 'fs';
import FormData from 'form-data';
import { sharedClient, type ApiResponse } from '@/core/shared-client.js';

export const datasourcesApi = {
  getProjectDatasources: async (
    projectId: string,
  ): Promise<ApiResponse<Datasource[]>> => {
    return await sharedClient.get<Datasource[]>(
      `/v1/datasources/project/${projectId}`,
    );
  },

  getDatasourceWithDatalines: async (
    datasourceId: string,
  ): Promise<ApiResponse<DatasourceWithDatalines>> => {
    return await sharedClient.get<DatasourceWithDatalines>(
      `/v1/datasources/${datasourceId}/with_datalines`,
    );
  },

  getDatasource: async (
    datasourceId: string,
  ): Promise<ApiResponse<Datasource>> => {
    return await sharedClient.get<Datasource>(
      `/v1/datasources/${datasourceId}`,
    );
  },

  createDatasource: async (
    params: CreateDatasourceParams,
  ): Promise<ApiResponse<Datasource>> => {
    return await sharedClient.post<Datasource>(`/v1/datasources`, params);
  },

  updateDatasource: async (
    datasourceId: string,
    params: Partial<CreateDatasourceParams>,
  ): Promise<ApiResponse<Datasource>> => {
    return await sharedClient.patch<Datasource>(
      `/v1/datasources/${datasourceId}`,
      params,
    );
  },

  deleteDatasource: async (
    datasourceId: string,
  ): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(
      `/v1/datasources/${datasourceId}?permanent=false`,
    );
  },

  cloneDatasource: async (
    datasourceId: string,
    newProjectId: string,
  ): Promise<ApiResponse<Datasource>> => {
    return await sharedClient.post<Datasource>(
      `/v1/datasources/${datasourceId}/clone`,
      {
        new_project_id: newProjectId,
      },
    );
  },

  uploadDatasource: async (
    projectId: string,
    datasourceId: string | undefined,
    formData: FormData,
    jobId: string,
  ): Promise<ReadableStream> => {
    return await sharedClient.createStream(`/v1/actions/load/${projectId}`, {
      url: `/v1/actions/load/${projectId}`,
      method: 'POST',
      params: { datasource_id: datasourceId, job_id: jobId },
      body: formData as unknown as BodyInit,
      headers: {
        Accept: 'text/event-stream',
      },
    });
  },

  getOntologyGraph: async (
    datasourceId: string,
  ): Promise<ApiResponse<Graph>> => {
    return await sharedClient.get<Graph>(
      `/v1/datasources/${datasourceId}/ontology_mapping`,
    );
  },

  /**
   * Upload a CSV file to a project by creating a datasource and uploading a file in one operation
   * @param projectId - Project ID
   * @param csvFilePath - Path to the CSV file to upload
   * @param datasourceName - Optional name for the datasource (defaults to file name + timestamp)
   * @param customSubmitJob - Optional function to submit the job (if you need custom job handling)
   * @returns The created datasource and job ID
   */
  uploadCsvFile: async (
    projectId: string,
    csvFilePath: string,
    datasourceName?: string,
    customSubmitJob?: (client: any, params: SubmitJobParams) => Promise<string>,
  ): Promise<{
    datasource: Datasource;
    jobId: string;
    uploadResponse: Response;
  }> => {
    // Generate datasource name if not provided
    const now = new Date().toISOString().replace(/:/g, '-');
    const fileName = path.basename(csvFilePath);
    const actualDatasourceName = datasourceName || `${fileName} ${now}`;

    // Infer type from file extension
    const fileExtension = path.extname(csvFilePath).toLowerCase();
    const datasourceType = fileExtension === '.csv' ? 'csv' : 'csv'; // Default to CSV

    // Create the datasource
    const datasourceResponse = await sharedClient.post<Datasource>(
      `/v1/datasources`,
      {
        name: actualDatasourceName,
        project_id: projectId,
        type: datasourceType,
      },
    );

    if (datasourceResponse.error) {
      throw datasourceResponse.error;
    }

    const datasource = datasourceResponse.data;
    if (!datasource) {
      throw new Error('Error creating datasource: Datasource not found');
    }

    // Get file info
    const fileSize = fs.statSync(csvFilePath).size;

    // Create a job payload for the upload
    const jobPayload = {
      datasource_id: datasource.id,
      file_name: fileName,
      file_size: fileSize,
      dataset_name: actualDatasourceName,
    };

    const jobMetadata = {
      file_name: fileName,
      file_size: fileSize,
      dataset_name: actualDatasourceName,
    };

    // Submit the job using custom function or default approach
    let jobId: string;

    if (customSubmitJob) {
      // Use the provided custom submit job function
      jobId = await customSubmitJob(null, {
        project_id: projectId,
        job_type: 'upload',
        payload: jobPayload,
        do_not_send_to_queue: true,
        source_id: datasource.id,
        source: 'datasource',
        source_event_type: 'file_upload',
        source_metadata: JSON.stringify(jobMetadata),
      });
    } else {
      // Use standard job submission
      const jobResponse = await sharedClient.post<string>('/v1/jobs/submit', {
        project_id: projectId,
        job_type: 'upload',
        payload: jobPayload,
        do_not_send_to_queue: true,
        source_id: datasource.id,
        source: 'datasource',
        source_event_type: 'file_upload',
        source_metadata: JSON.stringify(jobMetadata),
      });

      if (jobResponse.error) {
        throw jobResponse.error;
      }

      jobId = jobResponse.data || '';
    }

    if (!jobId) {
      throw new Error('Error: No job ID received from job submission');
    }

    // Create FormData with the file
    const formData = new FormData();
    formData.append('file', fs.createReadStream(csvFilePath));
    formData.append('datasource_id', datasource.id);
    formData.append('job_id', jobId);

    // Upload the file using the shared client
    const uploadResponse = await sharedClient.request<any>({
      url: `/v1/actions/load/${projectId}`,
      method: 'POST',
      params: {
        job_id: jobId,
        datasource_id: datasource.id,
      },
      body: formData as unknown as BodyInit,
    });

    if (uploadResponse.error) {
      throw uploadResponse.error;
    }

    return {
      datasource,
      jobId,
      uploadResponse: uploadResponse as unknown as Response,
    };
  },
};
