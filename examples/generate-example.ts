/**
 * Example demonstrating the usage of the GenerateClient in the Infactory SDK
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { InfactoryClient } from '../src/client.js';

// Load environment variables from .env file
config();

// Get the directory name of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize the Infactory client with API key from environment variables
const apiKey = process.env.NF_API_KEY || '';
console.log(
  `Using API key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 4)}`,
);

const client = new InfactoryClient({
  apiKey,
  baseURL: process.env.NF_BASE_URL,
});

/**
 * Main function to demonstrate the GenerateClient capabilities
 */
async function main() {
  try {
    console.log('🚀 Demonstrating GenerateClient capabilities');

    // List projects to get a valid project ID
    console.log('\n📋 Listing projects to get a valid project ID...');
    const projectsResponse = await client.projects.getProjects();

    if (!projectsResponse.data || projectsResponse.data.length === 0) {
      console.error('❌ No projects found. Please create a project first.');
      return;
    }

    const projectId = projectsResponse.data[0].id;
    console.log(
      `✅ Using project: ${projectsResponse.data[0].name} (${projectId})`,
    );

    // Example 1: Generate questions based on project context
    console.log('\n🤔 Generating questions based on project context...');
    try {
      const questionsResponse = await client.generate.generateQuestions({
        projectId,
        count: 3,
      });

      console.log('Response:', questionsResponse);

      if (questionsResponse.data) {
        console.log('✅ Generated questions:');
        questionsResponse.data.questions.forEach((question, index) => {
          console.log(`   ${index + 1}. ${question}`);
        });
      } else if (questionsResponse.error) {
        console.error(
          `❌ Error generating questions: ${questionsResponse.error.message}`,
        );
        console.error(
          'Error details:',
          JSON.stringify(questionsResponse.error, null, 2),
        );
      }
    } catch (error) {
      console.error('❌ Unexpected error generating questions:', error);
    }

    // Example 2: Generate a query program from natural language
    console.log('\n📊 Generating a query program from natural language...');
    let queryProgramResponse: any | undefined;
    try {
      queryProgramResponse = await client.generate.generateQueryProgram({
        projectId,
        naturalLanguageQuery: 'Show me the top 5 products by sales revenue',
      });

      console.log('Response:', JSON.stringify(queryProgramResponse, null, 2));
    } catch (error) {
      console.error('❌ Unexpected error generating query program:', error);
    }

    if (queryProgramResponse?.data) {
      console.log(
        `✅ Generated query program: ${queryProgramResponse.data.name}`,
      );
      console.log(`   ID: ${queryProgramResponse.data.id}`);
      console.log(
        `   Code snippet: ${queryProgramResponse.data.queryProgram?.substring(0, 100)}...`,
      );
    } else if (queryProgramResponse.error) {
      console.error(
        `❌ Error generating query program: ${queryProgramResponse.error.message}`,
      );
    }

    // Example 3: Generate a data model
    console.log('\n🏗️ Generating a data model...');
    const dataModelResponse = await client.generate.generateDataModel({
      projectId,
      description:
        'A customer order system with products, customers, and orders',
    });

    if (dataModelResponse.data) {
      console.log(`✅ Generated data model: ${dataModelResponse.data.title}`);
      console.log('   Properties:');
      Object.keys(dataModelResponse.data.properties).forEach((prop) => {
        console.log(`     - ${prop}`);
      });
    } else if (dataModelResponse.error) {
      console.error(
        `❌ Error generating data model: ${dataModelResponse.error.message}`,
      );
    }

    // Example 4: Generate knowledge entity links
    console.log('\n🔗 Generating knowledge entity links...');
    const entityLinkResponse =
      await client.generate.generateKnowledgeEntityLink({
        projectId,
        text: 'Apple released a new iPhone model with improved camera features.',
      });

    if (entityLinkResponse.data) {
      console.log('✅ Generated entity links:');
      console.log(`   Text: ${entityLinkResponse.data.text}`);
      console.log('   Entities:');
      entityLinkResponse.data.entities.forEach((entity) => {
        console.log(`     - ${entity.name} (${entity.type})`);
      });
    } else if (entityLinkResponse.error) {
      console.error(
        `❌ Error generating entity links: ${entityLinkResponse.error.message}`,
      );
    }

    console.log('\n✨ GenerateClient demonstration completed!');
  } catch (error) {
    console.error('❌ An unexpected error occurred:', error);
  }
}

// Run the main function
main().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
