/* eslint-disable @typescript-eslint/no-unsafe-return */

import { rest } from 'msw';

// Define base URL for test API
const API_BASE_URL = 'https://api.infactory.ai';

// Create handlers for mock API responses
export const handlers = [
  // Mock getCurrentUser endpoint
  rest.get(`${API_BASE_URL}/v1/authentication/me`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        id: 'user-test-1',
        email: 'test@example.com',
        name: 'Test User',
        clerk_user_id: 'clerk-test-id',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }),
    );
  }),

  // Mock getProjects endpoint
  rest.get(`${API_BASE_URL}/v1/projects`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 'proj-test-1',
          name: 'Test Project 1',
          description: 'Test project for MSW testing',
          team_id: 'team-test-1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 'proj-test-2',
          name: 'Test Project 2',
          description: 'Another test project for MSW testing',
          team_id: 'team-test-1',
          created_at: '2023-02-01T00:00:00Z',
          updated_at: '2023-02-01T00:00:00Z',
        },
      ]),
    );
  }),

  // Mock getProject endpoint
  rest.get(`${API_BASE_URL}/v1/projects/:projectId`, (req, res, ctx) => {
    const { projectId } = req.params;

    if (projectId === 'not-found') {
      return res(ctx.status(404), ctx.json({ error: 'Project not found' }));
    }

    return res(
      ctx.status(200),
      ctx.json({
        id: projectId,
        name: `Test Project ${projectId}`,
        description: 'Test project retrieved with MSW',
        team_id: 'team-test-1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      }),
    );
  }),

  // Mock createProject endpoint
  rest.post(`${API_BASE_URL}/v1/projects`, async (req, res, ctx) => {
    const requestBody = await req.json();

    return res(
      ctx.status(200),
      ctx.json({
        id: 'new-proj-test-1',
        ...requestBody,
        created_at: '2023-03-01T00:00:00Z',
        updated_at: '2023-03-01T00:00:00Z',
      }),
    );
  }),

  // Mock getQueryProgramsByProject endpoint
  rest.get(`${API_BASE_URL}/v1/queryprograms`, (req, res, ctx) => {
    const projectId = req.url.searchParams.get('project_id');

    if (!projectId) {
      return res(
        ctx.status(400),
        ctx.json({ error: 'Missing project_id parameter' }),
      );
    }

    return res(
      ctx.status(200),
      ctx.json([
        {
          id: 'qp-test-1',
          name: 'Test Query Program 1',
          project_id: projectId,
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 'qp-test-2',
          name: 'Test Query Program 2',
          project_id: projectId,
          created_at: '2023-01-05T00:00:00Z',
          updated_at: '2023-01-05T00:00:00Z',
        },
      ]),
    );
  }),

  // Mock executeQueryProgram endpoint
  rest.post(
    `${API_BASE_URL}/v1/queryprograms/:queryProgramId/execute`,
    (req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          result: [
            { id: 1, value: 100, label: 'Sample data 1' },
            { id: 2, value: 200, label: 'Sample data 2' },
            { id: 3, value: 300, label: 'Sample data 3' },
          ],
        }),
      );
    },
  ),

  // Mock publishQueryProgram endpoint
  rest.patch(
    `${API_BASE_URL}/v1/queryprograms/:queryProgramId/publish`,
    (req, res, ctx) => {
      const { queryProgramId } = req.params;

      return res(
        ctx.status(200),
        ctx.json({
          id: queryProgramId,
          name: 'Test Query Program',
          published: true,
          project_id: 'proj-test-1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-03-01T00:00:00Z',
        }),
      );
    },
  ),
];
