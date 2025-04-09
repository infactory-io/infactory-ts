import { get, post, patch, del } from '@/core/client.js';
import { ApiResponse, PaginationParams } from '@/types/common.js';

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
    return await get<any>(`/v1/knowledge-graph/${id}`);
  },

  /**
   * List knowledge graphs
   *
   * @param params - Optional pagination and filtering parameters
   * @returns A list of knowledge graphs
   */
  listKnowledgeGraphs: async (
    params?: PaginationParams & { project_id?: string },
  ): Promise<ApiResponse<any[]>> => {
    return await get<any[]>(`/v1/knowledge-graph`, { params });
  },

  /**
   * Create a new knowledge graph
   *
   * @param params - Parameters for creating a knowledge graph
   * @returns The created knowledge graph
   */
  createKnowledgeGraph: async (params: {
    name: string;
    project_id: string;
    description?: string;
    schema?: any;
    config?: Record<string, any>;
  }): Promise<ApiResponse<any>> => {
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value != null),
    );
    return await post<any>('/v1/knowledge-graph', {
      body: filteredParams,
    });
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
    return await patch<any>(`/v1/knowledge-graph/${id}`, {
      body: filteredParams,
    });
  },

  /**
   * Delete a knowledge graph
   *
   * @param id - The ID of the knowledge graph to delete
   * @returns Void on success
   */
  deleteKnowledgeGraph: async (id: string): Promise<ApiResponse<void>> => {
    return await del<void>(`/v1/knowledge-graph/${id}`);
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
    query: string,
    params?: { limit?: number; offset?: number },
  ): Promise<ApiResponse<any>> => {
    return await post<any>(`/v1/knowledge-graph/${id}/query`, {
      body: { query, ...params },
    });
  },
};
