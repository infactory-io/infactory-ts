// examples/datasource-example.ts
import { InfactoryClient } from '../src/client.js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { createErrorFromStatus } from '../src/errors/index.js';

// Load environment variables from .env file
dotenv.config();

// Get API key from environment variable
const apiKey = process.env.NF_API_KEY;
if (!apiKey) {
  console.error('Error: NF_API_KEY environment variable is not set');
  process.exit(1);
}

// Create a new instance of the InfactoryClient
const baseUrl = process.env.NF_BASE_URL || 'https://api.infactory.ai';
console.info('Using API base URL:', baseUrl);

const client = new InfactoryClient({
  apiKey: apiKey,
  baseURL: baseUrl,
});

// Path to the stocks.csv file for upload examples
// Use import.meta.url to get the current file URL in ES modules
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);
const stocksCsvPath = path.join(__dirname, '../tests/stocks.csv');

// Check if the file exists and log its stats for debugging
let csvExists = false;
try {
  const stats = fs.statSync(stocksCsvPath);
  csvExists = stats.isFile();
  console.info(`Found CSV file at ${stocksCsvPath}`);
  console.info(`File size: ${stats.size} bytes`);
} catch (error) {
  console.info(
    `Warning: CSV file not found at ${stocksCsvPath}. Some examples will be skipped.`,
  );
  console.error(error);
}

/**
 * Example function demonstrating how to use the DatasourcesClient
 */
async function datasourcesExample() {
  try {
    console.info('=== Datasources API Example ===');

    // For simplicity, we'll use a hardcoded project ID for this example
    // In a real application, you would get this from the user's projects
    // Get all projects to find one to use
    console.info('Getting available projects...');
    const projectsResponse = await client.projects.getProjects();

    if (
      projectsResponse.error ||
      !projectsResponse.data ||
      projectsResponse.data.length === 0
    ) {
      console.error(
        'Error getting projects or no projects found:',
        projectsResponse.error,
      );
      return;
    }

    // Find a project to work with
    const firstProject = projectsResponse.data[0];
    const projectId = firstProject.id;
    console.info(`Using project: ${firstProject.name} (${projectId})`);

    // EXAMPLE 1: List datasources for the project
    console.info('\n1. Listing datasources for the project:');
    const datasourcesResponse =
      await client.datasources.getProjectDatasources(projectId);
    if (datasourcesResponse.error) {
      console.error('Error listing datasources:', datasourcesResponse.error);
    } else {
      console.info(
        `Found ${datasourcesResponse.data?.length || 0} datasources`,
      );
      if (datasourcesResponse.data && datasourcesResponse.data.length > 0) {
        datasourcesResponse.data.forEach((ds: any, index: number) => {
          console.info(
            `${index + 1}. ${ds.name || 'Unnamed'} (ID: ${ds.id}) - Type: ${ds.type}`,
          );
        });

        // If we have any datasources, get details for the first one
        const firstDatasource = datasourcesResponse.data[0];

        // EXAMPLE 2: Get datasource details with datalines
        console.info('\n2. Getting datasource details with datalines:');
        const detailsResponse =
          await client.datasources.getDatasourceWithDatalines(
            firstDatasource.id,
          );
        if (detailsResponse.error) {
          console.error(
            'Error getting datasource details:',
            detailsResponse.error,
          );
        } else {
          console.info('Datasource Details:');
          console.info(`- ID: ${detailsResponse.data?.id}`);
          console.info(`- Name: ${detailsResponse.data?.name}`);
          console.info(`- Type: ${detailsResponse.data?.type}`);
          console.info(`- Project ID: ${detailsResponse.data?.projectId}`);
          console.info(`- Status: ${detailsResponse.data?.status}`);

          console.info(
            `- Data Objects: ${detailsResponse.data?.dataobjects?.length || 0}`,
          );
          if (
            detailsResponse.data?.dataobjects &&
            detailsResponse.data.dataobjects.length > 0
          ) {
            detailsResponse.data.dataobjects.forEach(
              (obj: any, idx: number) => {
                console.info(
                  `  ${idx + 1}. ${obj.key} (${obj.fileType}, ${obj.fileSize} bytes)`,
                );
              },
            );
          }
        }

        // EXAMPLE 3: Get ontology graph for a datasource
        console.info('\n3. Getting ontology graph for the datasource:');
        const ontologyResponse = await client.datasources.getOntologyGraph(
          firstDatasource.id,
        );
        if (ontologyResponse.error) {
          console.error(
            'Error getting ontology graph:',
            ontologyResponse.error,
          );
        } else {
          console.info('Ontology Graph:');
          console.info(`- Nodes: ${ontologyResponse.data?.nodes?.length || 0}`);
          console.info(`- Edges: ${ontologyResponse.data?.edges?.length || 0}`);
        }
      }
    }

    // EXAMPLE 4: Create a new datasource
    console.info('\n4. Creating a new datasource:');
    const createResponse = await client.datasources.createDatasource({
      name: 'Example Datasource',
      projectId: projectId,
      type: 'csv',
      uri: 'example-uri://test',
    });

    if (createResponse.error) {
      console.error('Error creating datasource:', createResponse.error);
    } else {
      console.info(
        `Created datasource: ${createResponse.data?.name} (ID: ${createResponse.data?.id})`,
      );

      // Update the created datasource
      if (createResponse.data) {
        const datasourceId = createResponse.data.id;

        // EXAMPLE 5: Update the datasource
        console.info('\n5. Updating the datasource:');
        const updateResponse = await client.datasources.updateDatasource(
          datasourceId,
          {
            name: 'Updated Example Datasource',
            uri: 'example-uri://updated',
          },
        );

        if (updateResponse.error) {
          console.error('Error updating datasource:', updateResponse.error);
        } else {
          console.info(`Updated datasource: ${updateResponse.data?.name}`);
          console.info(`- New URI: ${updateResponse.data?.uri}`);
        }

        // EXAMPLE 6: We'll skip the uploadDatasource example since it requires a FormData object
        // and a jobId, which is more complex for this example
        console.info(
          '\n6. Skipping uploadDatasource example - requires FormData and jobId',
        );

        // For reference, here's how you would use uploadDatasource in a real application:
        // 1. Create a FormData object
        // 2. Append the file to the FormData
        // 3. Generate or obtain a job ID
        // 4. Call uploadDatasource with the project ID, datasource ID, FormData, and job ID
        // 5. Process the returned stream of events

        // EXAMPLE 7: Clean up by deleting the datasource
        console.info('\n7. Cleaning up - Deleting the datasource:');
        const deleteResponse =
          await client.datasources.deleteDatasource(datasourceId);
        if (deleteResponse.error) {
          console.error('Error deleting datasource:', deleteResponse.error);
        } else {
          console.info('Datasource deleted successfully');
        }
      }
    }

    // EXAMPLE 8: Upload a CSV file following the proper API workflow
    console.info('\n8. Demonstrating proper CSV upload workflow:');
    console.info('Step 1: Create a datasource specifically for CSV data');
    console.info('Step 2: Upload the CSV file to the created datasource');
    console.info('Step 3: Verify the upload and inspect the data');

    if (csvExists) {
      console.info('\nExecuting CSV upload workflow with actual file...');

      try {
        // Step 1: Create a datasource specifically for CSV data
        console.info('\nStep 1: Creating a datasource for CSV data...');
        const csvDatasource = await client.datasources.createDatasource({
          name: 'Stock Market Data CSV',
          projectId: projectId,
          type: 'csv',
        });

        if (csvDatasource.error) {
          console.error('Error creating CSV datasource:', csvDatasource.error);
          return;
        }

        console.info(
          `Created CSV datasource: ${csvDatasource.data?.name} (ID: ${csvDatasource.data?.id})`,
        );
        let datasourceId = csvDatasource.data?.id;

        // Step 2: Upload the CSV file to the datasource
        console.info('\nStep 2: Uploading CSV file to the datasource...');
        console.info(`Using file: ${stocksCsvPath}`);

        // For this example, we'll demonstrate the direct API approach using fetch
        // This matches the API documentation and is more reliable across environments
        console.info(
          '\nUploading CSV file using the direct API approach with fetch...',
        );
        console.info('This follows the exact steps in the API documentation.');

        try {
          // Step 2a: Prepare the file for upload
          console.info('\nPreparing file for upload...');
          const fileBuffer = fs.readFileSync(stocksCsvPath);
          console.info(`Read file buffer of size: ${fileBuffer.length} bytes`);

          // Step 2b: Upload the file to the datasource using the SDK method
          console.info(
            '\nUploading file to datasource using client.datasources.uploadCsvFile...',
          );
          const uploadResult = await client.datasources.uploadCsvFile(
            projectId,
            stocksCsvPath,
            csvDatasource.data?.name,
          );

          if (uploadResult.uploadResponse.ok) {
            console.info('CSV file uploaded successfully!');
            console.info(
              `Status: ${uploadResult.uploadResponse.status} ${uploadResult.uploadResponse.statusText}`,
            );
            console.info(`Job ID: ${uploadResult.jobId}`);
          } else {
            console.error(
              `Error uploading CSV file: ${uploadResult.uploadResponse.status} ${uploadResult.uploadResponse.statusText}`,
            );
            console.error(
              'Response:',
              await uploadResult.uploadResponse.text(),
            );
          }

          // Wait a moment for processing to start
          console.info('\nWaiting for processing to start...');
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error('Error in file upload preparation:', error);
        }

        // Step 3: Verify the upload and inspect the data
        console.info('\nStep 3: Verifying the datasource status...');

        // Get datasource details to verify status
        if (!datasourceId) {
          console.error(
            'Error verifying datasource: Datasource ID is undefined',
          );
          return;
        }
        const verifyResponse =
          await client.datasources.getDatasource(datasourceId);
        if (verifyResponse.error) {
          console.error('Error verifying datasource:', verifyResponse.error);
        } else {
          console.info('Datasource status:');
          console.info(`- ID: ${verifyResponse.data?.id}`);
          console.info(`- Name: ${verifyResponse.data?.name}`);
          console.info(`- Type: ${verifyResponse.data?.type}`);
          console.info(`- Status: ${verifyResponse.data?.status || 'pending'}`);
        }

        // Get datasource with datalines to inspect the data
        console.info('\nInspecting data with datalines:');
        const dataResponse =
          await client.datasources.getDatasourceWithDatalines(datasourceId);
        if (dataResponse.error) {
          console.error('Error getting datalines:', dataResponse.error);
        } else {
          console.info(
            `- Data Objects: ${dataResponse.data?.dataobjects?.length || 0}`,
          );
          console.info(
            `- Schema: ${JSON.stringify(dataResponse.data?.schema || {}, null, 2)}`,
          );

          if (
            dataResponse.data?.datalines &&
            dataResponse.data.datalines.length > 0
          ) {
            console.info(
              `- Sample data (${Math.min(3, dataResponse.data.datalines.length)} rows):`,
            );
            dataResponse.data.datalines
              .slice(0, 3)
              .forEach((line: any, idx: number) => {
                console.info(`  Row ${idx + 1}: ${JSON.stringify(line)}`);
              });
          } else {
            console.info(
              '- No data available yet. The upload may still be processing.',
            );
          }
        }

        // Clean up the created datasource
        console.info('\nCleaning up - Deleting the CSV datasource:');
        const deleteResponse =
          await client.datasources.deleteDatasource(datasourceId);
        if (deleteResponse.error) {
          console.error('Error deleting datasource:', deleteResponse.error);
        } else {
          console.info('Datasource deleted successfully');
        }
      } catch (error) {
        console.error('Error in CSV upload workflow:', error);
      }
    } else {
      console.info('\nSkipping CSV upload example as the file was not found.');
    }

    // EXAMPLE 9: Demonstrate error handling with custom job submission
    console.info(
      '\n9. Demonstrating error handling with custom job submission:',
    );
    console.info(
      'This example shows how to use a custom job submission function for error handling',
    );
    console.info('\nExample code (not executed):');
    console.info(
      `  // Define a custom job submission function that simulates an error
  const customSubmitJob = async (client, params) => {
    // Simulate a job submission error
    return {
      error: createErrorFromStatus(500, 'server_error', 'Simulated job submission error')
    };
  };
  
  try {
    // This will fail because of our custom job submission function
    await client.datasources.uploadCsvFile(
      projectId,
      '/path/to/file.csv',
      'This Will Fail',
      customSubmitJob
    );
  } catch (error) {
    console.info('Successfully caught the expected error:', error);
  }
`,
    );

    // Demonstrate the error handling in a way that doesn't require file handling
    console.info('\nDemonstrating error handling with a simulated error:');
    try {
      // Create an error and throw it to demonstrate error handling
      const error = createErrorFromStatus(
        500,
        'server_error',
        'Simulated error for demonstration',
      );
      throw error;
    } catch (error) {
      console.info('Successfully caught the simulated error:');
      console.error(error);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the example
datasourcesExample()
  .then(() => console.info('\nDatasources example completed'))
  .catch((error) => console.error('Fatal error:', error));
