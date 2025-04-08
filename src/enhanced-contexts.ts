/**
 * Context classes for the enhanced Infactory client
 * Provides fluent interfaces for different entity types
 */

import { InfactoryClient } from './client.js';
import {
  Project,
  CreateProjectParams,
  Team,
  CreateTeamParams,
  Organization,
  // CreateOrganizationParams not used directly in this file
  Datasource,
  CreateDatasourceParams,
  QueryProgram,
  CreateQueryProgramParams,
  // User not used directly in this file
  API,
  APIEndpoint,
  ApiResponse,
  QueryResponse,
} from './types/common.js';
import {
  isReadableStream,
  processStreamToApiResponse,
} from './utils/stream.js';
import { ServerError } from './errors/index.js';

/**
 * Fluent interface for working with projects
 */
export class ProjectContext {
  constructor(
    private readonly client: InfactoryClient,
    private readonly projectId: string,
  ) {}

  /**
   * Gets the current project details
   */
  async get(): Promise<ApiResponse<Project>> {
    try {
      return await this.client.projects.getProject(this.projectId);
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? new ServerError(error.message)
            : new ServerError(String(error)),
      };
    }
  }

  /**
   * Updates the current project
   */
  async update(
    params: Partial<CreateProjectParams>,
  ): Promise<ApiResponse<Project>> {
    try {
      return await this.client.projects.updateProject(this.projectId, params);
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? new ServerError(error.message)
            : new ServerError(String(error)),
      };
    }
  }

  /**
   * Deletes the current project
   */
  async delete(): Promise<ApiResponse<void>> {
    try {
      return await this.client.projects.deleteProject(this.projectId);
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? new ServerError(error.message)
            : new ServerError(String(error)),
      };
    }
  }

  /**
   * Exports the current project
   */
  async export(teamId: string): Promise<ApiResponse<any>> {
    try {
      return await this.client.projects.exportProject(this.projectId, teamId);
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? new ServerError(error.message)
            : new ServerError(String(error)),
      };
    }
  }

  /**
   * Creates a datasource in the current project
   */
  async createDatasource(
    params: CreateDatasourceParams,
  ): Promise<ApiResponse<Datasource>> {
    try {
      return await this.client.datasources.createDatasource({
        ...params,
        project_id: this.projectId,
      });
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? new ServerError(error.message)
            : new ServerError(String(error)),
      };
    }
  }

  /**
   * Gets all datasources for the current project
   */
  async getDatasources(): Promise<ApiResponse<Datasource[]>> {
    try {
      return await this.client.datasources.getProjectDatasources(
        this.projectId,
      );
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? new ServerError(error.message)
            : new ServerError(String(error)),
      };
    }
  }

  /**
   * Creates a fluent interface for working with a specific datasource
   */
  datasource(datasourceId: string): DatasourceContext {
    return new DatasourceContext(this.client, this.projectId, datasourceId);
  }

  /**
   * Creates a new query program in this project
   */
  async createQueryProgram(
    params: CreateQueryProgramParams,
  ): Promise<ApiResponse<QueryProgram>> {
    try {
      return await this.client.queryprograms.createQueryProgram({
        ...params,
        project_id: this.projectId,
      });
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? new ServerError(error.message)
            : new ServerError(String(error)),
      };
    }
  }

  /**
   * Gets all query programs for this project
   */
  async getQueryPrograms(): Promise<ApiResponse<QueryProgram[]>> {
    try {
      return await this.client.queryprograms.listQueryPrograms({
        project_id: this.projectId,
      });
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? new ServerError(error.message)
            : new ServerError(String(error)),
      };
    }
  }

  /**
   * Gets all APIs for this project
   */
  async getApis(): Promise<ApiResponse<API[]>> {
    try {
      return await this.client.apis.getProjectApis(this.projectId);
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? new ServerError(error.message)
            : new ServerError(String(error)),
      };
    }
  }

  /**
   * Creates an API for this project
   */
  async createApi(params: any): Promise<ApiResponse<API>> {
    try {
      return await this.client.apis.createApi({
        ...params,
        project_id: this.projectId,
      });
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? new ServerError(error.message)
            : new ServerError(String(error)),
      };
    }
  }

  /**
   * Creates a fluent interface for working with a specific API
   */
  api(apiId: string): ApiContext {
    return new ApiContext(this.client, apiId);
  }

  /**
   * Helper method to upload a CSV file as a datasource
   * @param filePath - Path to the CSV file to upload
   * @param name - Optional name for the datasource (defaults to file name + timestamp)
   */
  async uploadCSV(
    filePath: string,
    name?: string,
  ): Promise<ApiResponse<Datasource>> {
    try {
      const result = await this.client.datasources.uploadCsvFile(
        this.projectId,
        filePath,
        name,
      );

      return {
        data: result.datasource,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? new ServerError(error.message)
            : new ServerError(String(error)),
      };
    }
  }

  /**
   * Helper method to generate common query programs based on the project data
   */
  async generateQueries(): Promise<ApiResponse<QueryProgram[]>> {
    try {
      // This would be a higher-level method that might analyze datasources
      // and generate appropriate queries automatically
      // For now, it's a placeholder that returns all existing queries
      return await this.getQueryPrograms();
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? new ServerError(error.message)
            : new ServerError(String(error)),
      };
    }
  }

  /**
   * Helper method to wait for datalines to be created
   */
  async waitForDatalines(timeout = 300, pollInterval = 5): Promise<any[]> {
    const startTime = Date.now();
    const maxTime = startTime + timeout * 1000;

    while (Date.now() < maxTime) {
      const response = await this.client.datalines.getProjectDatalines(
        this.projectId,
      );

      if (response.error) {
        throw response.error;
      }

      if (response.data && response.data.length > 0) {
        return response.data;
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
    }

    throw new Error(`Timeout waiting for datalines after ${timeout} seconds`);
  }

  /**
   * Helper method to wait for query programs to be created
   */
  async waitForQueryPrograms(
    minCount = 1,
    timeout = 300,
    pollInterval = 5,
  ): Promise<QueryProgram[]> {
    const startTime = Date.now();
    const maxTime = startTime + timeout * 1000;

    while (Date.now() < maxTime) {
      const response = await this.getQueryPrograms();

      if (response.error) {
        throw response.error;
      }

      if (response.data && response.data.length >= minCount) {
        return response.data;
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
    }

    throw new Error(
      `Timeout waiting for at least ${minCount} query programs after ${timeout} seconds`,
    );
  }
}

/**
 * Fluent interface for working with organizations
 */
export class OrganizationContext {
  constructor(
    private readonly client: InfactoryClient,
    private readonly organizationId: string,
  ) {}

  /**
   * Gets the current organization details
   */
  async get(): Promise<ApiResponse<Organization>> {
    return await this.client.organizations.getOrganization(this.organizationId);
  }

  /**
   * Gets all teams for the current organization
   */
  async getTeams(): Promise<ApiResponse<Team[]>> {
    return this.client.teams.getTeams(this.organizationId);
  }

  /**
   * Creates a team in the current organization
   */
  async createTeam(
    params: Omit<CreateTeamParams, 'organization_id'>,
  ): Promise<ApiResponse<Team>> {
    return this.client.teams.createTeam({
      ...params,
      organization_id: this.organizationId,
    });
  }

  /**
   * Creates a fluent interface for working with a specific team
   */
  team(teamId: string): TeamContext {
    return new TeamContext(this.client, teamId, this.organizationId);
  }
}

/**
 * Fluent interface for working with teams
 */
export class TeamContext {
  constructor(
    private readonly client: InfactoryClient,
    private readonly teamId: string,

    // This parameter is kept for API consistency even though it's not directly used in this class
    _organizationId?: string,
  ) {}

  /**
   * Gets the current team details
   */
  async get(): Promise<ApiResponse<Team>> {
    return this.client.teams.getTeam(this.teamId);
  }

  /**
   * Creates a project in the current team
   */
  async createProject(
    params: Omit<CreateProjectParams, 'team_id'>,
  ): Promise<ApiResponse<Project>> {
    return this.client.projects.createProject({
      ...params,
      team_id: this.teamId,
    });
  }

  /**
   * Gets all projects for the current team
   */
  async getProjects(): Promise<ApiResponse<Project[]>> {
    return this.client.projects.getTeamProjects(this.teamId);
  }
}

/**
 * Fluent interface for working with datasources
 */
export class DatasourceContext {
  constructor(
    private readonly client: InfactoryClient,
    private readonly projectId: string,
    private readonly datasourceId: string,
  ) {}

  /**
   * Gets the current datasource details
   */
  async get(): Promise<ApiResponse<Datasource>> {
    return this.client.datasources.getDatasource(this.datasourceId);
  }

  /**
   * Updates the current datasource
   */
  async update(
    params: Partial<CreateDatasourceParams>,
  ): Promise<ApiResponse<Datasource>> {
    return this.client.datasources.updateDatasource(this.datasourceId, params);
  }

  /**
   * Deletes the current datasource
   */
  async delete(): Promise<ApiResponse<void>> {
    return this.client.datasources.deleteDatasource(this.datasourceId);
  }

  /**
   * Uploads a CSV file to the current datasource
   * @param filePath - Path to the CSV file to upload
   */
  async uploadFile(filePath: string): Promise<ApiResponse<Datasource>> {
    try {
      // Since our datasource already exists, we'll use uploadCsvFile with the existing ID
      // Note: This may need adjustment based on the actual implementation design
      const result = await this.client.datasources.uploadCsvFile(
        this.projectId,
        filePath,
        `${this.datasourceId} Update`,
      );

      return {
        data: result.datasource,
      };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? new ServerError(error.message)
            : new ServerError(String(error)),
      };
    }
  }

  /**
   * Creates a new query program using this datasource
   */
  createQueryProgram(): QueryProgramBuilder {
    return new QueryProgramBuilder(
      this.client,
      this.projectId,
      this.datasourceId,
    );
  }

  /**
   * Helper method to wait for job completion
   */
  async waitForJobCompletion(
    jobId: string,
    timeout = 300,
    pollInterval = 2,
  ): Promise<[boolean, string]> {
    const startTime = Date.now();
    const maxTime = startTime + timeout * 1000;

    while (Date.now() < maxTime) {
      const response = await this.client.jobs.getJob(jobId);

      if (response.error) {
        return [false, response.error.message];
      }

      if (!response.data) {
        return [false, 'No job data found'];
      }

      const status = response.data.status;

      if (status === 'completed') {
        return [true, 'completed'];
      }

      if (status === 'failed' || status === 'error') {
        return [false, status];
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
    }

    return [false, 'timeout'];
  }
}

/**
 * Fluent interface for working with APIs
 */
export class ApiContext {
  constructor(
    private readonly client: InfactoryClient,
    private readonly apiId: string,
  ) {}

  /**
   * Gets the current API details
   */
  async get(): Promise<ApiResponse<API>> {
    return this.client.apis.getApi(this.apiId);
  }

  /**
   * Gets all endpoints for the current API
   */
  async getEndpoints(): Promise<ApiResponse<APIEndpoint[]>> {
    return this.client.apis.getApiEndpoints(this.apiId);
  }

  /**
   * Creates an endpoint for the current API
   */
  async createEndpoint(params: any): Promise<ApiResponse<APIEndpoint>> {
    return this.client.apis.createApiEndpoint({
      ...params,
      api_id: this.apiId,
    });
  }
}

/**
 * Fluent builder for query programs
 */
export class QueryProgramBuilder {
  // Using question for user-friendly API but mapping to query internally
  private question?: string;
  private name?: string;

  constructor(
    private readonly client: InfactoryClient,
    private readonly projectId: string,
    private readonly datasourceId: string,
  ) {}

  /**
   * Sets the question for the query program
   */
  withQuestion(question: string): QueryProgramBuilder {
    this.question = question;
    return this;
  }

  /**
   * Sets the name for the query program
   */
  withName(name: string): QueryProgramBuilder {
    this.name = name;
    return this;
  }

  /**
   * Sets the description for the query program (for display purposes only)
   * Note: Not used in the actual query creation since the API doesn't support it directly
   */
  withDescription(_description: string): QueryProgramBuilder {
    // We'll keep the method for API compatibility but not use the parameter
    return this;
  }

  /**
   * Creates and executes the query program
   */
  async execute(): Promise<ApiResponse<QueryResponse>> {
    try {
      if (!this.question) {
        return {
          error: new ServerError(
            'Question is required for creating a query program',
          ),
        };
      }

      // Create the query program - map question to query for the API
      // Note: We need to add the datasource as a custom parameter
      // since it's not directly in the CreateQueryProgramParams interface
      const createResponse = await this.client.queryprograms.createQueryProgram(
        {
          project_id: this.projectId,
          name: this.name || `Query: ${this.question.substring(0, 30)}...`,
          query: this.question, // Use query field instead of question to match the API
          datasource_ids: [this.datasourceId], // Add the datasource ID to the API call
        } as CreateQueryProgramParams & { datasource_ids: string[] },
      );

      if (createResponse.error) {
        return createResponse as unknown as ApiResponse<QueryResponse>;
      }

      // Execute the query program and convert stream response to ApiResponse if needed
      const response = await this.client.queryprograms.executeQueryProgram(
        createResponse.data!.id,
      );

      // Process the response if it's a stream
      if (isReadableStream(response)) {
        return await processStreamToApiResponse<QueryResponse>(response);
      }

      // Otherwise, it's already an ApiResponse
      return response;
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? new ServerError(error.message)
            : new ServerError(String(error)),
      };
    }
  }

  /**
   * Creates, executes, and publishes the query program
   */
  async executeAndPublish(): Promise<ApiResponse<QueryResponse>> {
    try {
      const executeResponse = await this.execute();

      if (executeResponse.error) {
        return executeResponse;
      }

      // Get the query program ID from the executed response
      // This might need adjustment based on the actual response structure
      const queryProgramId = executeResponse.data?.metadata?.query_program_id;

      if (!queryProgramId) {
        return {
          error: new ServerError(
            'Could not determine query program ID from execution response',
          ),
        };
      }

      // Publish the query program
      await this.client.queryprograms.publishQueryProgram(queryProgramId);

      return executeResponse;
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? new ServerError(error.message)
            : new ServerError(String(error)),
      };
    }
  }
}
