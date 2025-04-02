import { get, post, del } from '@/core/client.js';
import { User, RBACRole, ApiResponse } from '@/types/common.js';

export const usersApi = {
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    return await get<User[]>('/v1/users');
  },

  getUser: async (userId: string): Promise<ApiResponse<User>> => {
    return await get<User>(`/v1/users/${userId}`);
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return await get<User>('/v1/users/me');
  },

  getOrCreateUserTeamOrganization: async ({
    clerk_user_id,
    clerk_org_id,
    platform_id,
  }: {
    clerk_user_id: string;
    clerk_org_id: string;
    platform_id: string;
  }): Promise<ApiResponse<User>> => {
    return await post<User>('/v1/users/get_or_create_user_team_organization', {
      body: JSON.stringify({ clerk_user_id, clerk_org_id, platform_id }),
    });
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
    if (userId) queryParams.append('user_id', userId);
    if (clerkUserId) queryParams.append('clerk_user_id', clerkUserId);
    if (email) queryParams.append('email', email);

    return await get<any>(
      `/v1/users/get_teams_with_organizations_and_projects?${queryParams.toString()}`,
    );
  },

  getUserRoles: async (userId: string): Promise<ApiResponse<RBACRole[]>> => {
    return await get<RBACRole[]>(`/v1/users/${userId}/roles`);
  },

  addUserRole: async (
    userId: string,
    roleId: string,
  ): Promise<ApiResponse<void>> => {
    return await post<void>(`/v1/users/${userId}/roles/${roleId}/`, {
      body: JSON.stringify({ role_id: roleId }),
    });
  },

  removeUserRole: async (
    userId: string,
    roleId: string,
  ): Promise<ApiResponse<void>> => {
    return await del<void>(`/v1/users/${userId}/roles/${roleId}/`);
  },
};
