import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Project } from '../../src/types/common.js';
import { setupE2EEnvironment, cleanupE2EEnvironment } from './e2e-setup.js';

/**
 * E2E Tests for the onboarding flow
 *
 * This test simulates the onboarding experience for new users:
 * 1. Authentication (represented by initializing client with API key)
 * 2. Organization and team checking/creation
 * 3. Initial project checking/creation
 */
describe('E2E Tests: User Onboarding Flow', () => {
  let client: any; // Use any for now to avoid type issues with partial setup
  let user: any;
  let organization: any;
  let team: any;
  let project: Project | null = null;
  let uniqueId: string;
  let projectName: string;

  beforeAll(async () => {
    const env = await setupE2EEnvironment();
    client = env.client;
    user = env.user;
    organization = env.organization;
    team = env.team;
    uniqueId = env.uniqueId;
    projectName = `Default Project ${uniqueId}`;
  }, 60000);

  afterAll(async () => {
    await cleanupE2EEnvironment(
      client,
      organization?.id,
      team?.id,
      project?.id,
    );
  }, 60000);

  // Clean up resources created during tests
  afterAll(async () => {
    if (!client) return;

    try {
      // Clean up in reverse order: project -> team -> organization
      if (project?.id) {
        console.info(`🧹 Cleaning up project: ${project.name} (${project.id})`);
        await client.projects.deleteProject(project.id, true);
      }

      if (team?.id) {
        console.info(`🧹 Cleaning up team: ${team.name} (${team.id})`);
        await client.teams.deleteTeam(team.id);
      }

      if (organization?.id) {
        console.info(
          `🧹 Cleaning up organization: ${organization.name} (${organization.id})`,
        );
        await client.organizations.delete(organization.id);
      }

      console.info('🧹 Cleanup completed');
    } catch (error) {
      console.error('Error during cleanup:', error);
      // Don't fail the test suite on cleanup errors
    }
  }, 60000);

  it('should check for existing projects in the team', async () => {
    // Step 6 & 7: Check if projects exist in the team
    console.info('⏳ Step 6 & 7: Checking for existing projects...');

    if (!team) {
      throw new Error('Team must be defined before checking projects');
    }

    const projectsResponse = await client.projects.getTeamProjects(team.id);

    expect(projectsResponse.error).toBeUndefined();
    expect(projectsResponse.data).toBeDefined();

    if (projectsResponse.data && projectsResponse.data.length > 0) {
      // If projects exist, use the first one
      project = projectsResponse.data[0];
      console.info(
        `✅ Found existing project: ${project?.name} (${project?.id})`,
      );
    } else {
      console.info('ℹ️ No existing projects found in team');
    }
  }, 30000);

  it('should create a default project if none exists', async () => {
    // Step 8: Create default project if none exists
    if (!project) {
      console.info('⏳ Step 8: Creating default project...');

      if (!team) {
        throw new Error('Team must be defined before creating a project');
      }

      const createProjectResponse = await client.projects.createProject({
        name: projectName,
        description: 'Default project created during onboarding',
        teamId: team.id,
      });

      expect(createProjectResponse.error).toBeUndefined();
      expect(createProjectResponse.data).toBeDefined();

      project = createProjectResponse.data!;
      console.info(
        `✅ Created default project: ${project?.name} (${project?.id})`,
      );
    } else {
      console.info('ℹ️ Using existing project');
    }

    // Verify project exists
    expect(project).toBeDefined();
  }, 30000);

  it('should have completed the full onboarding flow successfully', () => {
    // Final verification that all resources exist
    expect(user).toBeDefined();
    expect(organization).toBeDefined();
    expect(organization?.id).toBeDefined();
    expect(team).toBeDefined();
    expect(team?.id).toBeDefined();
    expect(project).toBeDefined();
    expect(project?.id).toBeDefined();

    // Log the full onboarding path that was taken
    console.info('\n🎉 Onboarding flow completed successfully!');
    console.info('=======================================');
    console.info(`User: ${user.email} (${user.id})`);
    console.info(`Organization: ${organization?.name} (${organization?.id})`);
    console.info(`Team: ${team?.name} (${team?.id})`);
    console.info(`Project: ${project?.name} (${project?.id})`);
    console.info('=======================================');
  });
});
