import { HttpClient } from '../core/http-client.js';
import {
  ApiResponse,
  Team,
  TeamMembership,
  TeamMembershipRole,
} from '../types/common.js';

/**
 * Parameters for creating a team
 */
export type CreateTeamParams = Pick<Team, 'name' | 'organizationId'>;

/**
 * Parameters for updating a team
 */
export type UpdateTeamParams = Pick<Team, 'name'>;

/**
 * Client for managing teams in the Infactory API
 */
export class TeamsClient {
  /**
   * Creates a new TeamsClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Get a list of all teams for an organization
   * @param organizationId - The ID of the organization to get teams for
   * @returns A promise that resolves to an API response containing an array of teams
   */
  async getTeams(organizationId: string): Promise<ApiResponse<Team[]>> {
    if (!organizationId) {
      throw new Error('Organization ID is required');
    }
    return this.httpClient.get<Team[]>('/v1/teams', {
      organization_id: organizationId,
    });
  }

  /**
   * Get a team by ID
   * @param id - The ID of the team to retrieve
   * @returns A promise that resolves to an API response containing the team
   */
  async getTeam(id: string): Promise<ApiResponse<Team>> {
    return this.httpClient.get<Team>(`/v1/teams/${id}`);
  }

  /**
   * Create a new team
   * @param params - The parameters for creating the team
   * @returns A promise that resolves to an API response containing the created team
   */
  async createTeam(params: CreateTeamParams): Promise<ApiResponse<Team>> {
    // Client-side validation
    if (!params.name || params.name.trim() === '') {
      throw new Error('Team name is required');
    }
    if (!params.organizationId) {
      throw new Error('Organization ID is required');
    }

    return this.httpClient.post<Team>('/v1/teams', undefined, {
      params: {
        name: params.name,
        organization_id: params.organizationId,
      },
    });
  }

  /**
   * Update a team
   * @param id - The ID of the team to update
   * @param params - The parameters for updating the team
   * @returns A promise that resolves to an API response containing the updated team
   */
  async updateTeam(
    id: string,
    params: UpdateTeamParams,
  ): Promise<ApiResponse<Team>> {
    return this.httpClient.patch<Team>(`/v1/teams/${id}`, undefined, {
      params: { name: params.name },
    });
  }

  /**
   * Delete a team
   * @param id - The ID of the team to delete
   * @returns A promise that resolves to an API response
   */
  async deleteTeam(id: string): Promise<ApiResponse<void>> {
    return this.httpClient.delete<void>(`/v1/teams/${id}`);
  }

  /**
   * Move a team to a new organization
   * @param id - The ID of the team to move
   * @param newOrganizationId - The ID of the organization to move the team to
   * @returns A promise that resolves to an API response containing the moved team
   */
  async moveTeam(
    id: string,
    newOrganizationId: string,
  ): Promise<ApiResponse<Team>> {
    return this.httpClient.post<Team>(`/v1/teams/${id}/move`, undefined, {
      params: { new_organization_id: newOrganizationId },
    });
  }

  /**
   * Get all memberships for a team
   * @param teamId - The ID of the team to get memberships for
   * @returns A promise that resolves to an API response containing an array of team memberships
   */
  async getTeamMemberships(
    teamId: string,
  ): Promise<ApiResponse<TeamMembership[]>> {
    if (!teamId) {
      throw new Error('Team ID is required');
    }
    return this.httpClient.get<TeamMembership[]>(
      `/v1/team-memberships/team/${teamId}`,
    );
  }

  /**
   * Create a team membership
   * @param teamId - The ID of the team
   * @param userId - The ID of the user
   * @param role - The role for the membership
   * @returns A promise that resolves to an API response containing the created team membership
   */
  async createTeamMembership(
    teamId: string,
    userId: string,
    role: TeamMembershipRole,
  ): Promise<ApiResponse<TeamMembership>> {
    if (!teamId) {
      throw new Error('Team ID is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!role) {
      throw new Error('Role is required');
    }
    return this.httpClient.post<TeamMembership>('/v1/team-memberships', {
      teamId: teamId,
      userId: userId,
      role: role,
    });
  }

  /**
   * Update a team membership
   * @param teamId - The ID of the team
   * @param userId - The ID of the user
   * @param role - The new role for the membership
   * @returns A promise that resolves to an API response containing the updated team membership
   */
  async updateTeamMembership(
    teamId: string,
    userId: string,
    role: TeamMembershipRole,
  ): Promise<ApiResponse<TeamMembership>> {
    if (!teamId) {
      throw new Error('Team ID is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!role) {
      throw new Error('Role is required');
    }
    return this.httpClient.patch<TeamMembership>(
      `/v1/team-memberships/${userId}/${teamId}`,
      { role: role },
    );
  }

  /**
   * Delete a team membership
   * @param teamId - The ID of the team
   * @param userId - The ID of the user
   * @param permanent - Whether to permanently delete the membership
   * @returns A promise that resolves to an API response
   */
  async deleteTeamMembership(
    teamId: string,
    userId: string,
    permanent: boolean = false,
  ): Promise<ApiResponse<TeamMembership>> {
    if (!teamId) {
      throw new Error('Team ID is required');
    }
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.httpClient.delete<TeamMembership>(
      `/v1/team-memberships/${userId}/${teamId}`,
      {
        permanent: permanent,
      },
    );
  }
}
