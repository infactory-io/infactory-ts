// src/__tests__/integration/client-integration.test.ts
import { InfactoryClient } from '../../client.js';
import nock from 'nock';
import * as dotenv from 'dotenv';
import {
  isApiResponse,
  processStreamToApiResponse,
} from '../../utils/stream.js';

// Load test environment variables
dotenv.config();

const TEST_API_KEY = process.env.TEST_API_KEY || 'test-api-key';
const TEST_BASE_URL = 'https://staging.infactory.ai';

describe('InfactoryClient Integration', () => {
  let client: InfactoryClient;

  beforeAll(() => {
    // Create a client with test credentials
    client = new InfactoryClient({
      apiKey: TEST_API_KEY,
      baseURL: TEST_BASE_URL,
    });

    // Disable real HTTP requests during tests
    nock.disableNetConnect();
  });

  afterAll(() => {
    // Re-enable real HTTP requests after tests
    nock.enableNetConnect();
  });

  beforeEach(() => {
    // Clean up any pending mocks
    nock.cleanAll();
  });

  describe('Projects API', () => {
    it('should list projects', async () => {
      const mockProjects = [
        {
          id: 'proj-1',
          name: 'Test Project 1',
          description: 'Integration test project 1',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          teamId: 'team-1',
        },
      ];

      // Mock the API response
      nock(TEST_BASE_URL).get('/v1/projects').reply(200, mockProjects);

      const response = await client.projects.getProjects();

      expect(response.error).toBeUndefined();
      expect(response.data).toEqual(mockProjects);
    });

    it('should create a project', async () => {
      const newProject = {
        name: 'New Integration Project',
        description: 'Created during integration test',
        teamId: 'team-1',
      };

      const mockCreatedProject = {
        ...newProject,
        id: 'new-proj-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      // Mock the API response
      nock(TEST_BASE_URL)
        .post('/v1/projects', (body) => {
          // Verify the request body contains the expected data
          return (
            body.name === newProject.name &&
            body.description === newProject.description &&
            body.teamId === newProject.teamId
          );
        })
        .reply(200, mockCreatedProject);

      const response = await client.projects.createProject(newProject);

      expect(response.error).toBeUndefined();
      expect(response.data).toEqual(mockCreatedProject);
    });
  });

  describe('Users API', () => {
    it('should get the current user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        clerk_userId: 'clerk-123',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      // Mock the API response
      nock(TEST_BASE_URL).get('/v1/authentication/me').reply(200, mockUser);

      const response = await client.users.getCurrentUser();

      expect(response.error).toBeUndefined();
      expect(response.data).toEqual(mockUser);
    });
  });

  describe('QueryPrograms API', () => {
    it('should execute a query program', async () => {
      const queryProgramId = 'qp-test-1';
      const mockResult = {
        result: [
          { id: 1, name: 'Item 1' },
          { id: 2, name: 'Item 2' },
        ],
      };

      // Mock the API response
      nock(TEST_BASE_URL)
        .post(`/v1/queryprograms/${queryProgramId}/execute`)
        .reply(200, mockResult);

      const rawResponse =
        await client.queryprograms.executeQueryProgram(queryProgramId);

      // Process the response to ensure it's an ApiResponse
      const response = isApiResponse(rawResponse)
        ? rawResponse
        : await processStreamToApiResponse(rawResponse);

      expect(response.error).toBeUndefined();
      expect(response.data).toEqual(mockResult);
    });

    it('should publish a query program', async () => {
      const queryProgramId = 'qp-test-1';
      const mockPublishedProgram = {
        id: queryProgramId,
        name: 'Test Query Program',
        published: true,
        projectId: 'project-1',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-02T00:00:00Z',
      };

      // Mock the API response
      nock(TEST_BASE_URL)
        .patch(`/v1/queryprograms/${queryProgramId}/publish`)
        .reply(200, mockPublishedProgram);

      const response =
        await client.queryprograms.publishQueryProgram(queryProgramId);

      expect(response.error).toBeUndefined();
      expect(response.data).toEqual(mockPublishedProgram);
      expect(response.data?.published).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should handle API errors properly', async () => {
      // Mock an API error response
      nock(TEST_BASE_URL)
        .get('/v1/projects/non-existent')
        .reply(404, { message: 'Project not found' });

      const response = await client.projects.getProject('non-existent');

      expect(response.data).toBeUndefined();
      expect(response.error).toBeDefined();
      expect(response.error?.status).toBe(404);
    });

    it('should handle network errors', async () => {
      // Mock a network error
      nock(TEST_BASE_URL).get('/v1/projects').replyWithError('Network error');

      const response = await client.projects.getProjects();

      expect(response.data).toBeUndefined();
      expect(response.error).toBeDefined();
    });
  });
});
