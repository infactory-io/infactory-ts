/**
 * Management Control Plane (MCP) API Resource
 *
 * This resource provides methods for interacting with the Infactory MCP API.
 */
import { get, post } from '../../core/client.js';
import type { StreamOrApiResponse } from '../../utils/stream.js';
import type {
  Project,
  Team,
  User,
  Datasource,
  QueryProgram,
} from '../../types/common.js';

// For type compatibility
type ApiResponse<T> = StreamOrApiResponse<T>;

/**
 * MCP API resources for accessing projects, teams, and other management entities
 */
export const mcpResource = {
  /**
   * Get the current authenticated user information
   *
   * @returns User information for the currently authenticated user
   */
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    return await get<User>('/v1/users/me');
  },

  /**
   * List all projects the user has access to
   *
   * @returns Array of projects
   */
  listProjects: async (): Promise<ApiResponse<Project[]>> => {
    return await get<Project[]>('/v1/projects');
  },

  /**
   * Get a specific project by ID
   *
   * @param id - Project ID
   * @returns Project details
   */
  getProject: async (id: string): Promise<ApiResponse<Project>> => {
    return await get<Project>(`/v1/projects/${id}`);
  },

  /**
   * Create a new project
   *
   * @param data - Project data including name, description, and team_id
   * @returns Newly created project
   */
  createProject: async (data: {
    name: string;
    description?: string;
    team_id: string;
  }): Promise<ApiResponse<Project>> => {
    return await post<Project>('/v1/projects', { body: data });
  },

  /**
   * List all teams in an organization
   *
   * @param organizationId - Organization ID
   * @returns Array of teams
   */
  listTeams: async (organizationId: string): Promise<ApiResponse<Team[]>> => {
    return await get<Team[]>(`/v1/organizations/${organizationId}/teams`);
  },

  /**
   * List all datasources for a project
   *
   * @param projectId - Project ID
   * @returns Array of datasources
   */
  listDatasources: async (
    projectId: string,
  ): Promise<ApiResponse<Datasource[]>> => {
    return await get<Datasource[]>(`/v1/projects/${projectId}/datasources`);
  },

  /**
   * Get a specific datasource by ID
   *
   * @param datasourceId - Datasource ID
   * @returns Datasource details
   */
  getDatasource: async (
    datasourceId: string,
  ): Promise<ApiResponse<Datasource>> => {
    return await get<Datasource>(`/v1/datasources/${datasourceId}`);
  },

  /**
   * Create a new datasource in a project
   *
   * @param projectId - Project ID
   * @param data - Datasource data including name and type
   * @returns Newly created datasource
   */
  createDatasource: async (
    projectId: string,
    data: {
      name: string;
      type: string;
      uri?: string;
    },
  ): Promise<ApiResponse<any>> => {
    return await post<any>(`/v1/projects/${projectId}/datasources`, {
      body: data,
    });
  },

  /**
   * List all query programs for a project
   *
   * @param projectId - Project ID
   * @returns Array of query programs
   */
  listQueryPrograms: async (
    projectId: string,
  ): Promise<ApiResponse<QueryProgram[]>> => {
    return await get<QueryProgram[]>(`/v1/projects/${projectId}/queryprograms`);
  },

  /**
   * Execute a query program using the provided ID and input data
   *
   * @param queryProgramId - Query program ID to execute
   * @param inputData - Optional input data for the query program
   * @returns Query execution results
   */
  executeQueryProgram: async (
    queryProgramId: string,
    inputData?: Record<string, any>,
  ): Promise<ApiResponse<any>> => {
    return await post<any>(`/v1/queryprograms/${queryProgramId}/execute`, {
      body: { ...inputData },
    });
  },
};
