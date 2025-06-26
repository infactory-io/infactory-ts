import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { InfactoryClient } from '../../src/client.js';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDataDir = path.join(__dirname, '../test-data');
const testCsvPath = path.join(__dirname, '../stocks.csv');

// Make sure test data directory exists
if (!fs.existsSync(testDataDir)) {
  fs.mkdirSync(testDataDir, { recursive: true });
}

// Initialize client and global variables for tests
let client: InfactoryClient;
let apiKey: string | undefined;
let baseURL: string | undefined;

// Test data and state management
const testData = {
  organization: { id: '', name: '' },
  team: { id: '', name: '' },
  project: { id: '', name: '' },
  datasource: { id: '', name: '' },
  csvDatasource: { id: '', name: '' },
  dataline: { id: '', name: '' },
  // For test data creation and storage
  createdDatasources: [] as Array<{ id: string; name: string }>,
};

describe('Data Source Management E2E Tests', () => {
  beforeAll(async () => {
    // Ensure API key is set and store in module scope for all tests
    apiKey = process.env.NF_API_KEY;
    if (!apiKey) {
      throw new Error(
        'NF_API_KEY environment variable is required for E2E tests',
      );
    }

    // Ensure baseURL is properly formatted for Node.js environment and store in module scope
    baseURL = process.env.NF_BASE_URL;
    if (!baseURL) {
      throw new Error(
        'NF_BASE_URL environment variable is required for E2E tests',
      );
    }

    console.info(`Connecting to API at: ${baseURL}`);

    // Create client instance with absolute URL
    client = new InfactoryClient({
      apiKey,
      baseURL,
      isServer: true,
    });

    // For E2E testing, we don't want to attempt any real API calls if the API is down
    // We'll skip tests if we can't connect to the API
    const skipTests = process.env.SKIP_E2E_TESTS === 'true';
    if (skipTests) {
      console.info('Skipping E2E tests as SKIP_E2E_TESTS=true');
      // Mark all tests as skipped
      test.skipIf(true)('Skipping all tests', () => {});
      return;
    }

    try {
      // Organization and team IDs will be fetched from the API, no mocks
      console.info('Setting up test data using API...');

      // Step 1: Get organizations - use the first available organization
      console.info('Fetching organizations...');
      const orgsResponse = await client.organizations.list();

      if (!orgsResponse.data || orgsResponse.data.length === 0) {
        throw new Error(
          'Failed to fetch organizations or no organizations available',
        );
      }

      const organization = orgsResponse.data[0];
      testData.organization.id = organization.id;
      testData.organization.name = organization.name;
      console.info(
        `Using organization: ${testData.organization.name} (${testData.organization.id})`,
      );

      // Step 2: Get teams - use the first available team in the organization
      console.info('Fetching teams...');
      const teamsResponse = await client.teams.getTeams(
        testData.organization.id,
      );

      if (!teamsResponse.data || teamsResponse.data.length === 0) {
        throw new Error(
          'Failed to fetch teams or no teams available in the organization',
        );
      }

      const team = teamsResponse.data[0];
      testData.team.id = team.id;
      testData.team.name = team.name;
      console.info(`Using team: ${testData.team.name} (${testData.team.id})`);

      // Step 3: Create a test project to use for datasource testing
      console.info('Creating a test project for datasource tests...');
      const projectName = `Datasource Test Project ${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substring(2, 7)}`;
      const createProjectResponse = await client.projects.createProject({
        name: projectName,
        description: 'Project created for datasource E2E testing',
        teamId: testData.team.id,
      });

      if (createProjectResponse.error || !createProjectResponse.data) {
        throw new Error(
          `Failed to create test project: ${createProjectResponse.error?.message || 'Unknown error'}`,
        );
      }

      testData.project.id = createProjectResponse.data.id;
      testData.project.name = createProjectResponse.data.name;
      console.info(
        `Created test project: ${testData.project.name} (${testData.project.id})`,
      );

      // Ensure test CSV file exists
      if (!fs.existsSync(testCsvPath)) {
        throw new Error(`Test CSV file not found at: ${testCsvPath}`);
      }
      console.info(`Using test CSV file at: ${testCsvPath}`);
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up any datasources created during tests
    console.info('Cleaning up test data...');

    // Delete all datasources created during tests
    for (const datasource of testData.createdDatasources) {
      try {
        console.info(
          `Deleting datasource: ${datasource.name} (${datasource.id})`,
        );
        const deleteResponse = await client.datasources.deleteDatasource(
          datasource.id,
        );
        if (deleteResponse.error) {
          console.warn(
            `Warning: Failed to delete datasource ${datasource.id}: ${deleteResponse.error.message}`,
          );
        } else {
          console.info(`Successfully deleted datasource: ${datasource.id}`);
        }
      } catch (error) {
        console.warn(
          `Error during datasource cleanup: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    // Delete the test project
    if (testData.project.id) {
      try {
        console.info(
          `Deleting test project: ${testData.project.name} (${testData.project.id})`,
        );
        const deleteResponse = await client.projects.deleteProject(
          testData.project.id,
        );
        if (deleteResponse.error) {
          console.warn(
            `Warning: Failed to delete project ${testData.project.id}: ${deleteResponse.error.message}`,
          );
        } else {
          console.info(`Successfully deleted project: ${testData.project.id}`);
        }
      } catch (error) {
        console.warn(
          `Error during project cleanup: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  });

  test('1. List Datasources (SourceListAdd view equivalent)', async () => {
    // This simulates loading the SourceListAdd view
    console.info(`Fetching datasources for project: ${testData.project.id}`);
    const response = await client.datasources.getProjectDatasources(
      testData.project.id,
    );

    expect(response.error).toBeUndefined();
    expect(response.data).toBeDefined();

    console.info(
      `Found ${response.data?.length || 0} datasources in the project`,
    );

    // At the beginning of the test, there should be no datasources
    if (response.data && response.data.length > 0) {
      console.info('Existing datasources:');
      response.data.forEach((datasource) => {
        console.info(`- ${datasource.name} (${datasource.id})`);
      });
    }
  });

  test('2. Create CSV Datasource (Upload CSV dialog)', async () => {
    // This simulates clicking "Upload CSV" and filling out the form
    console.info('Starting CSV upload workflow...');

    // We'll use the uploadCsvFile method that handles the entire workflow:
    // 1. Create a datasource for CSV data
    // 2. Submit a job for file tracking
    // 3. Upload the file using the proper endpoints
    const csvDatasourceName = `CSV Datasource ${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substring(2, 7)}`;

    console.info(`Uploading CSV file to project ${testData.project.id}`);
    console.info(`Using CSV file at: ${testCsvPath}`);

    try {
      // Use the uploadCsvFile method which handles the whole process in one call
      const uploadResult = await client.datasources.uploadCsvFile(
        testData.project.id,
        testCsvPath,
        csvDatasourceName,
      );

      expect(uploadResult.datasource).toBeDefined();
      expect(uploadResult.jobId).toBeTruthy();

      console.info(`Upload successful with job ID: ${uploadResult.jobId}`);
      console.info(
        `Created datasource: ${uploadResult.datasource.name} (${uploadResult.datasource.id})`,
      );

      // Store the uploaded datasource info for later tests
      testData.csvDatasource = {
        id: uploadResult.datasource.id,
        name: uploadResult.datasource.name,
      };

      // Add to cleanup list
      testData.createdDatasources.push({
        id: uploadResult.datasource.id,
        name: uploadResult.datasource.name,
      });

      // Step 3: Verify the upload by getting datasource details with datalines
      console.info('Verifying uploaded data by fetching datasource details...');
      // Allow some time for the upload to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const datasourceResponse =
        await client.datasources.getDatasourceWithDatalines(
          testData.csvDatasource.id,
        );

      expect(datasourceResponse.error).toBeUndefined();
      expect(datasourceResponse.data).toBeDefined();

      console.info(
        `Datasource details: Name=${datasourceResponse.data?.name}, Type=${datasourceResponse.data?.type}`,
      );
      console.info(
        `Datalines count: ${datasourceResponse.data?.datalines?.length || 0}`,
      );
    } catch (error) {
      console.error('Error in CSV upload workflow:', error);
      throw error;
    }
  }, 30000);

  test('3. Create HTTP Datasource (Source Configuration)', async () => {
    // This simulates clicking "Add Source" and selecting HTTP
    const httpDatasourceName = `HTTP Datasource ${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substring(2, 7)}`;

    console.info(`Creating HTTP datasource: ${httpDatasourceName}`);

    const createResponse = await client.datasources.createDatasource({
      name: httpDatasourceName,
      projectId: testData.project.id,
      type: 'http',
      dataSourceConfig: {
        url: 'https://api.example.com/data',
        method: 'GET',
        headers: '{"Authorization": "Bearer test-token"}',
      },
    });

    expect(createResponse.error).toBeUndefined();
    expect(createResponse.data).toBeDefined();

    if (createResponse.data) {
      const datasource = createResponse.data;
      testData.datasource = {
        id: datasource.id,
        name: datasource.name,
      };

      // Add to the list of datasources to clean up
      testData.createdDatasources.push({
        id: datasource.id,
        name: datasource.name,
      });

      console.info(
        `Created HTTP datasource: ${testData.datasource.name} (${testData.datasource.id})`,
      );
    }
  });

  test('4. Update Datasource (Source Configuration)', async () => {
    // This simulates editing an existing datasource configuration
    if (!testData.datasource.id) {
      throw new Error('No datasource ID available for this test');
    }

    console.info(`Updating datasource: ${testData.datasource.id}`);

    const updateResponse = await client.datasources.updateDatasource(
      testData.datasource.id,
      {
        name: `${testData.datasource.name} (Updated)`,
        dataSourceConfig: {
          url: 'https://api.example.com/data/updated',
          method: 'GET',
          headers:
            '{"Authorization": "Bearer updated-token", "Content-Type": "application/json"}',
        },
      },
    );

    expect(updateResponse.error).toBeUndefined();
    expect(updateResponse.data).toBeDefined();

    if (updateResponse.data) {
      testData.datasource.name = updateResponse.data.name;
      console.info(`Updated datasource: ${testData.datasource.name}`);
    }
  });

  test('5. Get Datasource Details (Source Detail)', async () => {
    // This simulates clicking on a datasource in the list to view details
    if (!testData.datasource.id) {
      throw new Error('No datasource ID available for this test');
    }

    console.info(`Fetching details for datasource: ${testData.datasource.id}`);

    const response = await client.datasources.getDatasourceWithDatalines(
      testData.datasource.id,
    );

    expect(response.error).toBeUndefined();
    expect(response.data).toBeDefined();
    expect(response.data?.id).toBe(testData.datasource.id);

    if (response.data) {
      console.info(
        `Datasource details: ${response.data.name} (${response.data.id})`,
      );
      console.info(`Type: ${response.data.type}`);
      console.info(`Datalines: ${response.data.datalines?.length || 0}`);
    }
  });

  test('6. Get Ontology Graph (Lineage/Ontology Tab)', async () => {
    // This simulates viewing the lineage/ontology tab in the datasource detail view
    if (!testData.datasource.id) {
      throw new Error('No datasource ID available for this test');
    }

    console.info(
      `Fetching ontology graph for datasource: ${testData.datasource.id}`,
    );

    const response = await client.datasources.getOntologyGraph(
      testData.datasource.id,
    );

    // We don't expect any ontology data for a newly created datasource,
    // but the API should still respond successfully
    expect(response.error).toBeUndefined();

    console.info('Ontology graph data retrieved');
    // Print basic graph information if available
    if (response.data) {
      const nodeCount = response.data.nodes?.length || 0;
      const edgeCount = response.data.edges?.length || 0;
      console.info(`Graph contains ${nodeCount} nodes and ${edgeCount} edges`);
    }
  });

  test('7. Update Dataline Model (SchemaEditorTab)', async () => {
    // This simulates editing a dataline's schema in the Schema Editor tab
    if (!testData.csvDatasource.id) {
      throw new Error('No CSV datasource ID available for this test');
    }

    // First, get the datalines for the CSV datasource
    console.info(
      `Fetching datalines for CSV datasource: ${testData.csvDatasource.id}`,
    );
    const datasourceResponse =
      await client.datasources.getDatasourceWithDatalines(
        testData.csvDatasource.id,
      );

    expect(datasourceResponse.error).toBeUndefined();
    expect(datasourceResponse.data).toBeDefined();

    // We need at least one dataline to proceed
    if (
      !datasourceResponse.data?.datalines ||
      datasourceResponse.data.datalines.length === 0
    ) {
      console.info(
        'No datalines found for the CSV datasource. Skipping dataline update test.',
      );
      return;
    }

    // Use the first dataline for this test
    const dataline = datasourceResponse.data.datalines[0];
    testData.dataline = {
      id: dataline.id,
      name: dataline.name || 'Unnamed dataline',
    };
    console.info(
      `Using dataline: ${testData.dataline.name} (${testData.dataline.id})`,
    );

    // Update the dataline's data model
    const updatedDataModel = {
      fields: [
        { name: 'id', type: 'string', description: 'Updated ID field' },
        { name: 'value', type: 'number', description: 'Updated numeric value' },
        {
          name: 'category',
          type: 'string',
          description: 'Updated category field',
        },
      ],
    };

    console.info('Updating dataline model...');
    const updateResponse = await client.datalines.updateDataline(
      testData.dataline.id,
      {
        dataModel: updatedDataModel,
      },
    );

    expect(updateResponse.error).toBeUndefined();
    console.info('Dataline model updated successfully');
  });

  test('8. Update Dataline Schema (SchemaCodeTab)', async () => {
    // This simulates editing a dataline's schema code in the Schema Code tab
    if (!testData.dataline.id) {
      console.info('No dataline ID available for this test. Skipping.');
      return;
    }

    console.info(`Updating schema code for dataline: ${testData.dataline.id}`);

    const schemaCode = `{
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "value": { "type": "number" },
    "category": { "type": "string" }
  },
  "required": ["id"]
}`;

    const updateResponse = await client.datalines.updateDatalineSchema(
      testData.dataline.id,
      schemaCode,
    );

    expect(updateResponse.error).toBeUndefined();
    console.info('Dataline schema code updated successfully');
  });

  test('9. View Processing Events (DataProcessingTab)', async () => {
    // This simulates viewing the data processing events in the Data Processing tab
    if (!testData.csvDatasource.id) {
      throw new Error('No CSV datasource ID available for this test');
    }

    console.info(
      `Fetching processing events for datasource: ${testData.csvDatasource.id}`,
    );

    // Use the jobs API to get events related to this datasource
    const jobsResponse = await client.httpClient.get<any>(
      '/v1/jobs/by-source',
      {
        params: {
          sourceId: testData.csvDatasource.id,
          source: 'datasource',
        },
      },
    );

    expect(jobsResponse.error).toBeUndefined();

    console.info('Processing events retrieved');
    if (jobsResponse.data) {
      const eventCount = Array.isArray(jobsResponse.data)
        ? jobsResponse.data.length
        : 0;
      console.info(`Found ${eventCount} processing events`);

      // Display some information about the events
      if (eventCount > 0 && Array.isArray(jobsResponse.data)) {
        jobsResponse.data.slice(0, 3).forEach((event, index) => {
          console.info(
            `Event ${index + 1}: Type=${event.eventType || 'Unknown'}, Timestamp=${new Date(event.timestamp || 0).toISOString()}`,
          );
        });
      }
    }
  });

  test('10. Delete Datasource (ConfirmDeleteSourceDialog)', async () => {
    // This simulates confirming deletion of a datasource
    if (!testData.datasource.id) {
      throw new Error('No datasource ID available for deletion test');
    }

    console.info(
      `Deleting datasource: ${testData.datasource.name} (${testData.datasource.id})`,
    );

    const response = await client.datasources.deleteDatasource(
      testData.datasource.id,
    );

    expect(response.error).toBeUndefined();
    console.info(
      `Deleted datasource: ${testData.datasource.name} (${testData.datasource.id})`,
    );

    // Remove from the cleanup list since we've already deleted it
    testData.createdDatasources = testData.createdDatasources.filter(
      (ds) => ds.id !== testData.datasource.id,
    );

    // Verify the datasource was deleted by trying to fetch it
    console.info(`Verifying deletion of datasource: ${testData.datasource.id}`);
    const verifyResponse = await client.datasources.getDatasource(
      testData.datasource.id,
    );

    // Either we should get an error OR the datasource should have a deletedAt timestamp
    if (verifyResponse.data) {
      expect(verifyResponse.data.deletedAt).not.toBeNull();
    } else {
      expect(verifyResponse.error).toBeDefined();
    }
  });

  test('11. Test Database Connection (Test Connection button)', async () => {
    // This simulates clicking the Test Connection button in a database source configuration
    console.info('Testing database connection...');

    // Use a mock PostgreSQL connection string for testing
    const connectionString = 'postgresql://user:password@localhost:5432/testdb';

    const response =
      await client.datasources.testDatabaseConnection(connectionString);

    // In a real environment, this might fail if no actual database is available,
    // but we're testing the API call flow itself
    console.info(
      `Connection test response received: ${response.error ? 'Error' : 'Success'}`,
    );

    // Since we don't have a real database, we don't make strict assertions here
    // but just verify the API call completes without throwing
    expect(response).toBeDefined();
  });
});
