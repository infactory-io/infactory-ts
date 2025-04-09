import { sharedClient, ApiResponse } from '@/core/shared-client.js';
import { User, RBACRole } from '@/types/common.js';

export const usersApi = {
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    return await sharedClient.get<User[]>('/v1/users');
  },

  getUser: async (userId: string): Promise<ApiResponse<User>> => {
    return await sharedClient.get<User>(`/v1/users/${userId}`);
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return await sharedClient.get<User>('/v1/authentication/me');
  },

  getOrCreateUserTeamOrganization: async ({
    clerkUserId,
    clerkOrgId,
    platformId,
  }: {
    clerkUserId: string;
    clerkOrgId: string;
    platformId: string;
  }): Promise<ApiResponse<User>> => {
    return await sharedClient.post<User>(
      '/v1/users/get_or_create_user_team_organization',
      {
        body: { clerkUserId, clerkOrgId, platformId },
      },
    );
  },

  getTeamsWithOrganizationsAndProjects: async ({
    userId,
    clerkUserId,
    email,
  }: {
    userId?: string;
    clerkUserId?: string;
    email?: string;
  }): Promise<ApiResponse<any>> => {
    const queryParams = new URLSearchParams();
    if (userId) {
      queryParams.append('userId', userId);
    }
    if (clerkUserId) {
      queryParams.append('clerk_userId', clerkUserId);
    }
    if (email) {
      queryParams.append('email', email);
    }

    return await sharedClient.get<any>(
      `/v1/users/get_teams_with_organizations_and_projects?${queryParams.toString()}`,
    );
  },

  getUserRoles: async (userId: string): Promise<ApiResponse<RBACRole[]>> => {
    return await sharedClient.get<RBACRole[]>(`/v1/users/${userId}/roles`);
  },

  addUserRole: async (
    userId: string,
    roleId: string,
  ): Promise<ApiResponse<void>> => {
    return await sharedClient.post<void>(
      `/v1/users/${userId}/roles/${roleId}/`,
      {
        body: { roleId },
      },
    );
  },

  removeUserRole: async (
    userId: string,
    roleId: string,
  ): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(
      `/v1/users/${userId}/roles/${roleId}/`,
    );
  },
};
