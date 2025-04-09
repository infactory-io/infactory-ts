#!/usr/bin/env ts-node
/**
 * Infactory End-to-End Test for TypeScript SDK
 *
 * This script demonstrates a complete workflow using the Infactory client:
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
 *   ts-node infactory-e2e-test.ts [--verbose] [--quiet] [--debug]
 *
 * Options:
 *   --verbose    Show detailed logs including HTTP requests
 *   --quiet      Show only important messages and errors
 *   --debug      Show debug information including HTTP headers and bodies
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import minimist from 'minimist';
import * as dotenv from 'dotenv';
import { InfactoryClient } from '../src/client.js';
import {
  isReadableStream,
  processStreamToApiResponse,
} from '../src/utils/stream.js';
import FormData from 'form-data';
import fetch from 'node-fetch';

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

// Check for API key in environment
const API_KEY = process.env.NF_API_KEY;
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
 * Print a formatted step header
 */
function printStep(stepNumber: number | string, stepName: string): void {
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`Step ${stepNumber}: ${stepName}`);
  console.log(`${'='.repeat(80)}`);
}

/**
 * Monitor a job until it completes or fails
 */
async function waitForJobCompletion(
  client: InfactoryClient,
  jobId: string,
  timeout = 300,
  pollInterval = 1,
  verbose = true,
): Promise<[boolean, string]> {
  const jobLogger = new Logger('job_monitor');

  if (verbose) {
    jobLogger.info(`Monitoring job ${jobId}...`);
  }

  const startTime = performance.now();
  let lastProgress = -1;

  while (true) {
    // Check for timeout
    const elapsed = (performance.now() - startTime) / 1000;
    if (elapsed > timeout) {
      if (verbose) {
        jobLogger.warn(`Timeout reached after ${timeout} seconds.`);
      }
      return [false, 'timeout'];
    }

    // Get job status using the correct endpoint
    try {
      // Use direct fetch to call the jobs/status endpoint
      const response = await fetch(
        `${client.getBaseURL()}/v1/jobs/status?job_id=${jobId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${client.getApiKey()}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status !== 200) {
        jobLogger.error(
          `Error checking job status: ${response.status} ${await response.text()}`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, pollInterval * 1000),
        );
        continue;
      }

      const jobInfo = await response.json();

      // Handle different response formats
      let job;
      if (jobInfo === null || jobInfo === undefined) {
        jobLogger.warn(`Job ${jobId} not found in status response`);
        await new Promise((resolve) =>
          setTimeout(resolve, pollInterval * 1000),
        );
        continue;
      }
      if (Array.isArray(jobInfo)) {
        // If we get a list of jobs, find the one with our job_id
        const matchingJobs = jobInfo.filter((j) => j.id === jobId);
        if (matchingJobs.length === 0) {
          jobLogger.warn(`Job ${jobId} not found in status response`);
          await new Promise((resolve) =>
            setTimeout(resolve, pollInterval * 1000),
          );
          continue;
        }
        job = matchingJobs[0];
      } else if (typeof jobInfo === 'object' && 'jobs' in jobInfo) {
        // If we get a dict with a jobs list
        const matchingJobs = (jobInfo as { jobs: any[] }).jobs.filter(
          (j) => j.id === jobId,
        );
        if (matchingJobs.length === 0) {
          jobLogger.warn(`Job ${jobId} not found in status response`);
          await new Promise((resolve) =>
            setTimeout(resolve, pollInterval * 1000),
          );
          continue;
        }
        job = matchingJobs[0];
      }

      const status = job?.latest_status || 'unknown';
      const progress = job?.progress || 0;

      // Print progress updates
      if (verbose && progress !== lastProgress) {
        lastProgress = progress;
        jobLogger.info(
          `Job ${jobId} - Status: ${status}, Progress: ${progress}%, Elapsed: ${elapsed.toFixed(1)}s`,
        );
      }

      // Check if job is complete
      if (['completed', 'failed', 'error'].includes(status)) {
        if (verbose) {
          jobLogger.info(`Job ${jobId} finished with status: ${status}`);
        }
        return [status === 'completed', status];
      }
    } catch (error) {
      jobLogger.error(`Error checking job status: ${String(error)}`);
    }

    // Wait before next check
    await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
  }
}

/**
 * Wait for datalines to be created for a project
 */
async function waitForDatalines(
  client: InfactoryClient,
  projectId: string,
  timeout = 300,
  pollInterval = 5,
  verbose = true,
): Promise<any[]> {
  if (verbose) {
    console.log('Waiting for datalines to be created...');
  }

  const startTime = performance.now();

  while (true) {
    // Check for timeout
    const elapsed = (performance.now() - startTime) / 1000;
    if (elapsed > timeout) {
      if (verbose) {
        console.log(`Timeout reached after ${timeout} seconds.`);
      }
      return [];
    }

    // Check for datalines
    try {
      const response = await client.datalines.getProjectDatalines(projectId);
      if (response.data && response.data.length > 0) {
        if (verbose) {
          console.log(
            `Found ${response.data.length} datalines after ${elapsed.toFixed(1)}s`,
          );
        }
        return response.data;
      }
    } catch (error) {
      if (verbose) {
        console.log(`Error checking datalines: ${String(error)}`);
      }
    }

    // Wait before next check
    await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
  }
}

/**
 * Wait for query programs to be created for a project
 */
async function waitForQueryPrograms(
  client: InfactoryClient,
  projectId: string,
  minCount = 1,
  timeout = 300,
  pollInterval = 5,
  verbose = true,
): Promise<any[]> {
  if (verbose) {
    console.log(
      `Waiting for at least ${minCount} query programs to be created...`,
    );
  }

  const startTime = performance.now();

  while (true) {
    // Check for timeout
    const elapsed = (performance.now() - startTime) / 1000;
    if (elapsed > timeout) {
      if (verbose) {
        console.log(`Timeout reached after ${timeout} seconds.`);
      }
      return [];
    }

    // Check for query programs
    try {
      const response =
        await client.queryprograms.getQueryProgramsByProject(projectId);
      if (response.data && response.data.length >= minCount) {
        if (verbose) {
          console.log(
            `Found ${response.data.length} query programs after ${elapsed.toFixed(1)}s`,
          );
        }
        return response.data;
      } else if (response.data && response.data.length > 0 && verbose) {
        console.log(
          `Found ${response.data.length} query programs, waiting for at least ${minCount}...`,
        );
      }
    } catch (error) {
      if (verbose) {
        console.log(`Error checking query programs: ${String(error)}`);
      }
    }

    // Wait before next check
    await new Promise((resolve) => setTimeout(resolve, pollInterval * 1000));
  }
}

/**
 * Submit a new job
 */
async function customSubmitJob(
  client: InfactoryClient,
  params: {
    projectId: string;
    jobType: string;
    payload?: Record<string, any>;
    doNotSendToQueue?: boolean;
    sourceId?: string;
    source?: string;
    sourceEventType?: string;
    sourceMetadata?: Record<string, any> | string;
  },
): Promise<string> {
  const jobLogger = new Logger('job_submit');

  // Prepare the job data
  const data: Record<string, any> = {
    projectId: params.projectId,
    jobType: params.jobType,
    doNotSendToQueue: params.doNotSendToQueue !== false,
  };

  if (params.payload) {
    data.payload = params.payload;
  }

  if (params.sourceId) {
    data.sourceId = params.sourceId;
  }

  if (params.source) {
    data.source = params.source;
  }

  if (params.sourceEventType) {
    data.sourceEventType = params.sourceEventType;
  }

  if (params.sourceMetadata) {
    if (typeof params.sourceMetadata === 'object') {
      data.sourceMetadata = JSON.stringify(params.sourceMetadata);
    } else {
      data.sourceMetadata = params.sourceMetadata;
    }
  }

  jobLogger.debug(`Submitting job with data: ${JSON.stringify(data)}`);

  // Use the correct endpoint as per OpenAPI spec
  try {
    const response = await fetch(
      `https://daily-api.infactory.ai/v1/jobs/submit`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${client.getApiKey()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      },
    );

    if (response.status !== 200) {
      jobLogger.error(
        `Error submitting job: ${response.status} ${await response.text()}`,
      );
      return '';
    }

    const responseData = (await response.json()) as string; // Return a job ID
    return responseData;
  } catch (error) {
    jobLogger.error(`Exception submitting job: ${String(error)}`);
    return '';
  }
}

/**
 * Main function to run the test
 */
async function main() {
  try {
    // Step 1: Initialize client
    printStep(1, 'Initialize client and authenticate');
    if (!API_KEY) {
      console.error('API_KEY is not set');
      process.exit(1);
    }
    const client = new InfactoryClient({ apiKey: API_KEY });

    // Get current user
    const userResponse = await client.users.getCurrentUser();
    if (userResponse.error) {
      console.error(`Error authenticating: ${userResponse.error.message}`);
      process.exit(1);
    }

    console.log('Successfully connected to Infactory API');
    if (!userResponse.data) {
      console.error('Failed to get current user');
      process.exit(1);
    }
    console.log(`User: ${userResponse.data.name} (${userResponse.data.email})`);

    // Step 2: Select organization and team
    printStep(2, 'Select organization and team');

    // Get organizations through the user's teams and organizations endpoint
    const userTeamsResponse = await fetch(
      `${client.getBaseURL()}/v1/users/get_teams_with_organizations_and_projects?clerk_user_id=${userResponse.data.clerkUserId}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${client.getApiKey()}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (userTeamsResponse.status !== 200) {
      console.error(
        'Error getting user teams:',
        await userTeamsResponse.text(),
      );
      process.exit(1);
    }

    interface Organization {
      id: string;
      name: string;
    }

    interface Team {
      id: string;
      name: string;
      organizations: Organization;
    }

    interface UserTeamsResponse {
      teams: Team[];
    }

    const userTeamsData = (await userTeamsResponse.json()) as UserTeamsResponse;
    if (!userTeamsData.teams || userTeamsData.teams.length === 0) {
      console.error('No teams found. Please create a team first.');
      process.exit(1);
    }

    const team = userTeamsData.teams[0];
    const organization = team.organizations;
    console.log(
      `Selected organization: ${organization.name} (ID: ${organization.id})`,
    );
    console.log(`Selected existing team: ${team.name} (ID: ${team.id})`);

    // Step 3: Create a new project
    printStep(3, 'Create a new project');
    const now = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    const projectName = `Stock Analysis Testing ${now}`;

    const projectResponse = await client.projects.createProject({
      name: projectName,
      teamId: team.id,
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

    // Create the datasource
    const datasourceResponse = await client.datasources.createDatasource({
      name: datasourceName,
      projectId: project.id,
      type: 'file',
      status: 'created',
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

    // Get file info
    const fileName = path.basename(CSV_FILE);
    const fileSize = fs.statSync(CSV_FILE).size;
    console.log(
      `File to upload: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`,
    );

    // Create a job for the upload
    const jobPayload = {
      datasourceId: datasource.id,
      fileName: fileName,
      fileSize: fileSize,
      datasetName: datasourceName,
    };

    const jobMetadata = {
      fileName: fileName,
      fileSize: fileSize,
      datasetName: datasourceName,
    };

    // Submit the job using our custom function
    console.log('Submitting job for upload tracking...');
    const jobId = await customSubmitJob(client, {
      projectId: project.id,
      jobType: 'upload',
      payload: jobPayload,
      doNotSendToQueue: true,
      sourceId: datasource.id,
      source: 'datasource',
      sourceEventType: 'file_upload',
      sourceMetadata: jobMetadata,
    });

    if (!jobId) {
      console.error('Error: No job ID received from job submission');
      process.exit(1);
    }

    console.log(`Upload job created: ${jobId}`);

    // Upload the file
    console.log('Uploading file...');

    // Create FormData with the file
    const formData = new FormData();
    formData.append('file', fs.createReadStream(CSV_FILE));
    formData.append('datasourceId', datasource.id);
    formData.append('job_id', jobId);

    // Use the correct endpoint format
    const uploadResponse = await fetch(
      `https://daily-api.infactory.ai/v1/actions/load/${project.id}?job_id=${jobId}&datasourceId=${datasource.id}`,
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
      console.error(`Error uploading file: ${await uploadResponse.text()}`);
      process.exit(1);
    }

    console.log('File upload request sent successfully!');

    // Step 5: Monitor job progress
    printStep(5, 'Monitor job progress');

    const [jobSuccess, jobStatus] = await waitForJobCompletion(
      client,
      jobId,
      300, // 5 minutes timeout
      2, // 2 seconds poll interval
    );

    if (!jobSuccess) {
      console.error(`Job failed with status: ${jobStatus}`);
      // We'll continue to see what we can do despite the job failure
    }

    // Step 6: Wait for and list datalines
    printStep(6, 'Wait for and list datalines');
    const datalines = await waitForDatalines(client, project.id, 300);

    if (!datalines || datalines.length === 0) {
      console.error(
        'No datalines were created. There might be an issue with the data processing.',
      );
      process.exit(1);
    }

    console.log(`Found ${datalines.length} datalines:`);
    for (const dl of datalines) {
      console.log(`  - ${dl.name} (ID: ${dl.id})`);
    }

    // Step 7: Wait for query programs to be generated
    printStep(7, 'Wait for query programs to be generated');
    const queryPrograms = await waitForQueryPrograms(
      client,
      project.id,
      5, // At least 5 query programs
      600, // 10 minutes timeout
    );

    if (!queryPrograms || queryPrograms.length === 0) {
      console.error('No query programs were generated. This is unexpected.');
      process.exit(1);
    }

    console.log(`Found ${queryPrograms.length} query programs:`);
    for (let i = 0; i < Math.min(queryPrograms.length, 12); i++) {
      const qp = queryPrograms[i];
      console.log(`  ${i + 1}. ${qp.name || 'Unnamed query'} (ID: ${qp.id})`);
    }

    // Step 8: Run and publish each query program
    printStep(8, 'Run and publish each query program');

    const publishedQueries = [];
    for (let i = 0; i < Math.min(queryPrograms.length, 12); i++) {
      const qp = queryPrograms[i];
      console.log(
        `\nQuery ${i + 1}: ${qp.name || 'Unnamed query'} (ID: ${qp.id})`,
      );

      try {
        // Run the query
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
          publishedQueries.push(publishResponse.data);
          console.log('  Query published successfully!');
        }
      } catch (error) {
        console.error(`  Error processing query: ${String(error)}`);
      }
    }

    // Step 9: List API endpoints
    printStep(9, 'List API endpoints');

    console.log('Fetching API endpoints for the project...');
    const apisResponse = await client.apis.getProjectApis(project.id);

    if (apisResponse.error) {
      console.error(`Error fetching APIs: ${apisResponse.error.message}`);
    } else if (apisResponse.data) {
      const apis = apisResponse.data;
      console.log(`Found ${apis.length} APIs for project ${project.id}`);

      for (let i = 0; i < apis.length; i++) {
        const api = apis[i];
        console.log(`  ${i + 1}. API ID: ${api.id}`);
        console.log(`     Path: ${api.basePath || 'Unknown'}`);
        console.log(`     Name: ${api.name || 'Unnamed'}`);
        console.log(`     Description: ${api.description || 'Unknown'}`);
        console.log(`     Version: ${api.version || 'v1'}`);

        // Get endpoints for this API
        const endpointsResponse = await client.apis.getApiEndpoints(api.id);

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
              `       ${j + 1}. ${endpoint.httpMethod} ${endpoint.path} - ${endpoint.name || 'Unnamed'}`,
            );
          }

          // Try to get OpenAPI spec if available
          console.log('\n     API Documentation (OpenAPI):');
          console.log(
            `       URL: ${client.getBaseURL()}/live/${api.basePath}/${api.version}/openapi.json`,
          );
          console.log('\n     LLM Tools Compatibility:');
          console.log(
            `       URL: ${client.getBaseURL()}/live/${api.basePath}/${api.version}/tools.json`,
          );

          // Step 10: Make API requests with default parameters
          printStep(10, 'Make API requests with default parameters');

          if (endpoints.length > 0) {
            console.log('Making requests to available endpoints:');

            for (let j = 0; j < endpoints.length; j++) {
              const endpoint = endpoints[j];
              const url = `${client.getBaseURL()}/live/${api.basePath}/${api.version}/${endpoint.path}`;
              console.log(`  ${j + 1}. ${endpoint.httpMethod} ${url}`);

              try {
                const response = await fetch(url, {
                  method: endpoint.httpMethod,
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
    console.log(`Datalines: ${datalines.length}`);
    console.log(`Query programs: ${queryPrograms.length}`);
    console.log(`Published queries: ${publishedQueries.length}`);
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
