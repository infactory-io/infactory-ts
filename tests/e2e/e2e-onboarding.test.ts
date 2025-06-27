import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { InfactoryClient } from '../../src/client.js';
import { randomBytes } from 'crypto';
import {
  Organization,
  Team,
  Project,
  User,
  TeamMembershipRole,
} from '../../src/types/common.js';

/**
 * E2E Tests for the onboarding flow
 *
 * This test simulates the onboarding experience for new users:
 * 1. Authentication (represented by initializing client with API key)
 * 2. Organization and team checking/creation
 * 3. Initial project checking/creation
 */
describe('E2E Tests: User Onboarding Flow', () => {
  let client: InfactoryClient;
  let user: User;
  let organization: Organization | null = null;
  let team: Team | null = null;
  let project: Project | null = null;

  // Generate unique identifiers for test resources
  const uniqueId = randomBytes(4).toString('hex');
  const orgName = `Test Organization ${uniqueId}`;
  const teamName = `Test Team ${uniqueId}`;
  const projectName = `Default Project ${uniqueId}`;

  // Setup: Initialize client and authenticate
  beforeAll(async () => {
    // Step 1: Authenticate (represented by creating client with API key)
    console.info('⏳ Step 1: Authenticating user...');
    const apiKey = process.env.NF_API_KEY;
    const baseUrl = process.env.NF_BASE_URL;

    if (!apiKey) {
      throw new Error('NF_API_KEY environment variable is not set.');
    }
    if (!baseUrl) {
      throw new Error('NF_BASE_URL environment variable is not set.');
    }

    // Create client with server mode enabled for e2e tests
    client = new InfactoryClient({
      apiKey,
      baseURL: baseUrl,
      isServer: true,
    });
    console.info('✅ Authentication successful');
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

  it('should fetch the current user (authenticated redirect)', async () => {
    // Step 2: After authentication, fetch the current user
    console.info('⏳ Step 2: Fetching authenticated user details...');
    const userResponse = await client.users.getCurrentUser();

    expect(userResponse.error).toBeUndefined();
    expect(userResponse.data).toBeDefined();

    user = userResponse.data!;
    console.info(`✅ Retrieved user: ${user.email} (${user.id})`);
  }, 30000);

  it('should check for existing organizations and teams', async () => {
    // Step 3: Check if the user belongs to any organization and team
    console.info('⏳ Step 3: Checking for existing organizations and teams...');

    // Get teams with organizations and projects for the current user
    const teamsResponse =
      await client.users.getTeamsWithOrganizationsAndProjects({
        userId: user.id,
      });

    expect(teamsResponse.error).toBeUndefined();
    expect(teamsResponse.data).toBeDefined();

    // If teams exist, use the first one
    if (teamsResponse.data?.teams && teamsResponse.data.teams.length > 0) {
      team = teamsResponse.data.teams[0];
      if (!team) {
        throw new Error('Team must be defined before checking projects');
      }
      console.info(`✅ Found existing team: ${team.name} (${team.id})`);

      // Get the organization for this team
      const orgResponse = await client.organizations.get(team.organizationId);

      expect(orgResponse.error).toBeUndefined();
      expect(orgResponse.data).toBeDefined();

      organization = orgResponse.data!;
      console.info(
        `✅ Using organization: ${organization.name} (${organization.id})`,
      );
    } else {
      console.info('ℹ️ No existing teams found');
    }
  }, 30000);

  it('should create organization and team if none exists', async () => {
    // Step 4 & 5: If no org/team exists, create them
    if (!organization || !team) {
      console.info('⏳ Step 4 & 5: Creating new organization and team...');

      // Create organization (simulating Clerk createOrganization)
      const createOrgResponse = await client.organizations.create({
        name: orgName,
        description: 'Created during e2e onboarding test',
        // In a real frontend, this would be set from Clerk
        clerkOrgId: `clerk_org_${uniqueId}`,
      });

      expect(createOrgResponse.error).toBeUndefined();
      expect(createOrgResponse.data).toBeDefined();

      organization = createOrgResponse.data!;
      console.info(
        `✅ Created organization: ${organization.name} (${organization.id})`,
      );

      // Create team for the organization
      const createTeamResponse = await client.teams.createTeam({
        name: teamName,
        organizationId: organization.id,
      });

      expect(createTeamResponse.error).toBeUndefined();
      expect(createTeamResponse.data).toBeDefined();

      team = createTeamResponse.data!;
      console.info(`✅ Created team: ${team.name} (${team.id})`);

      // Add the current user to the team (if not automatically added)
      try {
        const membershipResponse = await client.teams.createTeamMembership(
          team.id,
          user.id,
          TeamMembershipRole.ADMIN,
        );

        if (!membershipResponse.error) {
          console.info(`✅ Added user to team with role: ADMIN`);
        }
      } catch {
        console.info('ℹ️ User might already be a member of the team');
      }
    } else {
      console.info('ℹ️ Using existing organization and team');
    }

    // Verify organization and team exist
    expect(organization).toBeDefined();
    expect(team).toBeDefined();
  }, 30000);

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
        `✅ Found existing project: ${project.name} (${project.id})`,
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
        `✅ Created default project: ${project.name} (${project.id})`,
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
