// examples/queryprograms-example.ts
import { InfactoryClient } from '../src/client.js';
import * as dotenv from 'dotenv';
import {
  isReadableStream,
  processStreamToApiResponse,
} from '../src/utils/stream.js';

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

/**
 * Example function demonstrating how to use the QueryProgramsClient
 */
async function queryProgramsExample() {
  try {
    console.log('=== Query Programs API Example ===');

    // First, get the current user to find a project
    const userResponse = await client.users.getCurrentUser();
    if (userResponse.error) {
      console.error('Error getting user:', userResponse.error);
      return;
    }

    // Find the user's teams and projects
    const teamsResponse =
      await client.users.getTeamsWithOrganizationsAndProjects({
        userId: userResponse.data?.id,
      });

    if (
      teamsResponse.error ||
      !teamsResponse.data ||
      !teamsResponse.data.teams ||
      teamsResponse.data.teams.length === 0
    ) {
      console.error(
        'Error getting teams or no teams found:',
        teamsResponse.error,
      );
      return;
    }

    // Find a project to work with
    const firstTeam = teamsResponse.data.teams[0];
    if (!firstTeam.projects || firstTeam.projects.length === 0) {
      console.error('No projects found for the team');
      return;
    }

    const projectId = firstTeam.projects[0].id;
    console.log(`Using project: ${firstTeam.projects[0].name} (${projectId})`);

    // List query programs for the project
    console.log('\n1. Listing query programs for the project:');
    const queryProgramsResponse =
      await client.queryPrograms.getQueryProgramsByProject(projectId);
    if (queryProgramsResponse.error) {
      console.error(
        'Error listing query programs:',
        queryProgramsResponse.error,
      );
    } else {
      console.log(
        `Found ${queryProgramsResponse.data?.length || 0} query programs`,
      );
      if (queryProgramsResponse.data && queryProgramsResponse.data.length > 0) {
        queryProgramsResponse.data.forEach((qp, index) => {
          console.log(
            `${index + 1}. ${qp.name || 'Unnamed'} (ID: ${qp.id}) - Published: ${qp.published ? 'Yes' : 'No'}`,
          );
        });
      }
    }

    // Create a new query program
    console.log('\n2. Creating a new query program:');
    const createResponse = await client.queryPrograms.createQueryProgram({
      name: 'Example Query Program',
      projectId: projectId,
      query: 'Show me the total number of users',
      published: false,
    });

    if (createResponse.error) {
      console.error('Error creating query program:', createResponse.error);
    } else {
      console.log(
        `Created query program: ${createResponse.data?.name} (ID: ${createResponse.data?.id})`,
      );

      // Get details of the created query program
      const queryProgramId = createResponse.data?.id;
      if (queryProgramId) {
        console.log('\n3. Getting query program details:');
        const detailsResponse =
          await client.queryPrograms.getQueryProgram(queryProgramId);
        if (detailsResponse.error) {
          console.error(
            'Error getting query program details:',
            detailsResponse.error,
          );
        } else {
          console.log('Query Program Details:');
          console.log(`- ID: ${detailsResponse.data?.id}`);
          console.log(`- Name: ${detailsResponse.data?.name}`);
          console.log(`- Project ID: ${detailsResponse.data?.projectId}`);
          console.log(`- Query: ${detailsResponse.data?.query}`);
          console.log(
            `- Published: ${detailsResponse.data?.published ? 'Yes' : 'No'}`,
          );
          console.log(`- Created: ${detailsResponse.data?.createdAt}`);
        }

        // Execute the query program
        console.log('\n4. Executing the query program:');
        const executeResponse =
          await client.queryPrograms.executeQueryProgram(queryProgramId);

        if (isReadableStream(executeResponse)) {
          console.log('Received streaming response, processing events...');
          const processedResponse =
            await processStreamToApiResponse(executeResponse);
          console.log('Execution result:', processedResponse.data);
        } else if (executeResponse.error) {
          console.error(
            'Error executing query program:',
            executeResponse.error,
          );
        } else {
          console.log('Execution result:');
          console.log(`- Success: ${executeResponse.data?.success}`);
          console.log(
            `- Result: ${JSON.stringify(executeResponse.data?.result, null, 2)}`,
          );
          console.log(
            `- Execution Time: ${executeResponse.data?.executionTime}s`,
          );
        }

        // Publish the query program
        console.log('\n5. Publishing the query program:');
        const publishResponse =
          await client.queryPrograms.publishQueryProgram(queryProgramId);
        if (publishResponse.error) {
          console.error(
            'Error publishing query program:',
            publishResponse.error,
          );
        } else {
          console.log(
            `Query program published successfully. Published status: ${publishResponse.data?.published}`,
          );
        }

        // Clean up by deleting the query program
        console.log('\n6. Cleaning up - Deleting the query program:');
        const deleteResponse =
          await client.queryPrograms.deleteQueryProgram(queryProgramId);
        if (deleteResponse.error) {
          console.error('Error deleting query program:', deleteResponse.error);
        } else {
          console.log('Query program deleted successfully');
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the example
queryProgramsExample()
  .then(() => console.log('\nQuery Programs example completed'))
  .catch((error) => console.error('Fatal error:', error));
