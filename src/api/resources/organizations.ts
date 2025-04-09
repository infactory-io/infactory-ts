import type { Organization, CreateOrganizationParams } from '@/types/common.js';
import { sharedClient, type ApiResponse } from '@/core/shared-client.js';

export const organizationsApi = {
  getOrganizations: async (): Promise<ApiResponse<Organization[]>> => {
    return await sharedClient.get<Organization[]>('/v1/orgs');
  },

  getOrganization: async (
    organizationId: string,
  ): Promise<ApiResponse<Organization>> => {
    return await sharedClient.get<Organization>(`/v1/orgs/${organizationId}`);
  },

  getClerkOrganization: async (
    organizationId: string,
  ): Promise<ApiResponse<Organization>> => {
    return await sharedClient.get<Organization>(
      `/v1/orgs/clerk/${organizationId}`,
    );
  },

  createOrganization: async (
    params: CreateOrganizationParams,
  ): Promise<ApiResponse<Organization>> => {
    return await sharedClient.post<Organization>('/v1/orgs', params);
  },

  updateOrganization: async (
    organizationId: string,
    params: Partial<CreateOrganizationParams>,
  ): Promise<ApiResponse<Organization>> => {
    return await sharedClient.put<Organization>(
      `/v1/orgs/${organizationId}`,
      params,
    );
  },

  deleteOrganization: async (
    organizationId: string,
  ): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(`/v1/orgs/${organizationId}`);
  },
};
