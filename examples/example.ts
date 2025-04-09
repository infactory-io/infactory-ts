// example.ts - Example usage of the InfactoryClient SDK

import { InfactoryClient } from '../src/client.js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get API key from environment variable
const apiKey = process.env.NF_API_KEY;
if (!apiKey) {
  console.error('Error: NF_API_KEY environment variable is not set');
  process.exit(1);
}

// Create a new instance of the InfactoryClient
const client = new InfactoryClient({
  apiKey: apiKey,
});

// Override the base URL in the core version.ts
process.env.NEXT_PUBLIC_API_BASE_URL =
  process.env.NF_BASE_URL || 'https://api.infactory.ai';

async function testClient() {
  try {
    console.log('Testing InfactoryClient...');

    // 1. Get current user information
    console.log('\n--- Getting current user info ---');
    const userResponse = await client.users.getCurrentUser();
    if (userResponse.error) {
      console.error('Error getting user:', userResponse.error);
    } else {
      console.log('Current user:', userResponse.data);
    }

    // 2. List projects
    console.log('\n--- Listing projects ---');
    const projectsResponse = await client.projects.getProjects();
    if (projectsResponse.error) {
      console.error('Error listing projects:', projectsResponse.error);
    } else {
      console.log(`Found ${projectsResponse.data?.length || 0} projects`);
      if (projectsResponse.data && projectsResponse.data.length > 0) {
        // Display project names and IDs
        projectsResponse.data.forEach((project) => {
          console.log(`- ${project.name} (ID: ${project.id})`);
        });

        // Select the first project for further operations
        const projectId = projectsResponse.data[0].id;

        // 3. Get project details
        console.log(`\n--- Getting details for project ${projectId} ---`);
        const projectResponse = await client.projects.getProject(projectId);
        if (projectResponse.error) {
          console.error('Error getting project:', projectResponse.error);
        } else {
          console.log('Project details:', projectResponse.data);
        }

        // 4. List datasources for the project
        console.log(`\n--- Listing datasources for project ${projectId} ---`);
        const datasourcesResponse =
          await client.datasources.getProjectDatasources(projectId);
        if (datasourcesResponse.error) {
          console.error(
            'Error listing datasources:',
            datasourcesResponse.error,
          );
        } else {
          console.log(
            `Found ${datasourcesResponse.data?.length || 0} datasources`,
          );
          datasourcesResponse.data?.forEach((datasource) => {
            console.log(
              `- ${datasource.name} (ID: ${datasource.id}, Type: ${datasource.type})`,
            );
          });
        }

        // 5. List query programs for the project
        console.log(
          `\n--- Listing query programs for project ${projectId} ---`,
        );
        const queryProgramsResponse =
          await client.queryprograms.getQueryProgramsByProject(projectId);
        if (queryProgramsResponse.error) {
          console.error(
            'Error listing query programs:',
            queryProgramsResponse.error,
          );
        } else {
          console.log(
            `Found ${queryProgramsResponse.data?.length || 0} query programs`,
          );
          queryProgramsResponse.data?.forEach((program) => {
            console.log(
              `- ${program.name || 'Unnamed program'} (ID: ${program.id})`,
            );
          });

          // If we have any query programs, get details for the first one
          if (
            queryProgramsResponse.data &&
            queryProgramsResponse.data.length > 0
          ) {
            const programId = queryProgramsResponse.data[0].id;

            console.log(
              `\n--- Getting details for query program ${programId} ---`,
            );
            const programResponse =
              await client.queryprograms.getQueryProgram(programId);
            if (programResponse.error) {
              console.error(
                'Error getting query program:',
                programResponse.error,
              );
            } else {
              console.log('Query program details:', programResponse.data);
            }
          }
        }
      }
    }

    // 6. List teams
    if (userResponse.data?.organization_id) {
      console.log('\n--- Listing teams ---');
      const teamsResponse = await client.teams.getTeams();
      if (teamsResponse.error) {
        console.error('Error listing teams:', teamsResponse.error);
      } else {
        console.log(`Found ${teamsResponse.data?.length || 0} teams`);
        teamsResponse.data?.forEach((team) => {
          console.log(`- ${team.name} (ID: ${team.id})`);
        });
      }
    } else {
      console.log(
        '\n--- Skipping teams list - no organization ID available ---',
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test function
testClient()
  .then(() => console.log('\nInfactoryClient test completed'))
  .catch((error) => console.error('Fatal error:', error));
