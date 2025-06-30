import { InfactoryClient } from '../../src/client.js';
import { randomBytes } from 'crypto';
import {
  Organization,
  Team,
  User,
  TeamMembershipRole,
} from '../../src/types/common.js';

interface E2EEnvironment {
  client: InfactoryClient;
  user: User;
  organization: Organization;
  team: Team;
  uniqueId: string;
}

export async function setupE2EEnvironment(): Promise<E2EEnvironment> {
  const uniqueId = randomBytes(4).toString('hex');
  const orgName = `Test Organization ${uniqueId}`;
  const teamName = `Test Team ${uniqueId}`;

  const apiKey = process.env.NF_API_KEY;
  const baseUrl = process.env.NF_BASE_URL;

  if (!apiKey) {
    throw new Error('NF_API_KEY environment variable is not set.');
  }
  if (!baseUrl) {
    throw new Error('NF_BASE_URL environment variable is not set.');
  }

  const client = new InfactoryClient({
    apiKey,
    baseURL: baseUrl,
    isServer: true,
  });

  const userResponse = await client.users.getCurrentUser();
  if (userResponse.error) {
    throw userResponse.error;
  }
  const user = userResponse.data!;

  let organization: Organization | null = null;
  let team: Team | null = null;

  let teamFetchSucceeded = false;
  let teamsResponse;
  try {
    teamsResponse = await client.users.getTeamsWithOrganizationsAndProjects({
      userId: user.id,
    });
    teamFetchSucceeded = !teamsResponse.error;
  } catch (err) {
    console.info(
      'ℹ️ Falling back to creating org/team – teams endpoint not available:',
      err,
    );
    teamFetchSucceeded = false;
  }

  if (
    teamsResponse &&
    teamFetchSucceeded &&
    teamsResponse?.data?.teams?.length > 0
  ) {
    team = teamsResponse.data.teams[0];
    if (!team) {
      throw new Error('Team was not found');
    }
    const orgResponse = await client.organizations.get(team.organizationId);
    if (orgResponse.error) {
      throw orgResponse.error;
    }
    organization = orgResponse.data!;
  } else {
    // either fetch failed or returned zero teams
    const createOrgResponse = await client.organizations.create({
      name: orgName,
      description: 'Created during e2e onboarding test',
      clerkOrgId: `clerk_org_${uniqueId}`,
    });
    if (createOrgResponse.error) {
      throw createOrgResponse.error;
    }
    organization = createOrgResponse.data!;

    const createTeamResponse = await client.teams.createTeam({
      name: teamName,
      organizationId: organization.id,
    });
    if (createTeamResponse.error) {
      throw createTeamResponse.error;
    }
    team = createTeamResponse.data!;

    try {
      await client.teams.createTeamMembership(
        team.id,
        user.id,
        TeamMembershipRole.ADMIN,
      );
    } catch (e) {
      console.info(
        'ℹ️ User might already be a member of the team or error adding:',
        e,
      );
    }
  }

  if (!organization || !team) {
    throw new Error('Organization or Team was not set up correctly');
  }

  return { client, user, organization, team, uniqueId };
}

export async function cleanupE2EEnvironment(
  client: InfactoryClient,
  organizationId?: string,
  teamId?: string,
  projectId?: string,
) {
  if (!client) return;

  try {
    if (projectId) {
      console.info(`🧹 Cleaning up project: ${projectId}`);
      await client.projects.deleteProject(projectId, true);
    }

    if (teamId) {
      console.info(`🧹 Cleaning up team: ${teamId}`);
      await client.teams.deleteTeam(teamId);
    }

    if (organizationId) {
      console.info(`🧹 Cleaning up organization: ${organizationId}`);
      await client.organizations.delete(organizationId);
    }
    console.info('🧹 Cleanup completed');
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}
