// src/__tests__/msw/client-msw.test.ts
import { InfactoryClient } from '../../client.js';
import fetchMock, { FetchMock } from 'jest-fetch-mock';
import {
  isApiResponse,
  processStreamToApiResponse,
} from '../../utils/stream.js';

// Set test environment variables
process.env.NF_API_KEY = 'test-api-key';
process.env.NF_BASE_URL = 'https://api.infactory.ai';

describe('InfactoryClient with MSW', () => {
  let client: InfactoryClient;

  beforeEach(() => {
    // Reset mocks before each test
    (fetchMock as unknown as FetchMock).resetMocks();

    client = new InfactoryClient({
      apiKey: 'test-api-key',
    });
  });

  describe('Users API', () => {
    it('should get current user information', async () => {
      // Mock the response based on handlers.ts
      const mockUser = {
        id: 'user-test-1',
        email: 'test@example.com',
        name: 'Test User',
        clerk_userId: 'clerk-test-id',
        organizationId: 'org-test-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      (fetchMock as unknown as FetchMock).mockResponseOnce(
        JSON.stringify(mockUser),
      );

      const response = await client.users.getCurrentUser();

      expect(response.error).toBeUndefined();
      expect(response.data).toBeDefined();
      expect(response.data?.email).toBe('test@example.com');
      expect(response.data?.name).toBe('Test User');
    });
  });

  describe('Projects API', () => {
    it('should list projects', async () => {
      // Mock the response based on handlers.ts
      const mockProjects = [
        {
          id: 'proj-test-1',
          name: 'Test Project 1',
          description: 'Test project for MSW testing',
          teamId: 'team-test-1',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: 'proj-test-2',
          name: 'Test Project 2',
          description: 'Another test project for MSW testing',
          teamId: 'team-test-1',
          createdAt: '2023-02-01T00:00:00Z',
          updatedAt: '2023-02-01T00:00:00Z',
        },
      ];
      (fetchMock as unknown as FetchMock).mockResponseOnce(
        JSON.stringify(mockProjects),
      );

      const response = await client.projects.getProjects();

      expect(response.error).toBeUndefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data?.length).toBe(2);
      expect(response.data?.[0].name).toBe('Test Project 1');
    });

    it('should get a specific project', async () => {
      const projectId = 'proj-123';

      // Mock the response based on handlers.ts
      const mockProject = {
        id: projectId,
        name: `Test Project ${projectId}`,
        description: 'Test project retrieved with MSW',
        teamId: 'team-test-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };
      (fetchMock as unknown as FetchMock).mockResponseOnce(
        JSON.stringify(mockProject),
      );

      const response = await client.projects.getProject(projectId);

      expect(response.error).toBeUndefined();
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBe(projectId);
    });

    it('should create a new project', async () => {
      const projectData = {
        name: 'New MSW Test Project',
        description: 'Created during MSW testing',
        teamId: 'team-test-1',
      };

      // Mock the response based on handlers.ts
      const mockCreatedProject = {
        id: 'new-proj-test-1',
        name: projectData.name,
        description: projectData.description,
        teamId: projectData.teamId,
        createdAt: '2023-03-01T00:00:00Z',
        updatedAt: '2023-03-01T00:00:00Z',
      };
      (fetchMock as unknown as FetchMock).mockResponseOnce(
        JSON.stringify(mockCreatedProject),
      );

      const response = await client.projects.createProject(projectData);

      expect(response.error).toBeUndefined();
      expect(response.data).toBeDefined();
      expect(response.data?.name).toBe(projectData.name);
      expect(response.data?.description).toBe(projectData.description);
      expect(response.data?.id).toBe('new-proj-test-1');
    });

    it('should handle project not found', async () => {
      // Mock the 404 response based on handlers.ts
      (fetchMock as unknown as FetchMock).mockResponseOnce(
        JSON.stringify({ error: 'Project not found' }),
        { status: 404 },
      );

      const response = await client.projects.getProject('not-found');

      expect(response.data).toBeUndefined();
      expect(response.error).toBeDefined();
      expect(response.error?.status).toBe(404);
    });
  });

  describe('QueryPrograms API', () => {
    it('should get query programs for a project', async () => {
      const projectId = 'proj-test-1';

      // Mock the response based on handlers.ts
      const mockQueryPrograms = [
        {
          id: 'qp-test-1',
          name: 'Test Query Program 1',
          projectId: projectId,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
        },
        {
          id: 'qp-test-2',
          name: 'Test Query Program 2',
          projectId: projectId,
          createdAt: '2023-01-05T00:00:00Z',
          updatedAt: '2023-01-05T00:00:00Z',
        },
      ];
      (fetchMock as unknown as FetchMock).mockResponseOnce(
        JSON.stringify(mockQueryPrograms),
      );

      const response =
        await client.queryprograms.getQueryProgramsByProject(projectId);

      expect(response.error).toBeUndefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data?.length).toBe(2);
      expect(response.data?.[0].projectId).toBe(projectId);
    });

    it('should execute a query program', async () => {
      const queryProgramId = 'qp-test-1';

      // Mock the response based on handlers.ts
      const mockExecutionResult = {
        result: [
          { id: 1, value: 100, label: 'Sample data 1' },
          { id: 2, value: 200, label: 'Sample data 2' },
          { id: 3, value: 300, label: 'Sample data 3' },
        ],
      };
      (fetchMock as unknown as FetchMock).mockResponseOnce(
        JSON.stringify(mockExecutionResult),
      );

      const rawResponse =
        await client.queryprograms.executeQueryProgram(queryProgramId);

      // Process the response to ensure it's an ApiResponse
      const response = isApiResponse(rawResponse)
        ? rawResponse
        : await processStreamToApiResponse(rawResponse);

      expect(response.error).toBeUndefined();
      expect(response.data).toBeDefined();
      // Use type assertion to properly access the result property
      const resultData = response.data as { result: Array<any> };
      expect(resultData.result).toBeDefined();
      expect(Array.isArray(resultData.result)).toBe(true);
      expect(resultData.result.length).toBe(3);
    });

    it('should publish a query program', async () => {
      const queryProgramId = 'qp-test-1';

      // Mock the response based on handlers.ts
      const mockPublishedProgram = {
        id: queryProgramId,
        name: 'Test Query Program',
        published: true,
        projectId: 'proj-test-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-03-01T00:00:00Z',
      };
      (fetchMock as unknown as FetchMock).mockResponseOnce(
        JSON.stringify(mockPublishedProgram),
      );

      const response =
        await client.queryprograms.publishQueryProgram(queryProgramId);

      expect(response.error).toBeUndefined();
      expect(response.data).toBeDefined();
      expect(response.data?.published).toBe(true);
    });
  });
});
