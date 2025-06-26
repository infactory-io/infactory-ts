// examples/apis-example.ts
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

// Get base URL from environment variable or use default
const baseURL = process.env.NF_BASE_URL || 'https://api.infactory.ai';

// Create a new instance of the InfactoryClient
const client = new InfactoryClient({
  apiKey: apiKey,
  baseURL: baseURL,
});

console.info(`Using API at: ${baseURL}`);

/**
 * Example function demonstrating how to use the APIsClient
 */
async function apisExample() {
  try {
    console.info('=== APIs Example ===');

    // First, get the current user to find a project
    const userResponse = await client.users.getCurrentUser();
    if (userResponse.error) {
      console.error('Error getting user:', userResponse.error);
      console.error(
        'Please make sure your API key is valid and set in the NF_API_KEY environment variable.',
      );
      console.error(
        'You can set it by running: export NF_API_KEY=your_api_key',
      );
      return;
    }

    console.info(`Authenticated as: ${userResponse.data?.email}`);
    console.info('User data:', JSON.stringify(userResponse.data, null, 2));

    // Find the user's teams and projects - use email as the parameter
    const email = userResponse.data?.email;
    if (!email) {
      console.error('Error: User email not found');
      return;
    }

    const teamsResponse =
      await client.users.getTeamsWithOrganizationsAndProjects({
        email: email,
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
    console.info(`Using project: ${firstTeam.projects[0].name} (${projectId})`);

    // List all APIs for the project
    console.info('\n1. Listing APIs for the project:');
    const apisResponse = await client.apis.getProjectApis(projectId);
    if (apisResponse.error) {
      console.error('Error listing APIs:', apisResponse.error);
    } else {
      console.info(`Found ${apisResponse.data?.length || 0} APIs`);
      if (apisResponse.data && apisResponse.data.length > 0) {
        apisResponse.data.forEach((api, index) => {
          console.info(
            `${index + 1}. ${api.name} (ID: ${api.id}) - Path: ${api.basePath}/${api.version} - Status: ${api.status}`,
          );
        });

        // Get details for the first API
        const firstApi = apisResponse.data[0];

        console.info('\n2. Getting API details:');
        const apiResponse = await client.apis.getApi(firstApi.id);
        if (apiResponse.error) {
          console.error('Error getting API details:', apiResponse.error);
        } else {
          console.info('API Details:');
          console.info(`- ID: ${apiResponse.data?.id}`);
          console.info(`- Name: ${apiResponse.data?.name}`);
          console.info(`- Base Path: ${apiResponse.data?.basePath}`);
          console.info(`- Version: ${apiResponse.data?.version}`);
          console.info(`- Status: ${apiResponse.data?.status}`);
          console.info(
            `- Description: ${apiResponse.data?.description || 'No description'}`,
          );
        }

        // Get endpoints for the API
        console.info('\n3. Getting API endpoints:');
        const endpointsResponse = await client.apis.getApiEndpoints(
          firstApi.id,
        );
        if (endpointsResponse.error) {
          console.error(
            'Error getting API endpoints:',
            endpointsResponse.error,
          );
        } else {
          console.info(
            `Found ${endpointsResponse.data?.length || 0} endpoints`,
          );
          if (endpointsResponse.data && endpointsResponse.data.length > 0) {
            endpointsResponse.data.forEach((endpoint, index) => {
              console.info(
                `${index + 1}. ${endpoint.httpMethod} ${endpoint.path} - ${endpoint.name}`,
              );
            });
          }
        }
      }
    }

    // Get query programs for the project
    console.info('\n4. Getting query programs for the project:');

    // First, get the query programs for the project
    const programsResponse = await client.queryPrograms.listQueryPrograms({
      projectId: projectId,
    });

    if (programsResponse.error) {
      console.error('Error getting query programs:', programsResponse.error);
    } else {
      const programs = programsResponse.data || [];
      console.info(`Found ${programs.length} query programs`);

      if (programs.length > 0) {
        programs.forEach((program, index) => {
          console.info(`${index + 1}. ${program.name} (ID: ${program.id})`);
        });
      }
    }

    // Create a new API
    console.info('\n5. Creating a new API:');
    const createApiResponse = await client.apis.createApi({
      name: 'Example API',
      projectId: projectId,
      basePath: 'example-api',
      version: 'v1',
      description: 'An example API created via the SDK',
    });

    if (createApiResponse.error) {
      console.error('Error creating API:', createApiResponse.error);
    } else {
      console.info(
        `Created API: ${createApiResponse.data?.name} (ID: ${createApiResponse.data?.id})`,
      );

      const apiId = createApiResponse.data?.id;

      if (apiId && programsResponse.data && programsResponse.data.length > 0) {
        // Use the first query program to create an endpoint
        const queryProgramId = programsResponse.data[0].id;
        console.info('\n6. Creating an API endpoint:');

        const createEndpointResponse = await client.apis.createApiEndpoint({
          apiId: apiId,
          endpointName: 'Example Endpoint',
          httpMethod: 'GET',
          path: '/example',
          queryprogramId: queryProgramId,
          description: 'An example endpoint created via the SDK',
          operationId: 'getExample',
        });

        if (createEndpointResponse.error) {
          console.error(
            'Error creating API endpoint:',
            createEndpointResponse.error,
          );
        } else {
          console.info(
            `Created endpoint: ${createEndpointResponse.data?.name} - ${createEndpointResponse.data?.httpMethod} ${createEndpointResponse.data?.path}`,
          );

          const endpointId = createEndpointResponse.data?.id;

          if (endpointId) {
            // Update the endpoint
            console.info('\n7. Updating the API endpoint:');
            const updateEndpointResponse = await client.apis.updateApiEndpoint(
              endpointId,
              {
                description: 'Updated description for the example endpoint',
              },
            );

            if (updateEndpointResponse.error) {
              console.error(
                'Error updating API endpoint:',
                updateEndpointResponse.error,
              );
            } else {
              console.info(
                `Updated endpoint: ${updateEndpointResponse.data?.name} - Description: ${updateEndpointResponse.data?.description}`,
              );
            }

            // Delete the endpoint
            console.info('\n8. Deleting the API endpoint:');
            const deleteEndpointResponse =
              await client.apis.deleteApiEndpoint(endpointId);
            if (deleteEndpointResponse.error) {
              console.error(
                'Error deleting API endpoint:',
                deleteEndpointResponse.error,
              );
            } else {
              console.info('API endpoint deleted successfully');
            }
          }
        }
      }

      // Update the API
      console.info('\n9. Updating the API:');
      const updateApiResponse = await client.apis.updateApi(apiId, {
        description: 'Updated description for the example API',
      });

      if (updateApiResponse.error) {
        console.error('Error updating API:', updateApiResponse.error);
      } else {
        console.info(
          `Updated API: ${updateApiResponse.data?.name} - Description: ${updateApiResponse.data?.description}`,
        );
      }

      // Delete the API
      console.info('\n10. Deleting the API:');
      const deleteApiResponse = await client.apis.deleteApi(apiId);
      if (deleteApiResponse.error) {
        console.error('Error deleting API:', deleteApiResponse.error);
      } else {
        console.info('API deleted successfully');
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the example
apisExample()
  .then(() => console.info('\nAPIs example completed'))
  .catch((error) => console.error('Fatal error:', error));
