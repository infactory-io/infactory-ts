import { get, post, del, patch, postStream } from '@/core/client.js';
import {
  Datasource,
  CreateDatasourceParams,
  ApiResponse,
  DatasourceWithDatalines,
  Graph,
} from '@/types/common.js';
import { SubmitJobParams } from '@/api/jobs.js';
import * as path from 'path';
import * as fs from 'fs';
import FormData from 'form-data';

export const datasourcesApi = {
  getProjectDatasources: async (
    projectId: string,
  ): Promise<ApiResponse<Datasource[]>> => {
    return await get<Datasource[]>(`/v1/datasources/project/${projectId}`);
  },

  getDatasourceWithDatalines: async (
    datasourceId: string,
  ): Promise<ApiResponse<DatasourceWithDatalines>> => {
    return await get<DatasourceWithDatalines>(
      `/v1/datasources/${datasourceId}/with_datalines`,
    );
  },

  getDatasource: async (
    datasourceId: string,
  ): Promise<ApiResponse<Datasource>> => {
    return await get<Datasource>(`/v1/datasources/${datasourceId}`);
  },

  createDatasource: async (
    params: CreateDatasourceParams,
  ): Promise<ApiResponse<Datasource>> => {
    // Extract the project_id from the params using pop
    return await post<Datasource>(`/v1/datasources`, {
      body: params,
    });
  },

  updateDatasource: async (
    datasourceId: string,
    params: Partial<CreateDatasourceParams>,
  ): Promise<ApiResponse<Datasource>> => {
    return await patch<Datasource>(`/v1/datasources/${datasourceId}`, {
      body: params,
    });
  },

  deleteDatasource: async (
    datasourceId: string,
  ): Promise<ApiResponse<void>> => {
    return await del<void>(`/v1/datasources/${datasourceId}?permanent=false`);
  },

  cloneDatasource: async (
    datasourceId: string,
    newProjectId: string,
  ): Promise<ApiResponse<Datasource>> => {
    return await post<Datasource>(`/v1/datasources/${datasourceId}/clone`, {
      body: { new_project_id: newProjectId },
    });
  },

  uploadDatasource: async (
    projectId: string,
    datasourceId: string | undefined,
    formData: FormData,
    jobId: string,
  ): Promise<ReadableStream> => {
    // The FormData already contains the source_name if provided
    return postStream(`/v1/actions/load/${projectId}`, {
      params: { datasource_id: datasourceId, job_id: jobId },
      body: formData,
      options: {
        headers: {
          Accept: 'text/event-stream',
          // Don't set Content-Type - let browser set it with boundary for FormData
        },
      },
    });
  },

  getOntologyGraph: async (
    datasourceId: string,
  ): Promise<ApiResponse<Graph>> => {
    return await get<Graph>(`/v1/datasources/${datasourceId}/ontology_mapping`);
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
    const datasourceResponse = await post<Datasource>(`/v1/datasources`, {
      body: {
        name: actualDatasourceName,
        project_id: projectId,
        type: datasourceType,
      },
    });

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
      const jobResponse = await post<string>('/v1/jobs/submit', {
        body: {
          project_id: projectId,
          job_type: 'upload',
          payload: jobPayload,
          do_not_send_to_queue: true,
          source_id: datasource.id,
          source: 'datasource',
          source_event_type: 'file_upload',
          source_metadata: JSON.stringify(jobMetadata),
        },
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

    // We need a way to get the API key
    // This will be passed through the headers

    // Upload the file
    // Use node-fetch or other fetch implementation that supports FormData
    // This implementation will depend on the actual client setup
    const uploadResponse = await global.fetch(
      `https://daily-api.infactory.ai/v1/actions/load/${projectId}?job_id=${jobId}&datasource_id=${datasource.id}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.INFACTORY_API_KEY || ''}`,
          // Let the FormData set its own headers including boundary
        },
        // @ts-expect-error - FormData should be compatible with BodyInit but TypeScript doesn't recognize it
        body: formData,
      },
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
    }

    return {
      datasource,
      jobId,
      uploadResponse,
    };
  },
};
