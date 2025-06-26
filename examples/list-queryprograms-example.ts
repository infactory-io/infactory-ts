// examples/list-queryprograms-example.ts
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
console.info(`Using API base URL: ${baseURL}`);

// Create a new instance of the InfactoryClient
const client = new InfactoryClient({
  apiKey: apiKey,
  baseURL: baseURL,
});

// Project ID to list query programs for
const projectId = '51748cd5-da55-437e-a707-947d972cf9e4';

/**
 * Main function to list query programs
 */
async function listQueryPrograms() {
  try {
    console.info(`Listing query programs for project ID: ${projectId}`);

    // Call the listQueryPrograms method
    const response = await client.queryPrograms.listQueryPrograms({
      projectId,
    });

    if (response.error) {
      console.error('Error listing query programs:', response.error);
      return;
    }

    // Display the results
    console.info(`Found ${response.data?.length || 0} query programs:`);
    if (response.data && response.data.length > 0) {
      response.data.forEach((qp, index) => {
        console.info(
          `${index + 1}. ${qp.name || 'Unnamed'} (ID: ${qp.id}) - Published: ${qp.published ? 'Yes' : 'No'}`,
        );
      });
    } else {
      console.info('No query programs found for this project.');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the function
listQueryPrograms()
  .then(() => console.info('\nExample completed'))
  .catch((error) => console.error('Fatal error:', error));
