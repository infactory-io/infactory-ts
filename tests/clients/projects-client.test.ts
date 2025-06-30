import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProjectsClient } from '../../src/clients/projects-client.js';
import { Project } from '../../src/types/common.js';
import { HttpClient } from '../../src/core/http-client.js';
import { createErrorFromStatus } from '../../src/errors/index.js';

// Mock the HttpClient
vi.mock('../../src/core/http-client', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
      downloadFile: vi.fn(),
      request: vi.fn(),
    })),
  };
});

describe('ProjectsClient', () => {
  let projectsClient: ProjectsClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a new mock HttpClient instance
    mockHttpClient = new HttpClient({
      baseUrl: 'https://api.infactory.ai',
      apiKey: 'test-api-key',
    });

    // Create a new ProjectsClient with the mock HttpClient
    projectsClient = new ProjectsClient(mockHttpClient);
  });

  describe('getProjects', () => {
    it('should call the correct endpoint to list projects', async () => {
      // Mock response data
      const mockProjects = [
        {
          id: 'project-1',
          name: 'Project 1',
          description: 'Test Project 1',
          teamId: 'team-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'project-2',
          name: 'Project 2',
          description: 'Test Project 2',
          teamId: 'team-1',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockProjects,
      });

      // Call the method
      const result = await projectsClient.getProjects();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/projects', {});

      // Verify the result
      expect(result.data).toEqual(mockProjects);
    });

    it('should include teamId parameter when provided', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: [],
      });

      // Call the method with a teamId
      await projectsClient.getProjects('team-1');

      // Verify the HTTP client was called with the teamId parameter
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/projects', {
        teamId: 'team-1',
      });
    });

    it('should include includeDeleted parameter when true', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: [],
      });

      // Call the method with includeDeleted = true
      await projectsClient.getProjects(undefined, true);

      // Verify the HTTP client was called with the includeDeleted parameter
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/projects', {
        includeDeleted: true,
      });
    });

    it('should handle errors when listing projects', async () => {
      // Setup the mock to return an error
      const mockError = createErrorFromStatus(
        500,
        'server_error',
        'Internal server error',
      );

      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        error: mockError,
      });

      // Call the method
      const result = await projectsClient.getProjects();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/projects', {});

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getTeamProjects', () => {
    it('should call getProjects with the teamId', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: [],
      });

      // Call the method
      await projectsClient.getTeamProjects('team-1');

      // Verify the HTTP client was called with the correct parameters
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/projects', {
        teamId: 'team-1',
      });
    });

    it('should throw an error when teamId is not provided', async () => {
      // Call the method without a teamId
      await expect(projectsClient.getTeamProjects('')).rejects.toThrow(
        'Team ID is required',
      );

      // Verify the HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });
  });

  describe('getProject', () => {
    it('should call the correct endpoint to get a project by ID', async () => {
      // Mock response data
      const mockProject = {
        id: 'project-1',
        name: 'Project 1',
        description: 'Test Project 1',
        teamId: 'team-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockProject,
      });

      // Call the method
      const result = await projectsClient.getProject('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/projects/project-1',
        {},
      );

      // Verify the result
      expect(result.data).toEqual(mockProject);
    });

    it('should include teamId parameter when provided', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: {},
      });

      // Call the method with a teamId
      await projectsClient.getProject('project-1', 'team-1');

      // Verify the HTTP client was called with the teamId parameter
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/projects/project-1',
        { teamId: 'team-1' },
      );
    });
  });

  describe('createProject', () => {
    it('should call the correct endpoint to create a project', async () => {
      // Mock request data
      const createParams = {
        name: 'New Project',
        description: 'New Test Project',
        teamId: 'team-1',
      };

      // Mock response data
      const mockResponse = {
        id: 'new-project',
        name: 'New Project',
        description: 'New Test Project',
        teamId: 'team-1',
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await projectsClient.createProject(createParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/projects', {
        ...createParams,
        teamId: 'team-1',
      });

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should validate project name is not empty', async () => {
      // Call with empty name
      await expect(
        projectsClient.createProject({
          name: '',
          teamId: 'team-1',
        }),
      ).rejects.toThrow('Project name is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should pass teamId to the API', async () => {
      // Setup mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: { id: 'project-1', name: 'New Project' } as Project,
      });

      // Call with teamId
      await projectsClient.createProject({
        name: 'New Project',
        teamId: 'team-1',
      });

      // Verify HTTP client was called with the teamId in the payload
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/projects',
        expect.objectContaining({ teamId: 'team-1' }),
      );
    });
  });

  describe('updateProject', () => {
    it('should call the correct endpoint to update a project', async () => {
      // Mock request data
      const updateParams = {
        name: 'Updated Project',
        description: 'Updated Test Project',
        teamId: 'team-1',
      };

      // Mock response data
      const mockResponse = {
        id: 'project-1',
        name: 'Updated Project',
        description: 'Updated Test Project',
        teamId: 'team-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await projectsClient.updateProject(
        'project-1',
        updateParams,
      );

      // Verify the HTTP client was called with the correct URL and parameters
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/projects/project-1',
        updateParams,
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('deleteProject', () => {
    it('should call the correct endpoint to delete a project', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method
      const result = await projectsClient.deleteProject('project-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/v1/projects/project-1',
        { permanent: false },
      );

      // Verify the result
      expect(result.data).toEqual(undefined);
    });

    it('should support permanent deletion', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method with permanent flag
      await projectsClient.deleteProject('project-1', true);

      // Verify the HTTP client was called correctly with permanent flag
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/v1/projects/project-1',
        { permanent: true },
      );
    });
  });

  describe('moveProject', () => {
    it('should call the correct endpoint to move a project to a new team', async () => {
      // Mock response data
      const mockResponse = {
        id: 'project-1',
        name: 'Project 1',
        description: 'Test Project 1',
        teamId: 'new-team-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-05T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await projectsClient.moveProject(
        'project-1',
        'new-team-1',
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/projects/project-1/move',
        { new_team_id: 'new-team-1' },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('exportProject', () => {
    it('should call the correct endpoint to export a project', async () => {
      // Mock response data
      const mockResponse = {
        data: {
          /* project export data */
        },
        filename: 'project_export_project-1.json',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.downloadFile).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await projectsClient.exportProject('project-1', 'team-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.downloadFile).toHaveBeenCalledWith(
        '/projects/project-1/export',
        { teamId: 'team-1' },
        'project_export_project-1.json',
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('importProject', () => {
    it('should call the correct endpoint to import a project', async () => {
      // Mock file
      const mockFile = new File(['test content'], 'project.json', {
        type: 'application/json',
      });

      // Mock response data
      const mockResponse = {
        project: {
          id: 'imported-project',
          name: 'Imported Project',
          teamId: 'team-1',
          createdAt: '2025-01-05T00:00:00Z',
          updatedAt: '2025-01-05T00:00:00Z',
        },
        importLog: {
          /* import log data */
        },
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.request).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await projectsClient.importProject('team-1', mockFile);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.request).toHaveBeenCalledWith({
        url: '/projects/import',
        method: 'POST',
        body: expect.any(FormData),
      });

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should support custom conflict strategy', async () => {
      // Mock file
      const mockFile = new File(['test content'], 'project.json', {
        type: 'application/json',
      });

      // Setup the mock response
      vi.mocked(mockHttpClient.request).mockResolvedValueOnce({
        data: {},
      });

      // Call the method with custom conflict strategy using the options object
      await projectsClient.importProject('team-1', mockFile, {
        conflictStrategy: 'overwrite',
      });

      // Verify the HTTP client was called correctly
      const requestCall = vi.mocked(mockHttpClient.request).mock.calls[0][0];
      const formData = requestCall.body as FormData;

      // Create a simple way to inspect FormData contents
      const formDataEntries: Record<string, any> = {};
      for (const pair of (formData as any).entries()) {
        formDataEntries[pair[0]] = pair[1];
      }

      expect(formDataEntries['conflict_strategy']).toEqual('overwrite');
    });

    it('should log and rethrow errors on import failure', async () => {
      const mockFile = new File(['test content'], 'project.json', {
        type: 'application/json',
      });
      const mockError = new Error('import failed');
      vi.mocked(mockHttpClient.request).mockRejectedValueOnce(mockError);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(
        projectsClient.importProject('team-1', mockFile),
      ).rejects.toThrow(mockError);
      expect(errorSpy).toHaveBeenCalledWith(
        'Error importing project:',
        mockError,
      );
      errorSpy.mockRestore();
    });
  });

  describe('validateImport', () => {
    it('should call the correct endpoint to validate a project import file', async () => {
      // Mock file
      const mockFile = new File(['test content'], 'project.json', {
        type: 'application/json',
      });

      // Mock response data
      const mockResponse = {
        valid: true,
        components: {
          /* validation details */
        },
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.request).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await projectsClient.validateImport(mockFile);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.request).toHaveBeenCalledWith({
        url: '/projects/validate-import',
        method: 'POST',
        body: expect.any(FormData),
      });

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should log and rethrow errors on validation failure', async () => {
      const mockFile = new File(['test content'], 'project.json', {
        type: 'application/json',
      });
      const mockError = new Error('validation failed');
      vi.mocked(mockHttpClient.request).mockRejectedValueOnce(mockError);
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      await expect(projectsClient.validateImport(mockFile)).rejects.toThrow(
        mockError,
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Error validating import:',
        mockError,
      );
      errorSpy.mockRestore();
    });
  });
});
