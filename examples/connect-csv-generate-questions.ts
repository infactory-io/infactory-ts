import { InfactoryClient } from '../src/client.js';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const NF_API_KEY = process.env.NF_API_KEY || '';
const NF_BASE_URL = process.env.NF_BASE_URL || 'http://localhost:8000';

if (!NF_API_KEY) {
  console.error('Error: NF_API_KEY environment variable is required.');
  process.exit(1);
}

/**
 * Example demonstrating how to:
 * 1. Create a new project
 * 2. Connect a CSV file using ActionsClient
 * 3. Generate questions based on the data
 */
async function main() {
  try {
    // Initialize the Infactory client
    const client = new InfactoryClient({
      apiKey: NF_API_KEY,
      baseURL: NF_BASE_URL,
    });

    // First, get organizations
    console.info('Fetching available organizations...');
    const orgsResponse = await client.organizations.list();

    if (orgsResponse.error || !orgsResponse.data?.length) {
      throw new Error(
        `Failed to fetch organizations: ${orgsResponse.error?.message || 'No organizations available'}`,
      );
    }

    const organization = orgsResponse.data[0]; // Use the first available organization
    console.info(
      `Using organization: ${organization.name} (${organization.id})`,
    );

    // Now get teams for this organization
    console.info('Fetching available teams...');
    const teamsResponse = await client.teams.getTeams(organization.id);

    if (teamsResponse.error || !teamsResponse.data?.length) {
      throw new Error(
        `Failed to fetch teams: ${teamsResponse.error?.message || 'No teams available'}`,
      );
    }

    const team = teamsResponse.data[0]; // Use the first available team
    console.info(`Using team: ${team.name} (${team.id})`);

    console.info('Creating a new project...');
    // Step 1: Create a new project
    const projectResponse = await client.projects.createProject({
      name: `Mental Health Data Analysis ${new Date().toISOString()}`,
      description: 'Analyzing mental health data using CSV',
      teamId: team.id, // Use the ID of the first team
    });

    if (projectResponse.error || !projectResponse.data) {
      throw new Error(
        `Failed to create project: ${JSON.stringify(projectResponse.error)}`,
      );
    }

    const project = projectResponse.data;
    console.info(
      `Project created successfully: ${project.name} (${project.id})`,
    );

    // Step 2: Connect the CSV file using the ActionsClient
    console.info('\nConnecting CSV file...');
    const csvFilePath = path.resolve(
      process.env.HOME || '~',
      'Downloads/Mental_Health_Care_in_the_Last_4_Weeks.csv',
    );

    const connectResponse = await client.datasources.uploadCsvFile(
      project.id,
      csvFilePath,
      'Mental Health Data',
    );

    if (connectResponse.error || !connectResponse.data) {
      throw new Error(
        `Failed to connect CSV file: ${connectResponse.error?.message}`,
      );
    }

    const dataSource = connectResponse.datasource;
    const uploadResponse = connectResponse.uploadResponse;

    console.info(
      `CSV file connected successfully: ${dataSource.name} (${dataSource.id})`,
    );
    console.info(
      `Upload response status: ${uploadResponse.status} ${uploadResponse.statusText}`,
    );

    // Check for message and jobId based on the test result type
    if (!uploadResponse.ok) {
      throw new Error(
        `File upload failed with status ${uploadResponse.status}: ${uploadResponse.statusText}`,
      );
    }

    // Step 3: Generate questions based on the data
    console.info('\nGenerating questions from the data...');

    const questionsResponse = await client.generate.generateQuestions({
      projectId: project.id,
      // Note: The API supports using datasources even if not in the TypeScript interface
      // If this doesn't work in practice, we might need to use previousQuestions instead
      count: 5, // Request 5 questions
    });

    if (questionsResponse.error || !questionsResponse.data) {
      throw new Error(
        `Failed to generate questions: ${questionsResponse.error?.message}`,
      );
    }

    const questions = questionsResponse.data.questions;
    console.info('\nGenerated Questions:');
    questions.forEach((question, index) => {
      console.info(`${index + 1}. ${question}`);
    });

    console.info('\nExample completed successfully!');
  } catch (error) {
    console.error('Error in example:', error);
    process.exit(1);
  }
}

// Run the example
main();
