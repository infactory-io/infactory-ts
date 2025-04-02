import { fetchApi, get, uploadFile, downloadFile } from './client';
import { Project, CreateProjectParams, ApiResponse } from './types';
import { SERVER_BASE_URL } from './version';

export const projectsApi = {
  getProjects: async (): Promise<ApiResponse<Project[]>> => {
    return fetchApi<Project[]>('/v1/projects');
  },

  getTeamProjects: async (teamId: string): Promise<ApiResponse<Project[]>> => {
    const params = { team_id: teamId };
    return get<Project[]>('/v1/projects', { params });
  },

  getProject: async (projectId: string): Promise<ApiResponse<Project>> => {
    return fetchApi<Project>(`/v1/projects/${projectId}`);
  },

  createProject: async (
    params: CreateProjectParams
  ): Promise<ApiResponse<Project>> => {
    return fetchApi<Project>('/v1/projects', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  updateProject: async (
    projectId: string,
    params: Partial<CreateProjectParams>
  ): Promise<ApiResponse<Project>> => {
    const { team_id, ...updateParams } = params;
    if (!team_id) {
      throw new Error('team_id is required for updating a project');
    }
    // Convert params to query string
    const searchParams = new URLSearchParams();
    Object.entries(updateParams).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value);
      }
    });
    searchParams.append('team_id', team_id);

    return fetchApi<Project>(
      `/v1/projects/${projectId}?${searchParams.toString()}`,
      {
        method: 'PATCH'
      }
    );
  },

  deleteProject: async (projectId: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/v1/projects/${projectId}`, {
      method: 'DELETE'
    });
  },

  exportProject: async (
    projectId: string,
    teamId: string
  ): Promise<ApiResponse<any>> => {
    // Use the downloadFile helper for consistent pattern
    return downloadFile<any>(
      `/projects/${projectId}/export`,
      { team_id: teamId },
      `project_export_${projectId}.json`
    );
  },

  importProject: async (
    teamId: string,
    file: File
  ): Promise<ApiResponse<Project>> => {
    try {
      console.log('Importing project file:', file.name, file.type, file.size);

      // Create a copy of the file to prevent "file after cleanup" errors
      const fileContent = await file.arrayBuffer();
      const fileCopy = new File([fileContent], file.name, { type: file.type });

      // Create FormData
      const formData = new FormData();
      formData.append('file', fileCopy);
      formData.append('team_id', teamId);
      formData.append('conflict_strategy', 'rename');

      // Log FormData contents
      console.log('FormData entries:');
      for (const pair of formData.entries()) {
        console.log(pair[0], typeof pair[1], pair[1]);
      }

      // Use direct fetch for maximum control
      const isServer = typeof window === 'undefined';
      const baseUrl = isServer ? SERVER_BASE_URL : '/api/infactory';
      const url = `${baseUrl}/projects/import`;

      console.log('Making direct fetch request to:', url);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let errorText = await response.text();
        console.error(
          'Error response body:',
          errorText,
          'Content-Type:',
          contentType
        );

        let errorMessage;
        try {
          // Only try to parse as JSON if it looks like JSON
          if (
            contentType?.includes('application/json') ||
            errorText.trim().startsWith('{')
          ) {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.detail
              ? JSON.stringify(errorJson.detail)
              : 'Import failed';
          } else {
            // Handle HTML or other responses
            errorMessage = `Import failed: ${response.status} ${response.statusText}`;
            console.error(
              'Non-JSON error response:',
              errorText.substring(0, 200)
            );
          }
        } catch (e) {
          errorMessage = `Import failed: ${response.status} ${response.statusText}`;
        }

        return {
          error: {
            status: response.status,
            message: errorMessage
          }
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error importing project:', error);
      return {
        error: {
          status: 500,
          message:
            error instanceof Error ? error.message : 'Failed to import project'
        }
      };
    }
  },

  validateImport: async (file: File): Promise<ApiResponse<any>> => {
    try {
      console.log('Validating file:', file.name, file.type, file.size);

      // Create a copy of the file to prevent "file after cleanup" errors
      const fileContent = await file.arrayBuffer();
      const fileCopy = new File([fileContent], file.name, { type: file.type });

      // Create FormData manually to ensure field name is correct
      const formData = new FormData();
      formData.append('file', fileCopy);

      // Log FormData contents
      console.log('FormData entries:');
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      // Use direct fetch for maximum control
      const isServer = typeof window === 'undefined';
      const baseUrl = isServer ? SERVER_BASE_URL : '/api/infactory';
      const url = `${baseUrl}/projects/validate-import`;

      console.log('Making direct fetch request to:', url);

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      console.log('Response status:', response.status);
      console.log(
        'Response headers:',
        Object.fromEntries([...response.headers.entries()])
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.detail || 'Validation failed';
        } catch (e) {
          errorMessage = errorText || 'Validation failed';
        }

        return {
          error: {
            status: response.status,
            message: errorMessage
          }
        };
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error validating import:', error);
      return {
        error: {
          status: 500,
          message:
            error instanceof Error
              ? error.message
              : 'Failed to validate import file'
        }
      };
    }
  }
};
