import { InfactoryClient } from '../src/client.js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get API key from environment variables
const apiKey = process.env.NF_API_KEY;
if (!apiKey) {
  console.error('Error: NF_API_KEY environment variable is not set');
  process.exit(1);
}

// Create a new instance of the InfactoryClient
const client = new InfactoryClient({
  apiKey: apiKey,
  baseURL: process.env.NF_BASE_URL || 'https://api.infactory.ai',
});

/**
 * Example function demonstrating how to use the TeamsClient
 */
async function teamsExample() {
  try {
    console.info('=== Teams API Example ===');

    // First, get a list of organizations to work with
    console.info('\n1. Fetching organizations:');
    const organizationsResponse = await client.organizations.list();
    if (organizationsResponse.error) {
      console.error(
        'Error fetching organizations:',
        organizationsResponse.error,
      );
      return;
    }

    if (
      !organizationsResponse.data ||
      organizationsResponse.data.length === 0
    ) {
      console.error(
        'No organizations found. Please create an organization first.',
      );
      return;
    }

    // Use the first organization for this example
    const organization = organizationsResponse.data[0];
    console.info(
      `Using organization: ${organization.name} (ID: ${organization.id})`,
    );

    // List all teams for this organization
    console.info(`\n2. Listing teams for organization ${organization.id}:`);
    const teamsResponse = await client.teams.getTeams(organization.id);
    if (teamsResponse.error) {
      console.error('Error listing teams:', teamsResponse.error);
    } else {
      console.info(`Found ${teamsResponse.data?.length || 0} teams`);
      if (teamsResponse.data && teamsResponse.data.length > 0) {
        teamsResponse.data.forEach((team) => {
          console.info(`- ${team.name} (ID: ${team.id})`);
        });

        // Get details for the first team
        const firstTeam = teamsResponse.data[0];
        console.info(`\n3. Getting details for team ${firstTeam.id}:`);

        const teamResponse = await client.teams.getTeam(firstTeam.id);
        if (teamResponse.error) {
          console.error('Error getting team:', teamResponse.error);
        } else {
          console.info('Team details:');
          console.info(JSON.stringify(teamResponse.data, null, 2));

          // Get team memberships
          console.info(`\n4. Listing members of team ${firstTeam.id}:`);
          try {
            const membershipsResponse = await client.teams.getTeamMemberships(
              firstTeam.id,
            );
            if (membershipsResponse.error) {
              console.error(
                'Error getting team memberships:',
                membershipsResponse.error.message,
              );
            } else {
              console.info(
                `Found ${membershipsResponse.data?.length || 0} team members`,
              );
              if (
                membershipsResponse.data &&
                membershipsResponse.data.length > 0
              ) {
                membershipsResponse.data.forEach((membership) => {
                  console.info(
                    `- User ID: ${membership.userId}, Role: ${membership.role}`,
                  );
                });
              } else {
                console.info('No team members found');
              }
            }
          } catch (error) {
            console.error('Error getting team memberships:', error);
            console.error(
              'Details:',
              JSON.stringify((error as any).details ?? error, null, 2),
            );
          }
        }
      } else {
        console.info('No teams found for this organization');
      }
    }

    // Create a new team example (commented out to prevent accidental creation)
    /*
    console.info(`\n5. Creating a new team in organization ${organization.id}:`);
    const createResponse = await client.teams.createTeam({
      name: 'Example Team',
      organizationId: organization.id
    });
    
    if (createResponse.error) {
      console.error('Error creating team:', createResponse.error);
    } else {
      console.info('Team created:');
      console.info(JSON.stringify(createResponse.data, null, 2));
      
      const teamId = createResponse.data.id;
      
      // Update the created team
      console.info(`\n6. Updating team ${teamId}:`);
      
      const updateResponse = await client.teams.updateTeam(teamId, {
        name: 'Updated Example Team'
      });
      
      if (updateResponse.error) {
        console.error('Error updating team:', updateResponse.error);
      } else {
        console.info('Team updated:');
        console.info(JSON.stringify(updateResponse.data, null, 2));
      }
      
      // Add a user to the team (you'd need a valid user ID)
      // console.info(`\n7. Adding a user to team ${teamId}:`);
      // const userId = 'some-valid-user-id';
      // const addMemberResponse = await client.teams.createTeamMembership(
      //   teamId,
      //   userId,
      //   TeamMembershipRole.MEMBER
      // );
      
      // Delete the created team
      console.info(`\n8. Deleting team ${teamId}:`);
      
      const deleteResponse = await client.teams.deleteTeam(teamId);
      if (deleteResponse.error) {
        console.error('Error deleting team:', deleteResponse.error);
      } else {
        console.info('Team deleted successfully');
      }
    }
    */

    // Example of team client-side validation
    console.info('\n9. Client-side validation:');
    try {
      // Creating a team with an empty name should fail
      await client.teams.createTeam({
        name: '',
        organizationId: organization.id,
      });
    } catch (validationError) {
      console.info(
        'Validation caught invalid parameters:',
        (validationError as Error).message,
      );
    }

    try {
      // Creating a team without an organization ID should fail
      await client.teams.createTeam({
        name: 'Valid Team Name',
        organizationId: '',
      });
    } catch (validationError) {
      console.info(
        'Validation caught missing organization ID:',
        (validationError as Error).message,
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the example
teamsExample()
  .then(() => console.info('\nTeams example completed'))
  .catch((error) => console.error('Fatal error:', error));
