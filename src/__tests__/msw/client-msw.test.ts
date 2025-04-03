// src/__tests__/msw/client-msw.test.ts
import { InfactoryClient } from '../../client.js';
import { server } from './server.js';

// Set test environment variables
process.env.NF_API_KEY = 'test-api-key';
process.env.NF_BASE_URL = 'https://api.infactory.ai';

describe('InfactoryClient with MSW', () => {
  let client: InfactoryClient;

  // Start MSW server before tests
  beforeAll(() => {
    server.listen();

    // Initialize the client
    client = new InfactoryClient({
      apiKey: 'test-api-key',
    });
  });

  // Reset handlers after each test
  afterEach(() => {
    server.resetHandlers();
  });

  // Stop server after all tests
  afterAll(() => {
    server.close();
  });

  describe('Users API', () => {
    it('should get current user information', async () => {
      const response = await client.users.getCurrentUser();

      expect(response.error).toBeUndefined();
      expect(response.data).toBeDefined();
      expect(response.data?.email).toBe('test@example.com');
      expect(response.data?.name).toBe('Test User');
    });
  });

  describe('Projects API', () => {
    it('should list projects', async () => {
      const response = await client.projects.getProjects();

      expect(response.error).toBeUndefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data?.length).toBe(2);
      expect(response.data?.[0].name).toBe('Test Project 1');
    });

    it('should get a specific project', async () => {
      const projectId = 'proj-123';
      const response = await client.projects.getProject(projectId);

      expect(response.error).toBeUndefined();
      expect(response.data).toBeDefined();
      expect(response.data?.id).toBe(projectId);
    });

    it('should create a new project', async () => {
      const projectData = {
        name: 'New MSW Test Project',
        description: 'Created during MSW testing',
        team_id: 'team-test-1',
      };

      const response = await client.projects.createProject(projectData);

      expect(response.error).toBeUndefined();
      expect(response.data).toBeDefined();
      expect(response.data?.name).toBe(projectData.name);
      expect(response.data?.description).toBe(projectData.description);
      expect(response.data?.id).toBe('new-proj-test-1');
    });

    it('should handle project not found', async () => {
      const response = await client.projects.getProject('not-found');

      expect(response.data).toBeUndefined();
      expect(response.error).toBeDefined();
      expect(response.error?.status).toBe(404);
    });
  });

  describe('QueryPrograms API', () => {
    it('should get query programs for a project', async () => {
      const projectId = 'proj-test-1';
      const response =
        await client.queryprograms.getQueryProgramsByProject(projectId);

      expect(response.error).toBeUndefined();
      expect(response.data).toBeDefined();
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data?.length).toBe(2);
      expect(response.data?.[0].project_id).toBe(projectId);
    });

    it('should execute a query program', async () => {
      const queryProgramId = 'qp-test-1';
      const response =
        await client.queryprograms.executeQueryProgram(queryProgramId);

      expect(response.error).toBeUndefined();
      expect(response.data).toBeDefined();
      expect(response.data?.result).toBeDefined();
      expect(Array.isArray(response.data?.result)).toBe(true);
      expect(response.data?.result.length).toBe(3);
    });

    it('should publish a query program', async () => {
      const queryProgramId = 'qp-test-1';
      const response =
        await client.queryprograms.publishQueryProgram(queryProgramId);

      expect(response.error).toBeUndefined();
      expect(response.data).toBeDefined();
      expect(response.data?.published).toBe(true);
    });
  });
});
