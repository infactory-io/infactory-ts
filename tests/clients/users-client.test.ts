import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersClient } from '../../src/clients/index.js';
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
    })),
  };
});

describe('UsersClient', () => {
  let usersClient: UsersClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a new mock HttpClient instance
    mockHttpClient = new HttpClient({
      baseUrl: 'https://api.infactory.ai',
      apiKey: 'test-api-key',
    });

    // Create a new UsersClient with the mock HttpClient
    usersClient = new UsersClient(mockHttpClient);
  });

  describe('getUsers', () => {
    it('should call the correct endpoint to list users', async () => {
      // Mock response data
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          organizationId: 'org-1',
          clerkUserId: 'clerk-user-1',
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          name: 'User Two',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
          organizationId: 'org-1',
          clerkUserId: 'clerk-user-2',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockUsers,
      });

      // Call the method
      const result = await usersClient.getUsers();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/users', {});

      // Verify the result
      expect(result.data).toEqual(mockUsers);
    });

    it('should include organization ID when provided', async () => {
      // Mock response data
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          name: 'User One',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
          organizationId: 'org-1',
          clerkUserId: 'clerk-user-1',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockUsers,
      });

      // Call the method with organization ID
      const result = await usersClient.getUsers('org-1');

      // Verify the HTTP client was called correctly with the organization_id parameter
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/users', {
        organization_id: 'org-1',
      });

      // Verify the result
      expect(result.data).toEqual(mockUsers);
    });

    it('should handle errors when listing users', async () => {
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
      const result = await usersClient.getUsers();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/users', {});

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getUser', () => {
    it('should call the correct endpoint to get a user by ID', async () => {
      // Mock response data
      const mockUser = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        organizationId: 'org-1',
        clerkUserId: 'clerk-user-1',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockUser,
      });

      // Call the method
      const result = await usersClient.getUser('user-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/users/user-1');

      // Verify the result
      expect(result.data).toEqual(mockUser);
    });
  });

  describe('getCurrentUser', () => {
    it('should call the correct endpoint to get the current user', async () => {
      // Mock response data
      const mockCurrentUser = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        organizationId: 'org-1',
        clerkUserId: 'clerk-user-1',
        userTeams: [
          {
            userId: 'user-1',
            teamId: 'team-1',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
            deletedAt: null,
          },
        ],
        organization: {
          id: 'org-1',
          name: 'Organization One',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        apiKeys: [],
        apiLogs: [],
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockCurrentUser,
      });

      // Call the method
      const result = await usersClient.getCurrentUser();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/authentication/me');

      // Verify the result
      expect(result.data).toEqual(mockCurrentUser);
    });
  });

  describe('updateUser', () => {
    it('should call the correct endpoint to update a user', async () => {
      // Mock request data
      const updateParams = {
        email: 'updated@example.com',
        name: 'Updated User',
        role: 'admin',
      };

      // Mock response data
      const mockResponse = {
        id: 'user-1',
        email: 'updated@example.com',
        name: 'Updated User',
        organizationId: 'org-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
        clerkUserId: 'clerk-user-1',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await usersClient.updateUser('user-1', updateParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith('/v1/users/user-1', {
        email: 'updated@example.com',
        name: 'Updated User',
        role: 'admin',
      });

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('deleteUser', () => {
    it('should call the correct endpoint to delete a user', async () => {
      // Mock response data
      const mockResponse = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
        organizationId: 'org-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        clerkUserId: 'clerk-user-1',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await usersClient.deleteUser('user-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/v1/users/user-1');

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('moveUser', () => {
    it('should call the correct endpoint to move a user to a new organization', async () => {
      // Mock response data
      const mockResponse = {
        id: 'user-1',
        email: 'user1@example.com',
        name: 'User One',
        organizationId: 'org-2', // Updated organization ID
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
        clerkUserId: 'clerk-user-1',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await usersClient.moveUser('user-1', 'org-2');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/users/user-1/move',
        { new_organization_id: 'org-2' },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('getOrCreateUserTeamOrganization', () => {
    it('should call the correct endpoint to get or create user, team, and organization', async () => {
      // Mock request data
      const params = {
        clerkUserId: 'clerk-user-3',
        email: 'user3@example.com',
        name: 'User Three',
        clerkOrgId: 'clerk-org-1',
        organizationName: 'New Organization',
        platformId: 'platform-1', // Add required platformId
      };

      // Mock response data
      const mockResponse = {
        id: 'user-3',
        email: 'user3@example.com',
        name: 'User Three',
        organizationId: 'org-3',
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
        clerkUserId: 'clerk-user-3',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await usersClient.getOrCreateUserTeamOrganization(params);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/users/get_or_create_user_team_organization',
        {
          body: params,
        },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('getTeamsWithOrganizationsAndProjects', () => {
    it('should call the correct endpoint with userId parameter', async () => {
      // Mock response data
      const mockResponse = {
        teams: [
          {
            id: 'team-1',
            name: 'Team One',
            organization: {
              id: 'org-1',
              name: 'Organization One',
            },
            projects: [
              {
                id: 'project-1',
                name: 'Project One',
              },
            ],
          },
        ],
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method with userId
      const result = await usersClient.getTeamsWithOrganizationsAndProjects({
        userId: 'user-1',
      });

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/users/get_teams_with_organizations_and_projects',
        { userId: 'user-1' },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should call the correct endpoint with clerkUserId parameter', async () => {
      // Mock response data
      const mockResponse = {
        teams: [
          {
            id: 'team-1',
            name: 'Team One',
            organization: {
              id: 'org-1',
              name: 'Organization One',
            },
            projects: [
              {
                id: 'project-1',
                name: 'Project One',
              },
            ],
          },
        ],
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method with clerkUserId
      const result = await usersClient.getTeamsWithOrganizationsAndProjects({
        clerkUserId: 'clerk-user-1',
      });

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/users/get_teams_with_organizations_and_projects',
        { clerkUserId: 'clerk-user-1' },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should call the correct endpoint with email parameter', async () => {
      // Mock response data
      const mockResponse = {
        teams: [
          {
            id: 'team-1',
            name: 'Team One',
            organization: {
              id: 'org-1',
              name: 'Organization One',
            },
            projects: [
              {
                id: 'project-1',
                name: 'Project One',
              },
            ],
          },
        ],
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method with email
      const result = await usersClient.getTeamsWithOrganizationsAndProjects({
        email: 'user1@example.com',
      });

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/users/get_teams_with_organizations_and_projects',
        { email: 'user1@example.com' },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should call the correct endpoint with multiple parameters', async () => {
      // Mock response data
      const mockResponse = {
        teams: [
          {
            id: 'team-1',
            name: 'Team One',
            organization: {
              id: 'org-1',
              name: 'Organization One',
            },
            projects: [
              {
                id: 'project-1',
                name: 'Project One',
              },
            ],
          },
        ],
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method with multiple parameters
      const result = await usersClient.getTeamsWithOrganizationsAndProjects({
        userId: 'user-1',
        email: 'user1@example.com',
      });

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/users/get_teams_with_organizations_and_projects',
        { userId: 'user-1', email: 'user1@example.com' },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('getUserRoles', () => {
    it('should call the correct endpoint to get user roles', async () => {
      // Mock response data
      const mockResponse = [
        {
          id: 'role-1',
          name: 'Admin',
          description: 'Administrator role',
          permissions: ['read', 'write', 'delete'],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'role-2',
          name: 'Viewer',
          description: 'Viewer role',
          permissions: ['read'],
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await usersClient.getUserRoles('user-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/users/user-1/roles');

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('addUserRole', () => {
    it('should call the correct endpoint to add a role to a user', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method
      const result = await usersClient.addUserRole('user-1', 'role-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/users/user-1/roles/role-1/',
        {
          body: { roleId: 'role-1' },
        },
      );

      // Verify the result
      expect(result.data).toBeUndefined();
    });
  });

  describe('removeUserRole', () => {
    it('should call the correct endpoint to remove a role from a user', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method
      const result = await usersClient.removeUserRole('user-1', 'role-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/v1/users/user-1/roles/role-1/',
      );

      // Verify the result
      expect(result.data).toBeUndefined();
    });
  });

  describe('createUser', () => {
    it('should call the correct endpoint to create a user', async () => {
      // Mock request data
      const createParams = {
        email: 'newuser@example.com',
        name: 'New User',
        organizationId: 'org-1',
        role: 'user',
      };

      // Mock response data
      const mockResponse = {
        id: 'new-user',
        email: 'newuser@example.com',
        name: 'New User',
        organizationId: 'org-1',
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
        clerkUserId: 'clerk-user-new',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await usersClient.createUser(createParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/users', {
        email: 'newuser@example.com',
        name: 'New User',
        organization_id: 'org-1',
        role: 'user',
      });

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });
});
