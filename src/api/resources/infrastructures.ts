import type {
  Infrastructure,
  CreateInfrastructureParams,
} from '@/types/common.js';
import { sharedClient, type ApiResponse } from '@/core/shared-client.js';

export const infrastructuresApi = {
  listInfrastructures: async (params?: {
    organizationId?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Infrastructure[]>> => {
    return await sharedClient.get<Infrastructure[]>(
      '/v1/infrastructures',
      params,
    );
  },

  getInfrastructure: async (
    id: string,
  ): Promise<ApiResponse<Infrastructure>> => {
    return await sharedClient.get<Infrastructure>(`/v1/infrastructures/${id}`);
  },

  createInfrastructure: async (
    params: CreateInfrastructureParams,
  ): Promise<ApiResponse<Infrastructure>> => {
    return await sharedClient.post<Infrastructure>(
      '/v1/infrastructures',
      params,
    );
  },

  updateInfrastructure: async (
    id: string,
    params: Partial<CreateInfrastructureParams>,
  ): Promise<ApiResponse<Infrastructure>> => {
    return await sharedClient.post<Infrastructure>(
      `/v1/infrastructures/${id}`,
      params,
    );
  },

  deleteInfrastructure: async (id: string): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(`/v1/infrastructures/${id}`);
  },

  validateInfrastructureConfig: async (params: {
    type: string;
    config: Record<string, any>;
  }): Promise<ApiResponse<{ valid: boolean; errors?: string[] }>> => {
    return await sharedClient.post<{ valid: boolean; errors?: string[] }>(
      '/v1/infrastructures/validate',
      params,
    );
  },

  getInfrastructureTypes: async (): Promise<
    ApiResponse<{ types: string[]; schemas: Record<string, any> }>
  > => {
    return await sharedClient.get<{
      types: string[];
      schemas: Record<string, any>;
    }>('/v1/infrastructures/types');
  },

  getInfrastructureStatus: async (
    id: string,
  ): Promise<
    ApiResponse<{
      status: 'active' | 'inactive' | 'error';
      lastCheck: string;
      error?: string;
    }>
  > => {
    return await sharedClient.get<{
      status: 'active' | 'inactive' | 'error';
      lastCheck: string;
      error?: string;
    }>(`/v1/infrastructures/${id}/status`);
  },

  testInfrastructureConnection: async (
    id: string,
  ): Promise<
    ApiResponse<{
      success: boolean;
      message?: string;
      details?: Record<string, any>;
    }>
  > => {
    return await sharedClient.post<{
      success: boolean;
      message?: string;
      details?: Record<string, any>;
    }>(`/v1/infrastructures/${id}/test`);
  },

  syncInfrastructure: async (
    id: string,
  ): Promise<
    ApiResponse<{
      success: boolean;
      message?: string;
      sync_id?: string;
    }>
  > => {
    return await sharedClient.post<{
      success: boolean;
      message?: string;
      sync_id?: string;
    }>(`/v1/infrastructures/${id}/sync`);
  },

  getInfrastructureMetrics: async (
    id: string,
    params?: {
      start_date?: string;
      end_date?: string;
      metrics?: string[];
    },
  ): Promise<
    ApiResponse<{
      metrics: Record<string, any>;
      period: { start: string; end: string };
    }>
  > => {
    return await sharedClient.get<{
      metrics: Record<string, any>;
      period: { start: string; end: string };
    }>(`/v1/infrastructures/${id}/metrics`, params);
  },

  getInfrastructureResources: async (
    id: string,
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
    return await sharedClient.get<{
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
      credentialsId: string;
    },
  ): Promise<ApiResponse<Infrastructure>> => {
    return await sharedClient.post<Infrastructure>(
      `/v1/infrastructures/${id}/credentials`,
      params,
    );
  },

  rotateInfrastructureCredentials: async (
    id: string,
  ): Promise<
    ApiResponse<{
      success: boolean;
      message?: string;
    }>
  > => {
    return await sharedClient.post<{
      success: boolean;
      message?: string;
    }>(`/v1/infrastructures/${id}/credentials/rotate`);
  },
};
