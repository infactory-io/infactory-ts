// examples/evaluate-queryprogram-example.ts
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

// Project ID and query program ID to evaluate
const projectId = '51748cd5-da55-437e-a707-947d972cf9e4';

/**
 * Main function to demonstrate query program evaluation
 */
async function evaluateQueryProgramExample() {
  try {
    console.info('=== Query Program Evaluation Example ===');

    // Step 1: List query programs to find one to evaluate
    console.info('\n1. Listing query programs for the project:');
    const queryProgramsResponse = await client.queryPrograms.listQueryPrograms({
      projectId,
    });

    if (queryProgramsResponse.error) {
      console.error(
        'Error listing query programs:',
        queryProgramsResponse.error,
      );
      return;
    }

    if (
      !queryProgramsResponse.data ||
      queryProgramsResponse.data.length === 0
    ) {
      console.error('No query programs found for this project.');
      return;
    }

    // Display the query programs
    console.info(`Found ${queryProgramsResponse.data.length} query programs:`);
    queryProgramsResponse.data.forEach((qp, index) => {
      console.info(
        `${index + 1}. ${qp.name || 'Unnamed'} (ID: ${qp.id}) - Published: ${qp.published ? 'Yes' : 'No'}`,
      );
    });

    // Select the first published query program for evaluation
    const publishedQueryProgram = queryProgramsResponse.data.find(
      (qp) => qp.published,
    );
    if (!publishedQueryProgram) {
      console.error(
        'No published query programs found. Please publish a query program first.',
      );
      return;
    }

    const queryProgramId = publishedQueryProgram.id;
    console.info(
      `\nUsing query program: ${publishedQueryProgram.name || 'Unnamed'} (ID: ${queryProgramId})`,
    );

    // Step 2: Analyze the query program to get its graph representation
    console.info('\n2. Analyzing query program graph representation');

    try {
      const graphResponse = await client.queryPrograms.analyzeQueryProgram(
        projectId,
        queryProgramId,
      );

      if (graphResponse.error) {
        console.error('Error analyzing query program:', graphResponse.error);
      } else {
        console.info('Graph analysis successful:');
        console.info(`- Nodes: ${graphResponse.data?.nodes?.length || 0}`);
        console.info(`- Edges: ${graphResponse.data?.edges?.length || 0}`);
      }
    } catch (error) {
      console.error('Unexpected error during graph analysis:', error);
      throw new Error(error as string);
    }

    // Step 3: Evaluate the query program synchronously
    console.info('\n3. Evaluating query program synchronously:');
    if (!queryProgramId) {
      console.error(
        'Error evaluating query program: Query Program ID is undefined',
      );
      return;
    }
    try {
      const evalResponse = await client.run.evaluateQueryProgram({
        projectId,
        queryprogramId: queryProgramId,
      });

      if (evalResponse.error) {
        console.error('Error evaluating query program:', evalResponse.error);
      } else {
        console.info('Evaluation successful:');
        console.info(JSON.stringify(evalResponse.data, null, 2));
      }
    } catch (error) {
      console.error('Unexpected error during evaluation:', error);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the example
evaluateQueryProgramExample()
  .then(() => console.info('\nExample completed'))
  .catch((error) => console.error('Fatal error:', error));
