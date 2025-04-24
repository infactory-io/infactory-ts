import { HttpClient } from '../core/http-client.js';
import { ApiResponse, Project } from '../types/common.js';

/**
 * Parameters for creating a project
 */
export type CreateProjectParams = Pick<Project, 'name' | 'description'> & {
  teamId: string;
};

/**
 /**
 * Parameters for updating a project
 */
export type UpdateProjectParams = Partial<
  Pick<Project, 'name' | 'description'>
> & {
  teamId?: string;
  deletedAt?: string | null;
};

/**
 * Response from a project export operation
 */
export interface ProjectExportResponse {
  data: any;
  filename: string;
}

/**
 * Response from a project import operation
 */
export interface ProjectImportResponse {
  project: Project;
  importLog: any;
}

/**
 * Client for managing projects in the Infactory API
 */
export class ProjectsClient {
  /**
   * Creates a new ProjectsClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Get a list of all projects
   * @param teamId - Optional team ID to filter projects by
   * @param includeDeleted - Whether to include deleted projects
   * @returns A promise that resolves to an API response containing an array of projects
   */
  async getProjects(
    teamId?: string,
    includeDeleted: boolean = false,
  ): Promise<ApiResponse<Project[]>> {
    const params: Record<string, any> = {};
    if (teamId) {
      params.team_id = teamId;
    }
    if (includeDeleted) {
      params.include_deleted = includeDeleted;
    }
    return this.httpClient.get<Project[]>('/v1/projects', params);
  }

  /**
   * Get projects for a specific team
   * @param teamId - The ID of the team to get projects for
   * @param includeDeleted - Whether to include deleted projects
   * @returns A promise that resolves to an API response containing an array of projects
   */
  async getTeamProjects(
    teamId: string,
    includeDeleted: boolean = false,
  ): Promise<ApiResponse<Project[]>> {
    if (!teamId) {
      throw new Error('Team ID is required');
    }
    return this.getProjects(teamId, includeDeleted);
  }

  /**
   * Get a project by ID
   * @param projectId - The ID of the project to retrieve
   * @param teamId - Optional team ID for access control
   * @returns A promise that resolves to an API response containing the project
   */
  async getProject(
    projectId: string,
    teamId?: string,
  ): Promise<ApiResponse<Project>> {
    const params: Record<string, any> = {};
    if (teamId) {
      params.team_id = teamId;
    }
    return this.httpClient.get<Project>(`/v1/projects/${projectId}`, params);
  }

  /**
   * Create a new project
   * @param params - The parameters for creating the project
   * @returns A promise that resolves to an API response containing the created project
   */
  async createProject(
    params: CreateProjectParams,
  ): Promise<ApiResponse<Project>> {
    // Client-side validation
    if (!params.name || params.name.trim() === '') {
      throw new Error('Project name is required');
    }
    if (!params.teamId) {
      throw new Error('Team ID is required');
    }

    // The API expects team_id (snake_case) instead of teamId (camelCase)
    const payload = {
      ...params,
      team_id: params.teamId,
    };

    return this.httpClient.post<Project>('/v1/projects', payload);
  }

  /**
   * Update a project
   * @param projectId - The ID of the project to update
   * @param params - The parameters for updating the project
   * @returns A promise that resolves to an API response containing the updated project
   */
  async updateProject(
    projectId: string,
    params: UpdateProjectParams,
  ): Promise<ApiResponse<Project>> {
    if (!params.teamId) {
      throw new Error('Team ID is required for updating a project');
    }
    // Prepare payload with snake_case team_id
    const { teamId, ...rest } = params;
    const payload = {
      ...rest,
      team_id: teamId,
    };
    return this.httpClient.patch<Project>(`/v1/projects/${projectId}`, payload);
  }

  /**
   * Delete a project
   * @param projectId - The ID of the project to delete
   * @param permanent - Whether to permanently delete the project
   * @returns A promise that resolves to an API response
   */
  async deleteProject(
    projectId: string,
    permanent: boolean = false,
  ): Promise<ApiResponse<void>> {
    return this.httpClient.delete<void>(`/v1/projects/${projectId}`, {
      permanent,
    });
  }

  /**
   * Move a project to a new team
   * @param projectId - The ID of the project to move
   * @param newTeamId - The ID of the team to move the project to
   * @returns A promise that resolves to an API response containing the moved project
   */
  async moveProject(
    projectId: string,
    newTeamId: string,
  ): Promise<ApiResponse<Project>> {
    return this.httpClient.post<Project>(
      `/v1/projects/${projectId}/move`,
      undefined,
      { new_team_id: newTeamId },
    );
  }

  /**
   * Export a project
   * @param projectId - The ID of the project to export
   * @param teamId - The ID of the team the project belongs to
   * @returns A promise that resolves to an API response containing the export data
   */
  async exportProject(
    projectId: string,
    teamId: string,
  ): Promise<ApiResponse<any>> {
    return this.httpClient.downloadFile<any>(
      `/projects/${projectId}/export`,
      { teamId },
      `project_export_${projectId}.json`,
    );
  }

  /**
   * Import a project
   * @param teamId - The ID of the team to import the project into
   * @param file - The project configuration file to import
   * @param conflictStrategy - Strategy for handling naming conflicts
   * @returns A promise that resolves to an API response containing the imported project
   */
  async importProject(
    teamId: string,
    file: File,
    conflictStrategy: 'rename' | 'overwrite' | 'skip' = 'rename',
  ): Promise<ApiResponse<ProjectImportResponse>> {
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('teamId', teamId);
      formData.append('conflict_strategy', conflictStrategy);

      return await this.httpClient.request<ProjectImportResponse>({
        url: '/projects/import',
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      console.error('Error importing project:', error);
      throw error;
    }
  }

  /**
   * Validate a project import file without importing it
   * @param file - The project configuration file to validate
   * @returns A promise that resolves to an API response containing validation info
   */
  async validateImport(file: File): Promise<ApiResponse<any>> {
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      return await this.httpClient.request<any>({
        url: '/projects/validate-import',
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      console.error('Error validating import:', error);
      throw error;
    }
  }
}
