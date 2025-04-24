import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TeamsClient } from '../../src/clients/teams-client.js';
import { HttpClient } from '../../src/core/http-client.js';
import { createErrorFromStatus } from '../../src/errors/index.js';
import { TeamMembershipRole } from '@/types/common.js';

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

describe('TeamsClient', () => {
  let teamsClient: TeamsClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Create a new mock HttpClient instance
    mockHttpClient = new HttpClient({
      baseUrl: 'https://api.infactory.ai',
      apiKey: 'test-api-key',
    });

    // Create a new TeamsClient with the mock HttpClient
    teamsClient = new TeamsClient(mockHttpClient);
  });

  describe('getTeams', () => {
    it('should call the correct endpoint to list teams for an organization', async () => {
      const orgId = 'org-123';

      // Mock response data
      const mockTeams = [
        {
          id: 'team-1',
          name: 'Team 1',
          organizationId: orgId,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'team-2',
          name: 'Team 2',
          organizationId: orgId,
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockTeams,
      });

      // Call the method
      const result = await teamsClient.getTeams(orgId);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/teams', {
        organization_id: orgId,
      });

      // Verify the result
      expect(result.data).toEqual(mockTeams);
    });

    it('should throw an error when organization ID is not provided', async () => {
      // Call the method without an organization ID
      await expect(teamsClient.getTeams('')).rejects.toThrow(
        'Organization ID is required',
      );
    });

    it('should handle errors when listing teams', async () => {
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
      const result = await teamsClient.getTeams('org-123');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/teams', {
        organization_id: 'org-123',
      });

      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getTeam', () => {
    it('should call the correct endpoint to get a team by ID', async () => {
      // Mock response data
      const mockTeam = {
        id: 'team-1',
        name: 'Team 1',
        organizationId: 'org-123',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockTeam,
      });

      // Call the method
      const result = await teamsClient.getTeam('team-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/teams/team-1');

      // Verify the result
      expect(result.data).toEqual(mockTeam);
    });
  });

  describe('createTeam', () => {
    it('should call the correct endpoint to create a team', async () => {
      // Mock request data
      const createParams = {
        name: 'New Team',
        organizationId: 'org-123',
      };

      // Mock response data
      const mockResponse = {
        id: 'new-team',
        name: 'New Team',
        organizationId: 'org-123',
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await teamsClient.createTeam(createParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/teams', undefined, {
        params: {
          name: 'New Team',
          organization_id: 'org-123',
        },
      });

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should validate team name is not empty', async () => {
      // Call with empty name
      await expect(
        teamsClient.createTeam({
          name: '',
          organizationId: 'org-123',
        }),
      ).rejects.toThrow('Team name is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should validate organization ID is provided', async () => {
      // Call without organization ID
      await expect(
        teamsClient.createTeam({
          name: 'New Team',
          organizationId: '',
        }),
      ).rejects.toThrow('Organization ID is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });
  });

  describe('updateTeam', () => {
    it('should call the correct endpoint to update a team', async () => {
      // Mock request data
      const updateParams = {
        name: 'Updated Team',
      };

      // Mock response data
      const mockResponse = {
        id: 'team-1',
        name: 'Updated Team',
        organizationId: 'org-123',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await teamsClient.updateTeam('team-1', updateParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/teams/team-1',
        undefined,
        {
          params: { name: 'Updated Team' },
        },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('deleteTeam', () => {
    it('should call the correct endpoint to delete a team', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method
      const result = await teamsClient.deleteTeam('team-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/v1/teams/team-1');

      // Verify the result
      expect(result.data).toEqual(undefined);
    });
  });

  describe('moveTeam', () => {
    it('should call the correct endpoint to move a team to a new organization', async () => {
      // Mock response data
      const mockResponse = {
        id: 'team-1',
        name: 'Team 1',
        organizationId: 'new-org-123',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-05T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await teamsClient.moveTeam('team-1', 'new-org-123');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/teams/team-1/move',
        undefined,
        {
          params: { new_organization_id: 'new-org-123' },
        },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('getTeamMemberships', () => {
    it('should validate teamId is provided', async () => {
      // Call without teamId
      await expect(teamsClient.getTeamMemberships('')).rejects.toThrow(
        'Team ID is required',
      );

      // Verify HTTP client was not called
      expect(mockHttpClient.get).not.toHaveBeenCalled();
    });

    it('should call the correct endpoint to get team memberships', async () => {
      // Mock response data
      const mockMemberships = [
        {
          userId: 'user-1',
          teamId: 'team-1',
          role: TeamMembershipRole.ADMIN,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          userId: 'user-2',
          teamId: 'team-1',
          role: TeamMembershipRole.MEMBER,
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockMemberships,
      });

      // Call the method
      const result = await teamsClient.getTeamMemberships('team-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith(
        '/v1/team-memberships/team/team-1',
      );

      // Verify the result
      expect(result.data).toEqual(mockMemberships);
    });
  });

  describe('createTeamMembership', () => {
    it('should validate teamId is provided', async () => {
      // Call without teamId
      await expect(
        teamsClient.createTeamMembership(
          '',
          'user-3',
          TeamMembershipRole.VIEWER,
        ),
      ).rejects.toThrow('Team ID is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should validate userId is provided', async () => {
      // Call without userId
      await expect(
        teamsClient.createTeamMembership(
          'team-1',
          '',
          TeamMembershipRole.VIEWER,
        ),
      ).rejects.toThrow('User ID is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should validate role is provided', async () => {
      // Call without role
      await expect(
        teamsClient.createTeamMembership('team-1', 'user-3', null as any),
      ).rejects.toThrow('Role is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.post).not.toHaveBeenCalled();
    });

    it('should call the correct endpoint to create a team membership', async () => {
      // Mock response data
      const mockResponse = {
        userId: 'user-3',
        teamId: 'team-1',
        role: TeamMembershipRole.VIEWER,
        createdAt: '2025-01-05T00:00:00Z',
        updatedAt: '2025-01-05T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await teamsClient.createTeamMembership(
        'team-1',
        'user-3',
        TeamMembershipRole.VIEWER,
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/team-memberships', {
        teamId: 'team-1',
        userId: 'user-3',
        role: TeamMembershipRole.VIEWER,
      });

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('updateTeamMembership', () => {
    it('should validate teamId is provided', async () => {
      // Call without teamId
      await expect(
        teamsClient.updateTeamMembership(
          '',
          'user-2',
          TeamMembershipRole.ADMIN,
        ),
      ).rejects.toThrow('Team ID is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.patch).not.toHaveBeenCalled();
    });

    it('should validate userId is provided', async () => {
      // Call without userId
      await expect(
        teamsClient.updateTeamMembership(
          'team-1',
          '',
          TeamMembershipRole.ADMIN,
        ),
      ).rejects.toThrow('User ID is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.patch).not.toHaveBeenCalled();
    });

    it('should validate role is provided', async () => {
      // Call without role
      await expect(
        teamsClient.updateTeamMembership('team-1', 'user-2', null as any),
      ).rejects.toThrow('Role is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.patch).not.toHaveBeenCalled();
    });

    it('should call the correct endpoint to update a team membership', async () => {
      // Mock response data
      const mockResponse = {
        userId: 'user-2',
        teamId: 'team-1',
        role: TeamMembershipRole.ADMIN,
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-05T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await teamsClient.updateTeamMembership(
        'team-1',
        'user-2',
        TeamMembershipRole.ADMIN,
      );

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith(
        '/v1/team-memberships/user-2/team-1',
        { role: TeamMembershipRole.ADMIN },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('deleteTeamMembership', () => {
    it('should validate teamId is provided', async () => {
      // Call without teamId
      await expect(
        teamsClient.deleteTeamMembership('', 'user-2'),
      ).rejects.toThrow('Team ID is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.delete).not.toHaveBeenCalled();
    });

    it('should validate userId is provided', async () => {
      // Call without userId
      await expect(
        teamsClient.deleteTeamMembership('team-1', ''),
      ).rejects.toThrow('User ID is required');

      // Verify HTTP client was not called
      expect(mockHttpClient.delete).not.toHaveBeenCalled();
    });

    it('should call the correct endpoint to delete a team membership', async () => {
      // Mock response data
      const mockResponse = {
        userId: 'user-2',
        teamId: 'team-1',
        role: TeamMembershipRole.MEMBER,
        createdAt: '2025-01-02T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
        deletedAt: '2025-01-05T00:00:00Z',
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: mockResponse,
      });

      // Call the method
      const result = await teamsClient.deleteTeamMembership('team-1', 'user-2');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/v1/team-memberships/user-2/team-1',
        { permanent: false },
      );

      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });

    it('should support permanent deletion of a team membership', async () => {
      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: undefined,
      });

      // Call the method with permanent flag
      await teamsClient.deleteTeamMembership('team-1', 'user-2', true);

      // Verify the HTTP client was called correctly with permanent flag
      expect(mockHttpClient.delete).toHaveBeenCalledWith(
        '/v1/team-memberships/user-2/team-1',
        { permanent: true },
      );
    });
  });
});
