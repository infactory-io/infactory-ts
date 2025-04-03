import { del, get, patch, post } from '@/core/client.js';
import {
  Team,
  CreateTeamParams,
  TeamMembership,
  ApiResponse,
} from '@/types/common.js';

export const teamsApi = {
  getTeams: async (organizationId: string): Promise<ApiResponse<Team[]>> => {
    return await get<Team[]>('/v1/teams', {
      params: { organization_id: organizationId },
    });
  },

  getTeam: async (teamId: string): Promise<ApiResponse<Team>> => {
    return await get<Team>(`/v1/teams/${teamId}`);
  },

  createTeam: async (params: CreateTeamParams): Promise<ApiResponse<Team>> => {
    return await post<Team>('/v1/teams', { body: params });
  },

  updateTeam: async (
    teamId: string,
    params: Partial<CreateTeamParams>,
  ): Promise<ApiResponse<Team>> => {
    return await patch<Team>(`/v1/teams/${teamId}`, { body: params });
  },

  deleteTeam: async (teamId: string): Promise<ApiResponse<void>> => {
    return await del<void>(`/v1/teams/${teamId}`);
  },

  getTeamMemberships: async (
    teamId: string,
  ): Promise<ApiResponse<TeamMembership[]>> => {
    return await get<TeamMembership[]>(`/v1/teams/${teamId}/memberships`);
  },

  addTeamMember: async (
    teamId: string,
    userId: string,
  ): Promise<ApiResponse<TeamMembership>> => {
    return await post<TeamMembership>(`/v1/teams/${teamId}/memberships`, {
      body: { userId },
    });
  },

  removeTeamMember: async (
    teamId: string,
    userId: string,
  ): Promise<ApiResponse<void>> => {
    return await del<void>(`/v1/teams/${teamId}/memberships/${userId}`);
  },
};
