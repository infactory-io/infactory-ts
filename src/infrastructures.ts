import { fetchApi } from './client';
import {
  Infrastructure,
  CreateInfrastructureParams,
  ApiResponse
} from './types';

export const infrastructuresApi = {
  listInfrastructures: async (params?: {
    organization_id?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Infrastructure[]>> => {
    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return fetchApi<Infrastructure[]>(`/v1/infrastructures?${queryString}`);
  },

  getInfrastructure: async (
    id: string
  ): Promise<ApiResponse<Infrastructure>> => {
    return fetchApi<Infrastructure>(`/v1/infrastructures/${id}`);
  },

  createInfrastructure: async (
    params: CreateInfrastructureParams
  ): Promise<ApiResponse<Infrastructure>> => {
    return fetchApi<Infrastructure>('/v1/infrastructures', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  updateInfrastructure: async (
    id: string,
    params: Partial<CreateInfrastructureParams>
  ): Promise<ApiResponse<Infrastructure>> => {
    return fetchApi<Infrastructure>(`/v1/infrastructures/${id}`, {
      method: 'PUT',
      body: JSON.stringify(params)
    });
  },

  deleteInfrastructure: async (id: string): Promise<ApiResponse<void>> => {
    return fetchApi<void>(`/v1/infrastructures/${id}`, {
      method: 'DELETE'
    });
  },

  validateInfrastructureConfig: async (params: {
    type: string;
    config: Record<string, any>;
  }): Promise<ApiResponse<{ valid: boolean; errors?: string[] }>> => {
    return fetchApi<{ valid: boolean; errors?: string[] }>(
      '/v1/infrastructures/validate',
      {
        method: 'POST',
        body: JSON.stringify(params)
      }
    );
  },

  getInfrastructureTypes: async (): Promise<
    ApiResponse<{ types: string[]; schemas: Record<string, any> }>
  > => {
    return fetchApi<{ types: string[]; schemas: Record<string, any> }>(
      '/v1/infrastructures/types'
    );
  },

  getInfrastructureStatus: async (
    id: string
  ): Promise<
    ApiResponse<{
      status: 'active' | 'inactive' | 'error';
      last_check: string;
      error?: string;
    }>
  > => {
    return fetchApi<{
      status: 'active' | 'inactive' | 'error';
      last_check: string;
      error?: string;
    }>(`/v1/infrastructures/${id}/status`);
  },

  testInfrastructureConnection: async (
    id: string
  ): Promise<
    ApiResponse<{
      success: boolean;
      message?: string;
      details?: Record<string, any>;
    }>
  > => {
    return fetchApi<{
      success: boolean;
      message?: string;
      details?: Record<string, any>;
    }>(`/v1/infrastructures/${id}/test`, {
      method: 'POST'
    });
  },

  syncInfrastructure: async (
    id: string
  ): Promise<
    ApiResponse<{
      success: boolean;
      message?: string;
      sync_id?: string;
    }>
  > => {
    return fetchApi<{
      success: boolean;
      message?: string;
      sync_id?: string;
    }>(`/v1/infrastructures/${id}/sync`, {
      method: 'POST'
    });
  },

  getInfrastructureMetrics: async (
    id: string,
    params?: {
      start_date?: string;
      end_date?: string;
      metrics?: string[];
    }
  ): Promise<
    ApiResponse<{
      metrics: Record<string, any>;
      period: { start: string; end: string };
    }>
  > => {
    const queryString = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return fetchApi<{
      metrics: Record<string, any>;
      period: { start: string; end: string };
    }>(`/v1/infrastructures/${id}/metrics?${queryString}`);
  },

  getInfrastructureResources: async (
    id: string
  ): Promise<
    ApiResponse<{
      resources: Array<{
        type: string;
        id: string;
        name: string;
        status: string;
        metadata?: Record<string, any>;
      }>;
    }>
  > => {
    return fetchApi<{
      resources: Array<{
        type: string;
        id: string;
        name: string;
        status: string;
        metadata?: Record<string, any>;
      }>;
    }>(`/v1/infrastructures/${id}/resources`);
  },

  updateInfrastructureCredentials: async (
    id: string,
    params: {
      credentials_id: string;
    }
  ): Promise<ApiResponse<Infrastructure>> => {
    return fetchApi<Infrastructure>(`/v1/infrastructures/${id}/credentials`, {
      method: 'PUT',
      body: JSON.stringify(params)
    });
  },

  rotateInfrastructureCredentials: async (
    id: string
  ): Promise<
    ApiResponse<{
      success: boolean;
      message?: string;
    }>
  > => {
    return fetchApi<{
      success: boolean;
      message?: string;
    }>(`/v1/infrastructures/${id}/credentials/rotate`, {
      method: 'POST'
    });
  }
};
