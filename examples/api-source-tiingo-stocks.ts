import { InfactoryClient } from '../src/client.js';
import { ConnectOptions } from '../src/types/common.js';
import { HttpMethod } from '../src/clients/integrations-client.js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get API key from environment variable
const apiKey = process.env.NF_API_KEY;
if (!apiKey) {
  console.error('Error: NF_API_KEY environment variable is not set');
  process.exit(1);
}

if (!process.env.TIINGO_API_KEY) {
  console.error('Error: TIINGO_API_KEY environment variable is not set');
  process.exit(1);
}

// Get base URL from environment variable or use default
const baseURL = process.env.NF_BASE_URL || 'https://api.infactory.ai';
console.info(`Using API base URL: ${baseURL}`);

// Initialize the InfactoryClient with your API token
const client = new InfactoryClient({
  apiKey: apiKey,
  baseURL: baseURL,
});

/**
 * Example script to connect to Tiingo Stock API
 * This script demonstrates using connectAPI to establish a connection to the Tiingo API
 * and retrieve historical stock prices for Apple (AAPL)
 */
async function main(projectId: string, apiKey: string, ticker: string) {
  try {
    console.info('Connecting to Tiingo Stock API...');

    // Define the ticker symbol

    // Prepare connection options for Tiingo API
    const connectOptions: ConnectOptions = {
      // Target API details (Tiingo API)
      url: `https://api.tiingo.com/tiingo/daily/${ticker}/prices`,
      method: 'GET' as HttpMethod,

      // Headers for the API request
      headers: {
        'Content-Type': 'application/json',
      },

      // Use authentication via query parameter
      authType: 'API Key',
      authConfig: {
        apiKey: {
          value: apiKey,
          name: 'token', // The name of the query parameter
          location: 'query',
        },
      },

      // Query parameters for the API request
      parameters: {
        startDate: '2019-01-02',
        // We're not specifying endDate, so it will default to the latest date
      },

      // Infactory platform details
      projectId: projectId,
      connectionName: `Tiingo Historical Prices - ${ticker}`,
    };

    // Call the connectAPI method to establish the connection
    const result = await client.actions.connectAPI(connectOptions);

    // Check if the connection was successful
    console.info('result', result);
    if (result.success) {
      console.info('Successfully connected to Tiingo API');
      console.info(`Datasource ID: ${result.datasourceId}`);

      if (result.testResult) {
        console.info('\nConnection Test Results:');
        console.info(`Response Time: ${result.testResult.responseTime}ms`);
        console.info(`Content Type: ${result.testResult.contentType}`);

        // Print a sample of the data (first 2 records)
        if (result.testResult.data && Array.isArray(result.testResult.data)) {
          console.info('\nSample Data (first 2 records):');
          console.info(
            JSON.stringify(result.testResult.data.slice(0, 2), null, 2),
          );
        }
      }

      if (result.jobs && result.jobs.length > 0) {
        console.info('\nJobs Created:');
        result.jobs.forEach((job) => {
          console.info(
            `- Job ID: ${job.id}, Type: ${job.job_type}, Status: ${job.status}`,
          );
        });
      }
    } else {
      console.error('Failed to connect to Tiingo API');
      console.error('Steps completed:', result.stepsCompleted);
      console.error('Errors:');
      result.errors.forEach((error) => {
        console.error(`- ${error.step}: ${error.error}`);
      });
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the main function
const project = await client.projects.createProject({
  name: 'Test API TIINGO STOCKS',
  description: 'GET Stocks',
});
if (project.error) {
  console.error('Failed to create project:', project.error);
  process.exit(1);
}

if (!project.data) {
  console.error('Failed to create project: No project data returned');
  process.exit(1);
}

main(project.data.id, process.env.TIINGO_API_KEY, 'AAPL').catch(console.error);
