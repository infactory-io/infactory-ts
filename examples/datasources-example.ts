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
console.log('Using API base URL:', baseUrl);

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
  console.log(`Found CSV file at ${stocksCsvPath}`);
  console.log(`File size: ${stats.size} bytes`);
} catch (error) {
  console.log(
    `Warning: CSV file not found at ${stocksCsvPath}. Some examples will be skipped.`,
  );
  console.error(error);
}

/**
 * Example function demonstrating how to use the DatasourcesClient
 */
async function datasourcesExample() {
  try {
    console.log('=== Datasources API Example ===');

    // For simplicity, we'll use a hardcoded project ID for this example
    // In a real application, you would get this from the user's projects
    // Get all projects to find one to use
    console.log('Getting available projects...');
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
    console.log(`Using project: ${firstProject.name} (${projectId})`);

    // EXAMPLE 1: List datasources for the project
    console.log('\n1. Listing datasources for the project:');
    const datasourcesResponse =
      await client.datasources.getProjectDatasources(projectId);
    if (datasourcesResponse.error) {
      console.error('Error listing datasources:', datasourcesResponse.error);
    } else {
      console.log(`Found ${datasourcesResponse.data?.length || 0} datasources`);
      if (datasourcesResponse.data && datasourcesResponse.data.length > 0) {
        datasourcesResponse.data.forEach((ds: any, index: number) => {
          console.log(
            `${index + 1}. ${ds.name || 'Unnamed'} (ID: ${ds.id}) - Type: ${ds.type}`,
          );
        });

        // If we have any datasources, get details for the first one
        const firstDatasource = datasourcesResponse.data[0];

        // EXAMPLE 2: Get datasource details with datalines
        console.log('\n2. Getting datasource details with datalines:');
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
          console.log('Datasource Details:');
          console.log(`- ID: ${detailsResponse.data?.id}`);
          console.log(`- Name: ${detailsResponse.data?.name}`);
          console.log(`- Type: ${detailsResponse.data?.type}`);
          console.log(`- Project ID: ${detailsResponse.data?.projectId}`);
          console.log(`- Status: ${detailsResponse.data?.status}`);

          console.log(
            `- Data Objects: ${detailsResponse.data?.dataobjects?.length || 0}`,
          );
          if (
            detailsResponse.data?.dataobjects &&
            detailsResponse.data.dataobjects.length > 0
          ) {
            detailsResponse.data.dataobjects.forEach(
              (obj: any, idx: number) => {
                console.log(
                  `  ${idx + 1}. ${obj.key} (${obj.fileType}, ${obj.fileSize} bytes)`,
                );
              },
            );
          }
        }

        // EXAMPLE 3: Get ontology graph for a datasource
        console.log('\n3. Getting ontology graph for the datasource:');
        const ontologyResponse = await client.datasources.getOntologyGraph(
          firstDatasource.id,
        );
        if (ontologyResponse.error) {
          console.error(
            'Error getting ontology graph:',
            ontologyResponse.error,
          );
        } else {
          console.log('Ontology Graph:');
          console.log(`- Nodes: ${ontologyResponse.data?.nodes?.length || 0}`);
          console.log(`- Edges: ${ontologyResponse.data?.edges?.length || 0}`);
        }
      }
    }

    // EXAMPLE 4: Create a new datasource
    console.log('\n4. Creating a new datasource:');
    const createResponse = await client.datasources.createDatasource({
      name: 'Example Datasource',
      projectId: projectId,
      type: 'csv',
      uri: 'example-uri://test',
    });

    if (createResponse.error) {
      console.error('Error creating datasource:', createResponse.error);
    } else {
      console.log(
        `Created datasource: ${createResponse.data?.name} (ID: ${createResponse.data?.id})`,
      );

      // Update the created datasource
      if (createResponse.data) {
        const datasourceId = createResponse.data.id;

        // EXAMPLE 5: Update the datasource
        console.log('\n5. Updating the datasource:');
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
          console.log(`Updated datasource: ${updateResponse.data?.name}`);
          console.log(`- New URI: ${updateResponse.data?.uri}`);
        }

        // EXAMPLE 6: We'll skip the uploadDatasource example since it requires a FormData object
        // and a jobId, which is more complex for this example
        console.log(
          '\n6. Skipping uploadDatasource example - requires FormData and jobId',
        );

        // For reference, here's how you would use uploadDatasource in a real application:
        // 1. Create a FormData object
        // 2. Append the file to the FormData
        // 3. Generate or obtain a job ID
        // 4. Call uploadDatasource with the project ID, datasource ID, FormData, and job ID
        // 5. Process the returned stream of events

        // EXAMPLE 7: Clean up by deleting the datasource
        console.log('\n7. Cleaning up - Deleting the datasource:');
        const deleteResponse =
          await client.datasources.deleteDatasource(datasourceId);
        if (deleteResponse.error) {
          console.error('Error deleting datasource:', deleteResponse.error);
        } else {
          console.log('Datasource deleted successfully');
        }
      }
    }

    // EXAMPLE 8: Upload a CSV file following the proper API workflow
    console.log('\n8. Demonstrating proper CSV upload workflow:');
    console.log('Step 1: Create a datasource specifically for CSV data');
    console.log('Step 2: Upload the CSV file to the created datasource');
    console.log('Step 3: Verify the upload and inspect the data');

    if (csvExists) {
      console.log('\nExecuting CSV upload workflow with actual file...');

      try {
        // Step 1: Create a datasource specifically for CSV data
        console.log('\nStep 1: Creating a datasource for CSV data...');
        const csvDatasource = await client.datasources.createDatasource({
          name: 'Stock Market Data CSV',
          projectId: projectId,
          type: 'csv',
        });

        if (csvDatasource.error) {
          console.error('Error creating CSV datasource:', csvDatasource.error);
          return;
        }

        console.log(
          `Created CSV datasource: ${csvDatasource.data?.name} (ID: ${csvDatasource.data?.id})`,
        );
        let datasourceId = csvDatasource.data?.id;

        // Step 2: Upload the CSV file to the datasource
        console.log('\nStep 2: Uploading CSV file to the datasource...');
        console.log(`Using file: ${stocksCsvPath}`);

        // For this example, we'll demonstrate the direct API approach using fetch
        // This matches the API documentation and is more reliable across environments
        console.log(
          '\nUploading CSV file using the direct API approach with fetch...',
        );
        console.log('This follows the exact steps in the API documentation.');

        try {
          // Step 2a: Prepare the file for upload
          console.log('\nPreparing file for upload...');
          const fileBuffer = fs.readFileSync(stocksCsvPath);
          console.log(`Read file buffer of size: ${fileBuffer.length} bytes`);

          // Step 2b: Upload the file to the datasource using fetch
          console.log('\nUploading file to datasource...');

          // Create a FormData object for the upload
          const FormData = await import('form-data');
          const formData = new FormData.default();

          // Add the file to the FormData
          formData.append('file', fileBuffer, {
            filename: path.basename(stocksCsvPath),
            contentType: 'text/csv',
          });

          // Add the file type
          formData.append('file_type', 'csv');

          // Get the headers from the FormData
          const formHeaders = formData.getHeaders();

          // Log what we're doing
          console.log(
            `Uploading to: ${baseUrl}/v1/datasources/${datasourceId}/upload?project_id=${projectId}`,
          );
          console.log(
            'Headers:',
            JSON.stringify(
              {
                ...formHeaders,
                Authorization: 'Bearer ***API_KEY***', // Masked for security
              },
              null,
              2,
            ),
          );

          // Now let's actually perform the upload
          console.log('\nPerforming the actual upload...');

          // Import node-fetch since we're in Node.js environment
          const fetch = (await import('node-fetch')).default;

          // Upload using fetch - using the correct endpoint based on the error message
          console.log(
            'Using the correct endpoint: /v1/actions/load/{projectId}',
          );
          const response = await fetch(
            `${baseUrl}/v1/actions/load/${projectId}`,
            {
              method: 'POST',
              headers: {
                ...formHeaders,
                Authorization: `Bearer ${apiKey}`,
              },
              body: formData,
            },
          );

          // Check the response
          if (response.status >= 200 && response.status < 300) {
            console.log('CSV file uploaded successfully!');
            console.log(`Status: ${response.status} ${response.statusText}`);

            // Parse the response body
            const responseBody = await response.text();
            console.log(`Response: ${responseBody}`);
          } else {
            console.error(
              `Error uploading CSV file: ${response.status} ${response.statusText}`,
            );
            console.error('Response:', await response.text());
          }

          // Wait a moment for processing to start
          console.log('\nWaiting for processing to start...');
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error('Error in file upload preparation:', error);
        }

        // Step 3: Verify the upload and inspect the data
        console.log('\nStep 3: Verifying the datasource status...');

        // Get datasource details to verify status
        const verifyResponse =
          await client.datasources.getDatasource(datasourceId);
        if (verifyResponse.error) {
          console.error('Error verifying datasource:', verifyResponse.error);
        } else {
          console.log('Datasource status:');
          console.log(`- ID: ${verifyResponse.data?.id}`);
          console.log(`- Name: ${verifyResponse.data?.name}`);
          console.log(`- Type: ${verifyResponse.data?.type}`);
          console.log(`- Status: ${verifyResponse.data?.status || 'pending'}`);
        }

        // Get datasource with datalines to inspect the data
        console.log('\nInspecting data with datalines:');
        const dataResponse =
          await client.datasources.getDatasourceWithDatalines(datasourceId);
        if (dataResponse.error) {
          console.error('Error getting datalines:', dataResponse.error);
        } else {
          console.log(
            `- Data Objects: ${dataResponse.data?.dataobjects?.length || 0}`,
          );
          console.log(
            `- Schema: ${JSON.stringify(dataResponse.data?.schema || {}, null, 2)}`,
          );

          if (
            dataResponse.data?.datalines &&
            dataResponse.data.datalines.length > 0
          ) {
            console.log(
              `- Sample data (${Math.min(3, dataResponse.data.datalines.length)} rows):`,
            );
            dataResponse.data.datalines
              .slice(0, 3)
              .forEach((line: any, idx: number) => {
                console.log(`  Row ${idx + 1}: ${JSON.stringify(line)}`);
              });
          } else {
            console.log(
              '- No data available yet. The upload may still be processing.',
            );
          }
        }

        // Clean up the created datasource
        console.log('\nCleaning up - Deleting the CSV datasource:');
        const deleteResponse =
          await client.datasources.deleteDatasource(datasourceId);
        if (deleteResponse.error) {
          console.error('Error deleting datasource:', deleteResponse.error);
        } else {
          console.log('Datasource deleted successfully');
        }
      } catch (error) {
        console.error('Error in CSV upload workflow:', error);
      }
    } else {
      console.log('\nSkipping CSV upload example as the file was not found.');
    }

    // EXAMPLE 9: Demonstrate error handling with custom job submission
    console.log(
      '\n9. Demonstrating error handling with custom job submission:',
    );
    console.log(
      'This example shows how to use a custom job submission function for error handling',
    );
    console.log('\nExample code (not executed):');
    console.log(
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
    console.log('Successfully caught the expected error:', error);
  }
`,
    );

    // Demonstrate the error handling in a way that doesn't require file handling
    console.log('\nDemonstrating error handling with a simulated error:');
    try {
      // Create an error and throw it to demonstrate error handling
      const error = createErrorFromStatus(
        500,
        'server_error',
        'Simulated error for demonstration',
      );
      throw error;
    } catch (error) {
      console.log('Successfully caught the simulated error:');
      console.error(error);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the example
datasourcesExample()
  .then(() => console.log('\nDatasources example completed'))
  .catch((error) => console.error('Fatal error:', error));
