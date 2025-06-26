// examples/datalines-example.ts
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

/**
 * Example function demonstrating how to use the DatalinesClient
 */
async function datalinesExample() {
  try {
    console.info('=== Datalines API Example ===');

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
    console.info(`Using project: ${firstTeam.projects[0].name} (${projectId})`);

    // List datalines for the project
    console.info('\n1. Listing datalines for the project:');
    const datalinesResponse =
      await client.datalines.getProjectDatalines(projectId);
    if (datalinesResponse.error) {
      console.error('Error listing datalines:', datalinesResponse.error);
    } else {
      console.info(`Found ${datalinesResponse.data?.length || 0} datalines`);
      if (datalinesResponse.data && datalinesResponse.data.length > 0) {
        datalinesResponse.data.forEach((dl, index) => {
          console.info(`${index + 1}. ${dl.name || 'Unnamed'} (ID: ${dl.id})`);
        });

        // If we have any datalines, get details for the first one
        const firstDataline = datalinesResponse.data[0];

        console.info('\n2. Getting dataline details:');
        const detailsResponse = await client.datalines.getDataline(
          firstDataline.id,
        );
        if (detailsResponse.error) {
          console.error(
            'Error getting dataline details:',
            detailsResponse.error,
          );
        } else {
          console.info('Dataline Details:');
          console.info(`- ID: ${detailsResponse.data?.id}`);
          console.info(`- Name: ${detailsResponse.data?.name}`);
          console.info(`- Project ID: ${detailsResponse.data?.projectId}`);
          console.info(
            `- Data Object ID: ${detailsResponse.data?.dataobjectId}`,
          );

          // If the dataline has a schema code, print a snippet
          if (detailsResponse.data?.schemaCode) {
            const schemaSnippet = detailsResponse.data.schemaCode.substring(
              0,
              100,
            );
            console.info(
              `- Schema Code (snippet): ${schemaSnippet}${detailsResponse.data.schemaCode.length > 100 ? '...' : ''}`,
            );
          }

          // If the dataline has a data model, print it
          if (detailsResponse.data?.dataModel) {
            console.info('- Data Model:');
            console.info(
              JSON.stringify(detailsResponse.data.dataModel, null, 2),
            );
          }
        }
      }
    }

    // Create a new dataline
    console.info('\n3. Creating a new dataline:');
    // First, let's check if we have any datasources to connect to
    const datasourcesResponse =
      await client.datasources.getProjectDatasources(projectId);

    if (datasourcesResponse.error) {
      console.error('Error getting datasources:', datasourcesResponse.error);
    } else if (
      !datasourcesResponse.data ||
      datasourcesResponse.data.length === 0
    ) {
      console.info(
        'No datasources found for this project. Skipping dataline creation.',
      );
    } else {
      // Use the first datasource for this example
      const firstDatasource = datasourcesResponse.data[0];

      // Simple schema code example
      const schemaCode = `
      {
        "title": "Example Schema",
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "value": { "type": "number" }
        },
        "required": ["id", "name"]
      }`;

      // Create the dataline
      const createResponse = await client.datalines.createDataline({
        name: 'Example Dataline',
        projectId: projectId,
        dataobjectId: firstDatasource.id, // using datasource ID as data object ID for simplicity
        schemaCode: schemaCode,
      });

      if (createResponse.error) {
        console.error('Error creating dataline:', createResponse.error);
      } else {
        console.info(
          `Created dataline: ${createResponse.data?.name} (ID: ${createResponse.data?.id})`,
        );

        // Update the dataline
        if (createResponse.data) {
          const datalineId = createResponse.data.id;

          console.info('\n4. Updating the dataline:');
          const updateResponse = await client.datalines.updateDataline(
            datalineId,
            {
              name: 'Updated Example Dataline',
              dataModel: {
                fields: [
                  {
                    name: 'id',
                    type: 'string',
                    description: 'Unique identifier',
                  },
                  { name: 'name', type: 'string', description: 'Display name' },
                  {
                    name: 'value',
                    type: 'number',
                    description: 'Numeric value',
                  },
                  {
                    name: 'active',
                    type: 'boolean',
                    description: 'Status flag',
                  },
                ],
              },
            },
          );

          if (updateResponse.error) {
            console.error('Error updating dataline:', updateResponse.error);
          } else {
            console.info(`Updated dataline: ${updateResponse.data?.name}`);

            // Update just the schema
            console.info('\n5. Updating the dataline schema:');
            const updatedSchemaCode = `
            {
              "title": "Updated Example Schema",
              "type": "object",
              "properties": {
                "id": { "type": "string" },
                "name": { "type": "string" },
                "value": { "type": "number" },
                "active": { "type": "boolean" },
                "timestamp": { "type": "string", "format": "date-time" }
              },
              "required": ["id", "name"]
            }`;

            const schemaUpdateResponse =
              await client.datalines.updateDatalineSchema(
                datalineId,
                updatedSchemaCode,
              );

            if (schemaUpdateResponse.error) {
              console.error(
                'Error updating dataline schema:',
                schemaUpdateResponse.error,
              );
            } else {
              console.info('Dataline schema updated successfully');
            }

            // Clean up by deleting the dataline
            console.info('\n6. Cleaning up - Deleting the dataline:');
            const deleteResponse =
              await client.datalines.deleteDataline(datalineId);
            if (deleteResponse.error) {
              console.error('Error deleting dataline:', deleteResponse.error);
            } else {
              console.info('Dataline deleted successfully');
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the example
datalinesExample()
  .then(() => console.info('\nDatalines example completed'))
  .catch((error) => console.error('Fatal error:', error));
