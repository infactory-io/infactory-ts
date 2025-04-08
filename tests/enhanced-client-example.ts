/**
 * Example usage of the enhanced Infactory client
 */

import { EnhancedInfactoryClient } from '../src/enhanced-client.js';

async function main() {
  // Initialize the enhanced client
  const client = new EnhancedInfactoryClient({
    apiKey: 'your-api-key',
    // Optional custom base URL
    // baseURL: 'https://api.infactory.io',
  });

  // Example 1: Creating a project with method chaining
  const project = await client.createProject({
    name: 'Stock Analysis',
    team_id: 'ba86d606-7445-40fb-bbc1-9c9c22c2d7e7', // Using team ID from memory
    description: 'Analysis of stock market data',
  });

  // Upload the CSV file as a datasource
  await project.uploadCSV('./tests/stocks.csv', 'Stock Prices');

  // Generate queries based on the data
  await project.generateQueries();

  // Example 2: Working with existing projects
  // Using project ID from memory
  const demoProject = client.project('f0297a11-1f28-44e9-9c22-ef1d3d778c77');

  // Get all datasources in the project
  const datasourcesResponse = await demoProject.getDatasources();
  console.log(`Found ${datasourcesResponse.data?.length} datasources`);

  // Example 3: Using the fluent interface for complex operations
  // Using datasource ID from memory
  await client
    .project('f0297a11-1f28-44e9-9c22-ef1d3d778c77')
    .datasource('679d4733-7c26-454f-9110-d96989ab8609')
    .createQueryProgram()
    .withQuestion('What was the average stock price?')
    .withName('Average Stock Price Analysis')
    .execute();

  // Example 4: Creating a project with CSV in one operation
  const newProject = await client.createProjectWithCSV(
    {
      name: 'Market Analysis 2025',
      team_id: 'ba86d606-7445-40fb-bbc1-9c9c22c2d7e7',
      description: 'Comprehensive analysis of market trends',
    },
    './tests/stocks.csv',
    'Market Data',
  );

  // Use newProject to demonstrate the response structure
  // ProjectContext requires using get() to access project details
  const projectDetails = await newProject.get();
  console.log(`Created project with name: ${projectDetails.data?.name}`);
  console.log('Created new project and uploaded CSV in a single operation');
}

main().catch(console.error);
