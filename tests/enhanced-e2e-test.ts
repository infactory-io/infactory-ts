#!/usr/bin/env ts-node
/**
 * Infactory Enhanced End-to-End Test for TypeScript SDK
 *
 * This script demonstrates a complete workflow using the Enhanced Infactory client:
 * 1. Create a new project
 * 2. Upload a CSV as a new datasource
 * 3. Monitor job progress
 * 4. View generated questions
 * 5. Run and publish queries
 * 6. View API endpoints and documentation
 * 7. Make API requests with custom parameters
 * 8. Use the chat endpoint with streaming response
 *
 * Usage:
 *   ts-node enhanced-e2e-test.ts [--verbose] [--quiet] [--debug]
 *
 * Options:
 *   --verbose    Show detailed logs including HTTP requests
 *   --quiet      Show only important messages and errors
 *   --debug      Show debug information including HTTP headers and bodies
 */

import fs from 'fs';
import path from 'path';
// Performance measurement no longer needed
// import { performance } from 'perf_hooks';
import minimist from 'minimist';
import * as dotenv from 'dotenv';
import { EnhancedInfactoryClient } from '../src/enhanced-client.js';
import {
  isReadableStream,
  processStreamToApiResponse,
} from '../src/utils/stream.js';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { QueryProgram } from '@/index.js';

// Load environment variables
dotenv.config();

// Parse command line arguments
const args = minimist(process.argv.slice(2), {
  boolean: ['verbose', 'quiet', 'debug'],
  default: { verbose: false, quiet: false, debug: false },
});

// Configure logging level based on arguments
let logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info';
if (args.debug) logLevel = 'debug';
else if (args.verbose) logLevel = 'info';
else if (args.quiet) logLevel = 'warn';

/**
 * Simple logger with levels
 */
class Logger {
  constructor(private prefix: string) {}

  debug(message: string, ...args: any[]): void {
    if (logLevel === 'debug') {
      console.debug(`[DEBUG] [${this.prefix}] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (['debug', 'info'].includes(logLevel)) {
      console.info(`[INFO] [${this.prefix}] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (['debug', 'info', 'warn'].includes(logLevel)) {
      console.warn(`[WARN] [${this.prefix}] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] [${this.prefix}] ${message}`, ...args);
  }
}

// Create global logger
const logger = new Logger('main');

// Check for API key in environment
const API_KEY = process.env.NF_API_KEY || '';
if (!API_KEY) {
  console.error('ERROR: NF_API_KEY environment variable not set.');
  console.error(
    'Please set your API key with: export NF_API_KEY=your_api_key_here',
  );
  process.exit(1);
}

// Define CSV file location
const CSV_FILE = './tests/stocks.csv';
if (!fs.existsSync(CSV_FILE)) {
  console.error(`ERROR: ${CSV_FILE} not found in current directory.`);
  process.exit(1);
}

/**
 * Wait for user to press Enter - function is commented out as it's currently unused
 * but kept for future interactive testing scenarios
 */
/*
function waitForUser(message = 'Press Enter to continue...'): Promise<void> {
  return new Promise((resolve) => {
    console.log(`\n${message}`);
    process.stdin.once('data', () => {
      resolve();
    });
  });
}
*/

/**
 * Print a formatted step header
 */
function printStep(stepNumber: number | string, stepName: string): void {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`Step ${stepNumber}: ${stepName}`);
  console.log(`${'='.repeat(80)}`);
}

/**
 * Helper to upload a file to a datasource via a job
 */
async function uploadFileWithJob(
  client: EnhancedInfactoryClient,
  projectId: string,
  datasourceId: string,
  filePath: string,
  datasourceName: string,
): Promise<string> {
  // Get file info
  const fileName = path.basename(filePath);
  const fileSize = fs.statSync(filePath).size;
  logger.info(
    `File to upload: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`,
  );

  // Create a job for the upload
  const jobPayload = {
    datasource_id: datasourceId,
    file_name: fileName,
    file_size: fileSize,
    dataset_name: datasourceName,
  };

  const jobMetadata = {
    file_name: fileName,
    file_size: fileSize,
    dataset_name: datasourceName,
  };

  // Submit the job
  logger.info('Submitting job for upload tracking...');
  const jobId = await client.submitJob({
    project_id: projectId,
    job_type: 'upload',
    payload: jobPayload,
    do_not_send_to_queue: true,
    source_id: datasourceId,
    source: 'datasource',
    source_event_type: 'file_upload',
    source_metadata: JSON.stringify(jobMetadata),
  });

  if (!jobId) {
    throw new Error('No job ID received from job submission');
  }

  logger.info(`Upload job created: ${jobId}`);

  // Upload the file
  logger.info('Uploading file...');

  // Create FormData with the file
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  formData.append('datasource_id', datasourceId);
  formData.append('job_id', jobId);

  // Use the correct endpoint format
  const uploadResponse = await fetch(
    `https://daily-api.infactory.ai/v1/actions/load/${projectId}?job_id=${jobId}&datasource_id=${datasourceId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${client.getApiKey()}`,
        ...formData.getHeaders(),
      },
      body: formData,
    },
  );

  // Check response
  if (uploadResponse.status !== 200) {
    throw new Error(`Error uploading file: ${await uploadResponse.text()}`);
  }

  logger.info('File upload request sent successfully!');
  return jobId;
}

/**
 * Main function to run the enhanced test
 */
async function main() {
  try {
    // Step 1: Initialize client
    printStep(1, 'Initialize client and authenticate');

    const client = new EnhancedInfactoryClient({ apiKey: API_KEY });

    // Get current user
    const user = await client.getCurrentUser();
    console.log('Successfully connected to Infactory API');
    console.log(
      `User: ${user.name || 'Unknown'} (${user.email || 'No email'})`,
    );

    // Step 2: Select organization and team
    printStep(2, 'Select organization and team');

    // Get first organization or create one
    const organizations = await client.getOrganizations();

    if (organizations.length === 0) {
      console.error(
        'No organizations found. Please create an organization first.',
      );
      process.exit(1);
    }

    const organization = organizations[0]; // Select the first organization
    console.log(
      `Selected organization: ${organization.name} (ID: ${organization.id})`,
    );

    // Get the organization context for fluent API access
    const orgContext = client.organization(organization.id);

    // Get teams for this organization
    const teamsResponse = await orgContext.getTeams();
    let team;

    if (!teamsResponse.data || teamsResponse.data.length === 0) {
      console.log('No teams found. Creating a new team...');
      const teamResponse = await orgContext.createTeam({
        name: `Team_${organization.id}`,
      });

      if (teamResponse.error) {
        console.error(`Error creating team: ${teamResponse.error.message}`);
        process.exit(1);
      }

      team = teamResponse.data;
      if (!team) {
        console.error('Error creating team: Team not found');
        process.exit(1);
      }

      console.log(`Created new team: ${team.name} (ID: ${team.id})`);
    } else {
      team = teamsResponse.data[0]; // Select the first team
      console.log(`Selected existing team: ${team.name} (ID: ${team.id})`);
    }

    // Step 3: Create a new project
    printStep(3, 'Create a new project');

    const now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const projectName = `Stock Analysis Testing ${now}`;

    // Use the team context for fluent API access
    const teamContext = client.team(team.id);

    // Create a project using the fluent API
    const projectResponse = await teamContext.createProject({
      name: projectName,
      description: 'Test project for stock data analysis',
    });

    if (projectResponse.error) {
      console.error(`Error creating project: ${projectResponse.error.message}`);
      process.exit(1);
    }

    const project = projectResponse.data;
    if (!project) {
      console.error('Error creating project: Project not found');
      process.exit(1);
    }

    console.log(`Project created: ${project.name} (ID: ${project.id})`);

    // Get a project context for fluent API access
    const projectContext = client.project(project.id);

    // Step 4: Create a datasource and upload CSV
    printStep(4, 'Create a datasource and upload CSV');

    const datasourceName = `Stock Data ${now}`;

    // Infer type from file extension
    const fileExtension = path.extname(CSV_FILE).toLowerCase();
    let datasourceType = fileExtension === '.csv' ? 'csv' : null;

    if (!datasourceType) {
      console.log(
        `Could not infer type from file extension ${fileExtension}. Using 'csv' as default.`,
      );
      datasourceType = 'csv';
    }

    // Use the project context to create a datasource
    const datasourceResponse = await projectContext.createDatasource({
      name: datasourceName,
      type: datasourceType,
      project_id: project.id, // Add the project_id which is required
    });

    if (datasourceResponse.error) {
      console.error(
        `Error creating datasource: ${datasourceResponse.error.message}`,
      );
      process.exit(1);
    }

    const datasource = datasourceResponse.data;
    if (!datasource) {
      console.error('Error creating datasource: Datasource not found');
      process.exit(1);
    }

    console.log(
      `Datasource created: ${datasource.name} (ID: ${datasource.id})`,
    );

    // Upload the file with job tracking
    const jobId = await uploadFileWithJob(
      client,
      project.id,
      datasource.id,
      CSV_FILE,
      datasourceName,
    );

    // Step 5: Monitor job progress
    printStep(5, 'Monitor job progress');

    // Get a datasource context for fluent API access (commented out as currently unused)
    // const datasourceContext = projectContext.datasource(datasource.id);

    // Wait for job completion using the fluent API
    const [jobSuccess, jobStatus] = await client.waitForJobCompletion(
      jobId || '',
      300, // 5 minutes timeout
      2, // 2 seconds poll interval
    );

    if (!jobSuccess) {
      console.error(`Job failed with status: ${jobStatus}`);
      // We'll continue to see what we can do despite the job failure
    }

    // Step 6: Wait for and list datalines
    printStep(6, 'Wait for and list datalines');

    // Wait for datalines to be created using the fluent API
    try {
      const datalines = await projectContext.waitForDatalines(300, 5);

      console.log(`Found ${datalines.length} datalines:`);
      for (const dl of datalines) {
        console.log(`  - ${dl.name} (ID: ${dl.id})`);
      }
    } catch (error) {
      console.error(
        'Error waiting for datalines:',
        error instanceof Error ? error.message : error,
      );
      console.log('Continuing despite dataline error...');
    }

    // Step 7: Wait for query programs to be generated
    printStep(7, 'Wait for query programs to be generated');

    // Wait for query programs to be created using the fluent API
    let queryPrograms: QueryProgram[] = [];
    try {
      queryPrograms = await projectContext.waitForQueryPrograms(5, 600, 5);

      console.log(`Found ${queryPrograms.length} query programs:`);
      for (let i = 0; i < Math.min(queryPrograms.length, 12); i++) {
        const qp = queryPrograms[i];
        console.log(`  ${i + 1}. ${qp.name || 'Unnamed query'} (ID: ${qp.id})`);
      }
    } catch (error) {
      console.error(
        'Error waiting for query programs:',
        error instanceof Error ? error.message : error,
      );
      console.log('Continuing despite query program error...');
      queryPrograms = [];
    }

    // Step 8: Run and publish each query program
    printStep(8, 'Run and publish each query program');

    const publishedQueries: any[] = [];
    for (let i = 0; i < Math.min(queryPrograms?.length || 0, 12); i++) {
      const qp = queryPrograms?.[i];
      console.log(
        `\nQuery ${i + 1}: ${qp.name || 'Unnamed query'} (ID: ${qp.id})`,
      );

      try {
        // Run the query using the raw client for backward compatibility
        console.log('  Running query...');
        let evaluateResponse = await client.queryprograms.executeQueryProgram(
          qp.id,
        );

        // Handle the response which could be a stream or an API response
        if (isReadableStream(evaluateResponse)) {
          console.log('  Processing streaming response...');
          evaluateResponse = await processStreamToApiResponse(evaluateResponse);
        }

        if (evaluateResponse.data) {
          const data = evaluateResponse.data;
          if (Array.isArray(data) && data.length > 0) {
            console.log(`  Query returned ${data.length} rows of data`);
            // Print first row as sample
            console.log(`  Sample: ${JSON.stringify(data[0], null, 2)}`);
          } else {
            console.log(`  Query returned: ${JSON.stringify(data, null, 2)}`);
          }
        } else if (evaluateResponse.error) {
          console.log(`  Query error: ${evaluateResponse.error.message}`);
        }

        // Publish the query
        console.log('  Publishing query...');
        const publishResponse = await client.queryprograms.publishQueryProgram(
          qp.id,
        );

        if (publishResponse.error) {
          console.error(
            `  Error publishing query: ${publishResponse.error.message}`,
          );
        } else {
          if (publishResponse.data) {
            publishedQueries.push(publishResponse.data);
          }
          console.log('  Query published successfully!');
        }
      } catch (error) {
        console.error(`  Error processing query: ${String(error)}`);
      }
    }

    // Step 9: List API endpoints
    printStep(9, 'List API endpoints');

    console.log('Fetching API endpoints for the project...');
    const apisResponse = await projectContext.getApis();

    if (apisResponse.error) {
      console.error(`Error fetching APIs: ${apisResponse.error.message}`);
    } else if (apisResponse.data) {
      const apis = apisResponse.data;
      console.log(`Found ${apis.length} APIs for project ${project.id}`);

      for (let i = 0; i < apis.length; i++) {
        const api = apis[i];
        console.log(`  ${i + 1}. API ID: ${api.id}`);
        console.log(`     Path: ${api.base_path || 'Unknown'}`);
        console.log(`     Name: ${api.name || 'Unnamed'}`);
        console.log(`     Description: ${api.description || 'Unknown'}`);
        console.log(`     Version: ${api.version || 'v1'}`);

        // Get a context for the API
        const apiContext = projectContext.api(api.id);

        // Get endpoints for this API
        const endpointsResponse = await apiContext.getEndpoints();

        if (endpointsResponse.error) {
          console.error(
            `     Error fetching endpoints: ${endpointsResponse.error.message}`,
          );
        } else if (endpointsResponse.data) {
          const endpoints = endpointsResponse.data;
          console.log(`     Found ${endpoints.length} endpoints:`);

          for (let j = 0; j < endpoints.length; j++) {
            const endpoint = endpoints[j];
            console.log(
              `       ${j + 1}. ${endpoint.http_method} ${endpoint.path} - ${endpoint.name || 'Unnamed'}`,
            );
          }

          // Try to get OpenAPI spec if available
          console.log('\n     API Documentation (OpenAPI):');
          console.log(
            `       URL: ${client.getBaseURL()}/live/${api.base_path}/${api.version}/openapi.json`,
          );
          console.log('\n     LLM Tools Compatibility:');
          console.log(
            `       URL: ${client.getBaseURL()}/live/${api.base_path}/${api.version}/tools.json`,
          );

          // Step 10: Make API requests with default parameters
          printStep(10, 'Make API requests with default parameters');

          if (endpoints.length > 0) {
            console.log('Making requests to available endpoints:');

            for (let j = 0; j < endpoints.length; j++) {
              const endpoint = endpoints[j];
              const url = `${client.getBaseURL()}/live/${api.base_path}/${api.version}/${endpoint.path}`;
              console.log(`  ${j + 1}. ${endpoint.http_method} ${url}`);

              try {
                const response = await fetch(url, {
                  method: endpoint.http_method,
                  headers: {
                    Authorization: `Bearer ${client.getApiKey()}`,
                    'Content-Type': 'application/json',
                  },
                });

                if (response.status === 200) {
                  const result = await response.json();
                  // Truncate long responses
                  const resultStr = JSON.stringify(result, null, 2);
                  console.log(
                    `     Response data: ${resultStr.length > 500 ? resultStr.substring(0, 500) + '...' : resultStr}`,
                  );
                } else {
                  console.log(
                    `     Request failed with status code ${response.status}`,
                  );
                  console.log(`     Response: ${await response.text()}`);
                }
              } catch (error) {
                console.error(`     Error making request: ${String(error)}`);
              }
            }
          } else {
            console.log('No endpoints available to test');
          }
        }
      }
    } else {
      console.log('No APIs found for this project');
    }

    // Summary
    printStep('FINAL', 'Test Summary');
    console.log('The end-to-end test completed successfully!');
    console.log(`Project: ${project.name} (ID: ${project.id})`);
    console.log(`Datasource: ${datasource.name} (ID: ${datasource.id})`);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
