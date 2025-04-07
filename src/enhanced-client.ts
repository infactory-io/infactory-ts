/**
 * Enhanced client for the Infactory platform that provides a more user-friendly API design
 * with convenience methods, method chaining, and fluent interfaces.
 */

import { InfactoryClient, InfactoryClientOptions } from './client.js';
import { jobsApi, SubmitJobParams } from './api/jobs.js';
import { Project, Organization, User } from './types/common.js';

import {
  ProjectContext,
  TeamContext,
  OrganizationContext,
} from './enhanced-contexts.js';

/**
 * Enhanced Infactory client with improved API design
 */
export class EnhancedInfactoryClient extends InfactoryClient {
  constructor(options: InfactoryClientOptions) {
    super(options);
  }

  /**
   * Gets the current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await this.users.getCurrentUser();

    if (response.error) {
      throw response.error;
    }

    return response.data!;
  }

  /**
   * Gets all organizations accessible to the current user
   */
  async getOrganizations(): Promise<Organization[]> {
    const response = await this.organizations.getOrganizations();

    if (response.error) {
      throw response.error;
    }

    return response.data!;
  }

  /**
   * Gets an organization by ID with a fluent interface
   */
  organization(organizationId: string): OrganizationContext {
    return new OrganizationContext(this, organizationId);
  }

  /**
   * Gets a team by ID with a fluent interface
   */
  team(teamId: string): TeamContext {
    return new TeamContext(this, teamId);
  }

  /**
   * Creates a new project with a fluent interface
   */
  async createProject(params: any): Promise<ProjectContext> {
    const response = await this.projects.createProject(params);

    if (response.error) {
      throw response.error;
    }

    return this.project(response.data!.id);
  }

  /**
   * Gets a project by ID with a fluent interface
   */
  project(projectId: string): ProjectContext {
    return new ProjectContext(this, projectId);
  }

  /**
   * Enhanced method to get all projects with automatic pagination and filtering
   */
  async getAllProjects(teamId?: string): Promise<Project[]> {
    const response = teamId
      ? await this.projects.getTeamProjects(teamId)
      : await this.projects.getProjects();

    if (response.error) {
      throw response.error;
    }

    return response.data!;
  }

  /**
   * Creates a project and automatically uploads a CSV datasource in one operation
   * @param projectParams - Parameters for project creation
   * @param csvFilePath - Path to the CSV file to upload
   * @param datasourceName - Optional name for the datasource
   */
  async createProjectWithCSV(
    projectParams: any,
    csvFilePath: string,
    datasourceName?: string,
  ): Promise<ProjectContext> {
    // Create the project
    const projectContext = await this.createProject(projectParams);

    // Upload the CSV
    await projectContext.uploadCSV(csvFilePath, datasourceName);

    return projectContext;
  }

  /**
   * Creates a fluent interface for submitting jobs
   */
  async submitJob(params: SubmitJobParams): Promise<string> {
    // Use the proper jobs API
    const response = await jobsApi.submitJob(params);

    if (response.error) {
      throw response.error;
    }

    return response.data || '';
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
      const response = await jobsApi.getJobStatus({ job_id: jobId });

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
