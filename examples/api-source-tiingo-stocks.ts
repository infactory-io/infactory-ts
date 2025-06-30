import { InfactoryClient } from '../src/client.js';
import { TestHttpConnectionRequest } from '../src/clients/integrations-client.js';
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
async function main(apiKey: string, ticker: string) {
  try {
    console.info('Connecting to Tiingo Stock API...');

    // Define the ticker symbol

    // Prepare connection options for Tiingo API
    const connectOptions: TestHttpConnectionRequest = {
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
    };

    // Call the testHttpConnection method to establish the connection
    const result = await client.integrations.testHttpConnection(connectOptions);

    // Check if the connection was successful
    console.info('result', result);
    if (result.data?.success) {
      console.info('Successfully connected to Tiingo API');

      if (result.data) {
        console.info('\nConnection Test Results:');
        console.info(`Response Time: ${result.data.responseTime}ms`);
        console.info(`Content Type: ${result.data.contentType}`);

        // Print a sample of the data (first 2 records)
        if (result.data.data && Array.isArray(result.data.data)) {
          console.info('\nSample Data (first 2 records):');
          console.info(JSON.stringify(result.data.data.slice(0, 2), null, 2));
        }
      }
    } else {
      console.error('Failed to connect to Tiingo API');
      if (result.error) {
        console.error('Error details:', result.error);
      }
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

main(process.env.TIINGO_API_KEY, 'AAPL').catch(console.error);
