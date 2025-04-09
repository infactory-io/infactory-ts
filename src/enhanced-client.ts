/**
 * Enhanced client for the Infactory platform that provides a more user-friendly API design
 * with convenience methods, method chaining, and fluent interfaces.
 */

import { InfactoryClient, InfactoryClientOptions } from './client.js';
import { jobsApi, SubmitJobParams } from './api/jobs.js';
import { JobStatus } from './api/resources/jobs.js';
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
   * Helper method to wait for job completion with improved polling mechanism
   * @param jobId ID of the job to wait for
   * @param timeout Timeout in seconds (for backward compatibility)
   * @param pollInterval Initial polling interval in seconds (for backward compatibility)
   * @returns A tuple with [success: boolean, status: string] for backward compatibility
   */
  async waitForJobCompletion(
    jobId: string,
    timeout?: number,
    pollInterval?: number,
  ): Promise<[boolean, string]>;

  /**
   * Helper method to wait for job completion with improved polling mechanism (new API)
   * @param jobId ID of the job to wait for
   * @param options Polling options including timeout, abort signal, and polling intervals
   * @returns JobStatus object containing the job status and metadata
   * @throws PollingTimeoutError when timeout is reached
   * @throws PollingCancelledError when operation is cancelled
   * @throws ServerError for API errors
   */
  async waitForJobCompletion(
    jobId: string,
    timeoutOrOptions?:
      | number
      | {
          timeout?: number;
          abortSignal?: AbortSignal;
          initialPollInterval?: number;
          maxPollInterval?: number;
          backoffMultiplier?: number;
        },
    pollInterval?: number,
  ): Promise<[boolean, string] | JobStatus> {
    // Import polling utilities
    const { poll, PollingTimeoutError, PollingCancelledError } = await import(
      './utils/polling.js'
    );

    // Handle legacy vs. new API call pattern
    const isLegacyCall =
      typeof timeoutOrOptions === 'number' || timeoutOrOptions === undefined;
    const options = isLegacyCall
      ? {
          timeout: timeoutOrOptions,
          initialPollInterval: pollInterval,
        }
      : (timeoutOrOptions as object);

    try {
      // Execute the polling operation
      const result = await poll<JobStatus>(
        async () => {
          const response = await jobsApi.getJobStatus({ jobId: jobId });

          if (response.error) {
            throw response.error;
          }

          if (!response.data) {
            throw new Error('No job data found');
          }

          return response.data as JobStatus;
        },
        {
          ...options,
          endCondition: (status) => {
            return ['completed', 'failed', 'error', 'terminated'].includes(
              status.status,
            );
          },
        },
      );

      // Return appropriate format based on API call pattern
      if (isLegacyCall) {
        const isSuccessful = result.status === 'completed';
        return [isSuccessful, result.status];
      }

      return result;
    } catch (error) {
      if (isLegacyCall) {
        // Return legacy format for legacy calls
        if (error instanceof PollingTimeoutError) {
          return [false, 'timeout'];
        } else if (error instanceof PollingCancelledError) {
          return [false, 'cancelled'];
        } else if (error instanceof Error) {
          return [false, error.message];
        }
        return [false, String(error)];
      }

      // For new API, propagate the error
      throw error;
    }
  }
}
