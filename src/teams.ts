import { fetchApi } from './client';
import { Team, CreateTeamParams, TeamMembership, ApiResponse } from './types';

export const teamsApi = {
  getTeams: async (): Promise<ApiResponse<Team[]>> => {
    return fetchApi<Team[]>('/v1/teams');
  },

  getTeam: async (teamId: string): Promise<ApiResponse<Team>> => {
    return fetchApi<Team>(`/v1/teams/${teamId}`);
  },

  createTeam: async (params: CreateTeamParams): Promise<ApiResponse<Team>> => {
    return fetchApi<Team>('/v1/teams', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  updateTeam: async (
    teamId: string,
    params: Partial<CreateTeamParams>
  ): Promise<ApiResponse<Team>> => {
    return fetchApi<Team>(`/v1/teams/${teamId}`, {
      method: 'PATCH',
      body: JSON.stringify(params)
    });
  },

  deleteTeam: async (teamId: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/v1/teams/${teamId}`, {
      method: 'DELETE'
    });
  },

  getTeamMemberships: async (
    teamId: string
  ): Promise<ApiResponse<TeamMembership[]>> => {
    return fetchApi<TeamMembership[]>(`/v1/teams/${teamId}/memberships`);
  },

  addTeamMember: async (
    teamId: string,
    userId: string
  ): Promise<ApiResponse<TeamMembership>> => {
    return fetchApi<TeamMembership>(`/v1/teams/${teamId}/memberships`, {
      method: 'POST',
      body: JSON.stringify({ userId })
    });
  },

  removeTeamMember: async (
    teamId: string,
    userId: string
  ): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/v1/teams/${teamId}/memberships/${userId}`, {
      method: 'DELETE'
    });
  }
};
