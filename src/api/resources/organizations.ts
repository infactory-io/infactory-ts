import { get, post, put, del } from '@/core/client.js';
import {
  Organization,
  CreateOrganizationParams,
  ApiResponse,
} from '@/types/common.js';

export const organizationsApi = {
  getOrganizations: async (): Promise<ApiResponse<Organization[]>> => {
    return await get<Organization[]>('/v1/orgs');
  },

  getOrganization: async (
    organizationId: string,
  ): Promise<ApiResponse<Organization>> => {
    return await get<Organization>(`/v1/orgs/${organizationId}`);
  },

  getClerkOrganization: async (
    organizationId: string,
  ): Promise<ApiResponse<Organization>> => {
    return await get<Organization>(`/v1/orgs/clerk/${organizationId}`);
  },

  createOrganization: async (
    params: CreateOrganizationParams,
  ): Promise<ApiResponse<Organization>> => {
    return await post<Organization>('/v1/orgs', {
      body: JSON.stringify(params),
    });
  },

  updateOrganization: async (
    organizationId: string,
    params: Partial<CreateOrganizationParams>,
  ): Promise<ApiResponse<Organization>> => {
    return await put<Organization>(`/v1/orgs/${organizationId}`, {
      body: JSON.stringify(params),
    });
  },

  deleteOrganization: async (
    organizationId: string,
  ): Promise<ApiResponse<void>> => {
    return await del<void>(`/v1/orgs/${organizationId}`);
  },
};
