import type { Team, TeamMembership } from '@/types/common.js';
import { sharedClient, type ApiResponse } from '@/core/shared-client.js';

// Assuming CreateTeamParams is { name?: string; organizationId?: string; }
// Assuming UpdateTeamParams is { name?: string; }

export const teamsApi = {
  getTeams: async (organizationId: string): Promise<ApiResponse<Team[]>> => {
    return await sharedClient.get<Team[]>('/v1/teams', {
      organizationId: organizationId,
    });
  },

  getTeam: async (teamId: string): Promise<ApiResponse<Team>> => {
    return await sharedClient.get<Team>(`/v1/teams/${teamId}`);
  },

  createTeam: async (params: {
    name?: string;
    organizationId?: string;
  }): Promise<ApiResponse<Team>> => {
    // Sending parameters as query params per the FastAPI spec
    return await sharedClient.post<Team>('/v1/teams', undefined, {
      params: {
        name: params.name,
        organization_id: params.organizationId,
      },
    });
  },

  updateTeam: async (
    teamId: string,
    params: { name?: string }, // Only name is specified in the FastAPI spec for update
  ): Promise<ApiResponse<Team>> => {
    // Sending name as a query param per the FastAPI spec
    return await sharedClient.patch<Team>(`/v1/teams/${teamId}`, undefined, {
      params: { name: params.name },
    });
  },

  // Add the missing moveTeam endpoint
  moveTeam: async (
    teamId: string,
    newOrganizationId: string,
  ): Promise<ApiResponse<Team>> => {
    return await sharedClient.post<Team>(
      `/v1/teams/${teamId}/move`,
      undefined,
      {
        params: { new_organization_id: newOrganizationId },
      },
    );
  },

  deleteTeam: async (teamId: string): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(`/v1/teams/${teamId}`);
  },

  // TODO verify these below
  getTeamMemberships: async (
    teamId: string,
  ): Promise<ApiResponse<TeamMembership[]>> => {
    return await sharedClient.get<TeamMembership[]>(
      `/v1/teams/${teamId}/memberships`,
    );
  },

  createTeamMembership: async (
    teamId: string,
    userId: string,
  ): Promise<ApiResponse<TeamMembership>> => {
    return await sharedClient.post<TeamMembership>(
      `/v1/teams/${teamId}/memberships`,
      {
        userId: userId,
      },
    );
  },

  deleteTeamMembership: async (
    teamId: string,
    userId: string,
  ): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(
      `/v1/teams/${teamId}/memberships/${userId}`,
    );
  },
};
