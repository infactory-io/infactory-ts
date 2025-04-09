import type { PaginationParams } from '@/types/common.js';
import { sharedClient, type ApiResponse } from '@/core/shared-client.js';

/**
 * KnowledgeGraph API endpoints
 * Provides access to the knowledge graph functionality.
 */
export const knowledgeGraphApi = {
  /**
   * Get a knowledge graph by ID
   *
   * @param id - The ID of the knowledge graph to retrieve
   * @returns The knowledge graph details
   */
  getKnowledgeGraph: async (id: string): Promise<ApiResponse<any>> => {
    return await sharedClient.get<any>(`/v1/knowledge-graph/${id}`);
  },

  /**
   * List knowledge graphs
   *
   * @param params - Optional pagination and filtering parameters
   * @returns A list of knowledge graphs
   */
  listKnowledgeGraphs: async (
    params?: PaginationParams & { projectId?: string },
  ): Promise<ApiResponse<any[]>> => {
    return await sharedClient.get<any[]>(`/v1/knowledge-graph`, { params });
  },

  /**
   * Create a new knowledge graph
   *
   * @param params - Parameters for creating a knowledge graph
   * @returns The created knowledge graph
   */
  createKnowledgeGraph: async (params: {
    name: string;
    projectId: string;
    description?: string;
    schema?: any;
    config?: Record<string, any>;
  }): Promise<ApiResponse<any>> => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value != null),
    );
    return await sharedClient.post<any>('/v1/knowledge-graph', filteredParams);
  },

  /**
   * Update a knowledge graph
   *
   * @param id - The ID of the knowledge graph to update
   * @param params - Parameters to update
   * @returns The updated knowledge graph
   */
  updateKnowledgeGraph: async (
    id: string,
    params: {
      name?: string;
      description?: string;
      schema?: any;
      config?: Record<string, any>;
    },
  ): Promise<ApiResponse<any>> => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value != null),
    );
    return await sharedClient.patch<any>(
      `/v1/knowledge-graph/${id}`,
      filteredParams,
    );
  },

  /**
   * Delete a knowledge graph
   *
   * @param id - The ID of the knowledge graph to delete
   * @returns The deletion response
   */
  deleteKnowledgeGraph: async (id: string): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(`/v1/knowledge-graph/${id}`);
  },

  /**
   * Get knowledge graph schema
   *
   * @param id - The ID of the knowledge graph
   * @returns The knowledge graph schema
   */
  getKnowledgeGraphSchema: async (id: string): Promise<ApiResponse<any>> => {
    return await sharedClient.get<any>(`/v1/knowledge-graph/${id}/schema`);
  },

  /**
   * Update knowledge graph schema
   *
   * @param id - The ID of the knowledge graph
   * @param schema - The new schema to apply
   * @returns The updated schema
   */
  updateKnowledgeGraphSchema: async (
    id: string,
    schema: any,
  ): Promise<ApiResponse<any>> => {
    return await sharedClient.patch<any>(
      `/v1/knowledge-graph/${id}/schema`,
      schema,
    );
  },

  /**
   * Query a knowledge graph
   *
   * @param id - The ID of the knowledge graph to query
   * @param query - The query to execute
   * @returns The query results
   */
  queryKnowledgeGraph: async (
    id: string,
    query: any,
  ): Promise<ApiResponse<any>> => {
    return await sharedClient.post<any>(
      `/v1/knowledge-graph/${id}/query`,
      query,
    );
  },
};
