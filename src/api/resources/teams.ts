import type { Team, CreateTeamParams, TeamMembership } from '@/types/common.js';
import { sharedClient, type ApiResponse } from '@/core/shared-client.js';

export const teamsApi = {
  getTeams: async (): Promise<ApiResponse<Team[]>> => {
    return await sharedClient.get<Team[]>('/v1/teams');
  },

  getTeam: async (teamId: string): Promise<ApiResponse<Team>> => {
    return await sharedClient.get<Team>(`/v1/teams/${teamId}`);
  },

  createTeam: async (params: CreateTeamParams): Promise<ApiResponse<Team>> => {
    return await sharedClient.post<Team>('/v1/teams', params);
  },

  updateTeam: async (
    teamId: string,
    params: Partial<CreateTeamParams>,
  ): Promise<ApiResponse<Team>> => {
    return await sharedClient.patch<Team>(`/v1/teams/${teamId}`, params);
  },

  deleteTeam: async (teamId: string): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(`/v1/teams/${teamId}`);
  },

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
        user_id: userId,
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
