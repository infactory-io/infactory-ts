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
    console.log('=== Teams API Example ===');

    // First, get a list of organizations to work with
    console.log('\n1. Fetching organizations:');
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
    console.log(
      `Using organization: ${organization.name} (ID: ${organization.id})`,
    );

    // List all teams for this organization
    console.log(`\n2. Listing teams for organization ${organization.id}:`);
    const teamsResponse = await client.teams.getTeams(organization.id);
    if (teamsResponse.error) {
      console.error('Error listing teams:', teamsResponse.error);
    } else {
      console.log(`Found ${teamsResponse.data?.length || 0} teams`);
      if (teamsResponse.data && teamsResponse.data.length > 0) {
        teamsResponse.data.forEach((team) => {
          console.log(`- ${team.name} (ID: ${team.id})`);
        });

        // Get details for the first team
        const firstTeam = teamsResponse.data[0];
        console.log(`\n3. Getting details for team ${firstTeam.id}:`);

        const teamResponse = await client.teams.getTeam(firstTeam.id);
        if (teamResponse.error) {
          console.error('Error getting team:', teamResponse.error);
        } else {
          console.log('Team details:');
          console.log(JSON.stringify(teamResponse.data, null, 2));

          // Get team memberships
          console.log(`\n4. Listing members of team ${firstTeam.id}:`);
          const membershipsResponse = await client.teams.getTeamMemberships(
            firstTeam.id,
          );
          if (membershipsResponse.error) {
            console.error(
              'Error getting team memberships:',
              membershipsResponse.error,
            );
          } else {
            console.log(
              `Found ${membershipsResponse.data?.length || 0} team members`,
            );
            if (
              membershipsResponse.data &&
              membershipsResponse.data.length > 0
            ) {
              membershipsResponse.data.forEach((membership) => {
                console.log(
                  `- User ID: ${membership.userId}, Role: ${membership.role}`,
                );
              });
            } else {
              console.log('No team members found');
            }
          }
        }
      } else {
        console.log('No teams found for this organization');
      }
    }

    // Create a new team example (commented out to prevent accidental creation)
    /*
    console.log(`\n5. Creating a new team in organization ${organization.id}:`);
    const createResponse = await client.teams.createTeam({
      name: 'Example Team',
      organizationId: organization.id
    });
    
    if (createResponse.error) {
      console.error('Error creating team:', createResponse.error);
    } else {
      console.log('Team created:');
      console.log(JSON.stringify(createResponse.data, null, 2));
      
      const teamId = createResponse.data.id;
      
      // Update the created team
      console.log(`\n6. Updating team ${teamId}:`);
      
      const updateResponse = await client.teams.updateTeam(teamId, {
        name: 'Updated Example Team'
      });
      
      if (updateResponse.error) {
        console.error('Error updating team:', updateResponse.error);
      } else {
        console.log('Team updated:');
        console.log(JSON.stringify(updateResponse.data, null, 2));
      }
      
      // Add a user to the team (you'd need a valid user ID)
      // console.log(`\n7. Adding a user to team ${teamId}:`);
      // const userId = 'some-valid-user-id';
      // const addMemberResponse = await client.teams.createTeamMembership(
      //   teamId,
      //   userId,
      //   TeamMembershipRole.MEMBER
      // );
      
      // Delete the created team
      console.log(`\n8. Deleting team ${teamId}:`);
      
      const deleteResponse = await client.teams.deleteTeam(teamId);
      if (deleteResponse.error) {
        console.error('Error deleting team:', deleteResponse.error);
      } else {
        console.log('Team deleted successfully');
      }
    }
    */

    // Example of team client-side validation
    console.log('\n9. Client-side validation:');
    try {
      // Creating a team with an empty name should fail
      await client.teams.createTeam({
        name: '',
        organizationId: organization.id,
      });
    } catch (validationError) {
      console.log(
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
      console.log(
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
  .then(() => console.log('\nTeams example completed'))
  .catch((error) => console.error('Fatal error:', error));
