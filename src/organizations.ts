import { fetchApi } from './client';
import { Organization, CreateOrganizationParams, ApiResponse } from './types';

export const organizationsApi = {
  getOrganizations: async (): Promise<ApiResponse<Organization[]>> => {
    return fetchApi<Organization[]>('/v1/orgs');
  },

  getClerkOrganization: async (
    organizationId: string
  ): Promise<ApiResponse<Organization>> => {
    return fetchApi<Organization>(`/v1/orgs/clerk/${organizationId}`);
  },

  createOrganization: async (
    params: CreateOrganizationParams
  ): Promise<ApiResponse<Organization>> => {
    return fetchApi<Organization>('/v1/orgs', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  updateOrganization: async (
    organizationId: string,
    params: Partial<CreateOrganizationParams>
  ): Promise<ApiResponse<Organization>> => {
    return fetchApi<Organization>(`/v1/orgs/${organizationId}`, {
      method: 'PATCH',
      body: JSON.stringify(params)
    });
  },

  deleteOrganization: async (
    organizationId: string
  ): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/v1/orgs/${organizationId}`, {
      method: 'DELETE'
    });
  }
};
