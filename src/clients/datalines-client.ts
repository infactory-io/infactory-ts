import { HttpClient } from '../core/http-client.js';
import { ApiResponse } from '../types/common.js';
import { Dataline, CreateDatalineParams } from '../types/common.js';

/**
 * Client for managing datalines in the Infactory API
 */
export class DatalinesClient {
  /**
   * Creates a new DatalinesClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Get all datalines, optionally filtered by datasource
   * @param datasourceId - Optional datasource ID to filter datalines
   * @returns A promise that resolves to an API response containing an array of datalines
   */
  async getDatalines(datasourceId?: string): Promise<ApiResponse<Dataline[]>> {
    const params = datasourceId ? { datasourceId } : {};
    return await this.httpClient.get<Dataline[]>(`/v1/datalines`, { params });
  }

  /**
   * Get datalines for a specific project
   * @param projectId - The ID of the project
   * @returns A promise that resolves to an API response containing an array of datalines
   */
  async getProjectDatalines(
    projectId: string,
  ): Promise<ApiResponse<Dataline[]>> {
    return await this.httpClient.get<Dataline[]>(
      `/v1/datalines/project/${projectId}`,
    );
  }

  /**
   * Get a specific dataline by ID
   * @param datalineId - The ID of the dataline to retrieve
   * @returns A promise that resolves to an API response containing the dataline
   */
  async getDataline(datalineId: string): Promise<ApiResponse<Dataline>> {
    return await this.httpClient.get<Dataline>(`/v1/datalines/${datalineId}`);
  }

  /**
   * Create a new dataline
   * @param params - Parameters for creating the dataline
   * @returns A promise that resolves to an API response containing the created dataline
   */
  async createDataline(
    params: CreateDatalineParams,
  ): Promise<ApiResponse<Dataline>> {
    return await this.httpClient.post<Dataline>('/v1/datalines', params);
  }

  /**
   * Update an existing dataline
   * @param datalineId - The ID of the dataline to update
   * @param params - Parameters for updating the dataline
   * @returns A promise that resolves to an API response containing the updated dataline
   */
  async updateDataline(
    datalineId: string,
    params: Partial<CreateDatalineParams>,
  ): Promise<ApiResponse<Dataline>> {
    const dataModel = params.dataModel;
    if (dataModel) delete params.dataModel;

    if (dataModel) {
      return await this.httpClient.patch<Dataline>(
        `/v1/datalines/${datalineId}`,
        {
          ...params,
          data_model: dataModel,
        },
      );
    } else {
      return await this.httpClient.patch<Dataline>(
        `/v1/datalines/${datalineId}`,
        params,
      );
    }
  }

  /**
   * Update a dataline's schema code
   * @param datalineId - The ID of the dataline
   * @param schemaCode - The new schema code
   * @returns A promise that resolves to an API response containing the updated dataline
   */
  async updateDatalineSchema(
    datalineId: string,
    schemaCode: string,
  ): Promise<ApiResponse<Dataline>> {
    return await this.httpClient.patch<Dataline>(
      `/v1/datalines/${datalineId}/schema`,
      schemaCode,
    );
  }

  /**
   * Delete a dataline
   * @param datalineId - The ID of the dataline to delete
   * @param permanent - Whether to permanently delete the dataline (defaults to false)
   * @returns A promise that resolves to an API response with the deletion result
   */
  async deleteDataline(
    datalineId: string,
    permanent: boolean = false,
  ): Promise<ApiResponse<void>> {
    return await this.httpClient.delete<void>(`/v1/datalines/${datalineId}`, {
      permanent: permanent,
    });
  }
}
