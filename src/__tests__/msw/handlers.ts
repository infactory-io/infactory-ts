import { http, HttpResponse } from 'msw';

// Define base URL for test API
const API_BASE_URL = 'https://api.infactory.ai';

// Create handlers for mock API responses
export const handlers = [
  // Mock getCurrentUser endpoint
  http.get(`${API_BASE_URL}/v1/authentication/me`, () => {
    return HttpResponse.json(
      {
        id: 'user-test-1',
        email: 'test@example.com',
        name: 'Test User',
        clerk_user_id: 'clerk-test-id',
        organization_id: 'org-test-1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
      { status: 200 },
    );
  }),

  // Mock getProjects endpoint
  http.get(`${API_BASE_URL}/v1/projects`, () => {
    return HttpResponse.json(
      [
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
      ],
      { status: 200 },
    );
  }),

  // Mock getProject endpoint
  http.get(`${API_BASE_URL}/v1/projects/:projectId`, ({ params }) => {
    const { projectId } = params;

    if (projectId === 'not-found' || !projectId) {
      return HttpResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return HttpResponse.json(
      {
        id: projectId,
        name: `Test Project ${String(projectId)}`,
        description: 'Test project retrieved with MSW',
        team_id: 'team-test-1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
      { status: 200 },
    );
  }),

  // Mock createProject endpoint
  http.post(`${API_BASE_URL}/v1/projects`, async ({ request }) => {
    const requestBody = await request.json();

    // Handle the requestBody as a Record<string, any> to fix spread type issue
    const body = requestBody as Record<string, any>;
    return HttpResponse.json(
      {
        id: 'new-proj-test-1',
        ...body,
        created_at: '2023-03-01T00:00:00Z',
        updated_at: '2023-03-01T00:00:00Z',
      },
      { status: 200 },
    );
  }),

  // Mock getQueryProgramsByProject endpoint
  http.get(`${API_BASE_URL}/v1/queryprograms`, ({ request }) => {
    const url = new URL(request.url);
    const projectId = url.searchParams.get('project_id');

    if (!projectId) {
      return HttpResponse.json(
        { error: 'Missing project_id parameter' },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      [
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
      ],
      { status: 200 },
    );
  }),

  // Mock executeQueryProgram endpoint
  http.post(`${API_BASE_URL}/v1/queryprograms/:queryProgramId/execute`, () => {
    return HttpResponse.json(
      {
        result: [
          { id: 1, value: 100, label: 'Sample data 1' },
          { id: 2, value: 200, label: 'Sample data 2' },
          { id: 3, value: 300, label: 'Sample data 3' },
        ],
      },
      { status: 200 },
    );
  }),

  // Mock publishQueryProgram endpoint
  http.patch(
    `${API_BASE_URL}/v1/queryprograms/:queryProgramId/publish`,
    ({ params }) => {
      const { queryProgramId } = params;

      return HttpResponse.json(
        {
          id: queryProgramId,
          name: 'Test Query Program',
          published: true,
          project_id: 'proj-test-1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-03-01T00:00:00Z',
        },
        { status: 200 },
      );
    },
  ),
];
