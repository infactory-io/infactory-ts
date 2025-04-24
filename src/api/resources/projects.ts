import type { Project, CreateProjectParams } from '@/types/common.js';
import { sharedClient, type ApiResponse } from '@/core/shared-client.js';

export const projectsApi = {
  getProjects: async (): Promise<ApiResponse<Project[]>> => {
    return await sharedClient.get<Project[]>('/v1/projects');
  },

  getTeamProjects: async (teamId: string): Promise<ApiResponse<Project[]>> => {
    return await sharedClient.get<Project[]>('/v1/projects', {
      teamId: teamId,
    });
  },

  getProject: async (projectId: string): Promise<ApiResponse<Project>> => {
    return await sharedClient.get<Project>(`/v1/projects/${projectId}`);
  },

  createProject: async (
    params: CreateProjectParams,
  ): Promise<ApiResponse<Project>> => {
    // Send team_id (snake_case) as expected by the backend API
    const payload = {
      ...params,
      team_id: params.teamId, // Map camelCase to snake_case
      // teamId: undefined, // Remove the original camelCase field
    };
    // delete payload.teamId; // Ensure it's fully removed

    return await sharedClient.post<Project>('/v1/projects', payload);
  },

  updateProject: async (
    projectId: string,
    params: Partial<CreateProjectParams>,
  ): Promise<ApiResponse<Project>> => {
    const { teamId, ...updateParams } = params;
    if (!teamId) {
      throw new Error('teamId is required for updating a project');
    }
    // Convert params to query string
    const searchParams = new URLSearchParams();
    Object.entries(updateParams).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value);
      }
    });
    searchParams.append('teamId', teamId);

    return await sharedClient.patch<Project>(
      `/v1/projects/${projectId}?${searchParams.toString()}`,
      params,
    );
  },

  deleteProject: async (projectId: string): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(`/v1/projects/${projectId}`);
  },

  exportProject: async (
    projectId: string,
    teamId: string,
  ): Promise<ApiResponse<any>> => {
    return await sharedClient.downloadFile<any>(
      `/projects/${projectId}/export`,
      { teamId: teamId },
      `project_export_${projectId}.json`,
    );
  },

  importProject: async (
    teamId: string,
    file: File,
  ): Promise<ApiResponse<Project>> => {
    try {
      console.info('Importing project file:', file.name, file.type, file.size);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('teamId', teamId);
      formData.append('conflict_strategy', 'rename');

      // Log FormData contents
      console.info('FormData entries:');
      for (const pair of formData.entries()) {
        console.info(pair[0], typeof pair[1], pair[1]);
      }

      return await sharedClient.request<Project>({
        url: '/projects/import',
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      console.error('Error importing project:', error);
      throw error;
    }
  },

  validateImport: async (file: File): Promise<ApiResponse<any>> => {
    try {
      console.info('Validating file:', file.name, file.type, file.size);

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);

      // Log FormData contents
      console.info('FormData entries:');
      for (const pair of formData.entries()) {
        console.info(pair[0], pair[1]);
      }

      return await sharedClient.request<any>({
        url: '/projects/validate-import',
        method: 'POST',
        body: formData,
      });
    } catch (error) {
      console.error('Error validating import:', error);
      throw error;
    }
  },
};
