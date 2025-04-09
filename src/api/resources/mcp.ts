/**
 * Management Control Plane (MCP) API Resource
 *
 * This resource provides methods for interacting with the Infactory MCP API.
 */
import type {
  User,
  Project,
  Team,
  Datasource,
  QueryProgram,
} from '@/types/common.js';
import { sharedClient, type ApiResponse } from '@/core/shared-client.js';

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
    return await sharedClient.get<User>('/v1/users/me');
  },

  /**
   * List all projects the user has access to
   *
   * @returns Array of projects
   */
  listProjects: async (): Promise<ApiResponse<Project[]>> => {
    return await sharedClient.get<Project[]>('/v1/projects');
  },

  /**
   * Get a specific project by ID
   *
   * @param id - Project ID
   * @returns Project details
   */
  getProject: async (id: string): Promise<ApiResponse<Project>> => {
    return await sharedClient.get<Project>(`/v1/projects/${id}`);
  },

  /**
   * Create a new project
   *
   * @param data - Project data including name, description, and teamId
   * @returns Newly created project
   */
  createProject: async (data: {
    name: string;
    description?: string;
    teamId: string;
  }): Promise<ApiResponse<Project>> => {
    return await sharedClient.post<Project>('/v1/projects', data);
  },

  /**
   * List all teams in an organization
   *
   * @param organizationId - Organization ID
   * @returns Array of teams
   */
  listTeams: async (organizationId: string): Promise<ApiResponse<Team[]>> => {
    return await sharedClient.get<Team[]>(
      `/v1/organizations/${organizationId}/teams`,
    );
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
    return await sharedClient.get<Datasource[]>(
      `/v1/projects/${projectId}/datasources`,
    );
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
    return await sharedClient.get<Datasource>(
      `/v1/datasources/${datasourceId}`,
    );
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
    return await sharedClient.post<any>(
      `/v1/projects/${projectId}/datasources`,
      data,
    );
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
    return await sharedClient.get<QueryProgram[]>(
      `/v1/projects/${projectId}/queryprograms`,
    );
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
    return await sharedClient.post<any>(
      `/v1/queryprograms/${queryProgramId}/execute`,
      inputData || {},
    );
  },
};
