import { HttpClient } from '../core/http-client.js';
import { ApiResponse } from '../types/common.js';
import {
  User,
  UserWithTeamsAndOrganization,
  RBACRole,
} from '../types/common.js';

export interface GetOrCreateUserTeamOrganizationRequest {
  clerkUserId: string;
  clerkOrgId: string;
  platformId: string;
}

/**
 * Client for managing users in the Infactory API
 */
export class UsersClient {
  /**
   * Creates a new UsersClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  /**
   * Get a list of all users
   * @param organizationId - Optional organization ID to filter users
   * @returns A promise that resolves to an API response containing an array of users
   */
  async getUsers(organizationId?: string): Promise<ApiResponse<User[]>> {
    const params: Record<string, string> = {};
    if (organizationId) {
      params.organization_id = organizationId;
    }
    return this.httpClient.get<User[]>('/v1/users', params);
  }

  /**
   * Get a user by ID
   * @param userId - The ID of the user to retrieve
   * @returns A promise that resolves to an API response containing the user
   */
  async getUser(userId: string): Promise<ApiResponse<User>> {
    return this.httpClient.get<User>(`/v1/users/${userId}`);
  }

  /**
   * Get the current authenticated user
   * @returns A promise that resolves to an API response containing the current user with teams and organization
   */
  async getCurrentUser(): Promise<ApiResponse<UserWithTeamsAndOrganization>> {
    return this.httpClient.get<UserWithTeamsAndOrganization>(
      '/v1/authentication/me',
    );
  }

  /**
   * Create a new user
   * @param params - Parameters for creating the user
   * @returns A promise that resolves to an API response containing the created user
   */
  async createUser(params: {
    email?: string;
    name?: string;
    organizationId?: string;
    role?: string;
  }): Promise<ApiResponse<User>> {
    return this.httpClient.post<User>('/v1/users', undefined, {
      params: {
        email: params.email,
        name: params.name,
        organization_id: params.organizationId,
        role: params.role,
      },
    });
  }

  /**
   * Update a user
   * @param userId - The ID of the user to update
   * @param params - Parameters for updating the user
   * @returns A promise that resolves to an API response containing the updated user
   */
  async updateUser(
    userId: string,
    params: {
      email?: string;
      name?: string;
      role?: string;
    },
  ): Promise<ApiResponse<User>> {
    return this.httpClient.patch<User>(`/v1/users/${userId}`, undefined, {
      params: {
        email: params.email,
        name: params.name,
        role: params.role,
      },
    });
  }

  /**
   * Delete a user
   * @param userId - The ID of the user to delete
   * @returns A promise that resolves to an API response containing the deleted user
   */
  async deleteUser(userId: string): Promise<ApiResponse<User>> {
    return this.httpClient.delete<User>(`/v1/users/${userId}`);
  }

  /**
   * Move a user to a new organization
   * @param userId - The ID of the user to move
   * @param newOrganizationId - The ID of the organization to move the user to
   * @returns A promise that resolves to an API response containing the moved user
   */
  async moveUser(
    userId: string,
    newOrganizationId: string,
  ): Promise<ApiResponse<User>> {
    return this.httpClient.post<User>(`/v1/users/${userId}/move`, undefined, {
      params: {
        new_organization_id: newOrganizationId,
      },
    });
  }

  /**
   * Get or create a user, team, and organization based on Clerk IDs
   * @param params - Parameters for getting or creating the user, team, and organization
   * @returns A promise that resolves to an API response containing the user
   */
  async getOrCreateUserTeamOrganization(
    params: GetOrCreateUserTeamOrganizationRequest,
  ): Promise<ApiResponse<User>> {
    return this.httpClient.post<User>(
      '/v1/users/get_or_create_user_team_organization',
      {
        body: params,
      },
    );
  }

  /**
   * Get teams with organizations and projects for a user
   * @param params - Parameters to identify the user
   * @returns A promise that resolves to an API response containing teams with organizations and projects
   */
  async getTeamsWithOrganizationsAndProjects(params: {
    userId?: string;
    clerkUserId?: string;
    email?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params.userId) {
      queryParams.append('userId', params.userId);
    }
    if (params.clerkUserId) {
      queryParams.append('clerk_user_id', params.clerkUserId);
    }
    if (params.email) {
      queryParams.append('email', params.email);
    }

    return this.httpClient.get<any>(
      `/v1/users/get_teams_with_organizations_and_projects?${queryParams.toString()}`,
    );
  }

  /**
   * Get roles for a user
   * @param userId - The ID of the user
   * @returns A promise that resolves to an API response containing user roles
   */
  async getUserRoles(userId: string): Promise<ApiResponse<RBACRole[]>> {
    return this.httpClient.get<RBACRole[]>(`/v1/users/${userId}/roles`);
  }

  /**
   * Add a role to a user
   * @param userId - The ID of the user
   * @param roleId - The ID of the role to add
   * @returns A promise that resolves to an API response
   */
  async addUserRole(
    userId: string,
    roleId: string,
  ): Promise<ApiResponse<void>> {
    return this.httpClient.post<void>(`/v1/users/${userId}/roles/${roleId}/`, {
      body: { roleId },
    });
  }

  /**
   * Remove a role from a user
   * @param userId - The ID of the user
   * @param roleId - The ID of the role to remove
   * @returns A promise that resolves to an API response
   */
  async removeUserRole(
    userId: string,
    roleId: string,
  ): Promise<ApiResponse<void>> {
    return this.httpClient.delete<void>(`/v1/users/${userId}/roles/${roleId}/`);
  }
}
