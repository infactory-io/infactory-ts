/**
 * Enhanced Features Example
 *
 * This example demonstrates the new features added to the Infactory SDK including:
 * - Authentication Manager
 * - Knowledge Graph API
 * - Chat Integrations API
 * - MCP Resource
 * - Enhanced Error Handling
 * - Streaming Event Processing
 */

import {
  InfactoryClient,
  AuthManager,
  isReadableStream,
} from '../src/index.js';

// We don't need the processEventStream import since we're manually handling the stream

// Configuration - replace with your actual API key
const API_KEY = process.env.NF_API_KEY || 'your-api-key-here';

// Create an authentication manager
const authManager = new AuthManager({
  apiKey: API_KEY,
});

// Create an Infactory client with the auth manager
const client = new InfactoryClient({
  authManager,
});

async function run() {
  try {
    // Check authentication status
    if (!authManager.isAuthenticated()) {
      throw new Error('Not authenticated. Please check your API key.');
    }

    console.info('Authentication successful!');

    // Get current user information using MCP resource
    const userResponse = await client.mcpResource.getCurrentUser();
    if (isReadableStream(userResponse)) {
      console.info('Current user: [Stream response]');
    } else {
      console.info('Current user:', userResponse.data);
    }

    // List projects using MCP resource
    const projectsResponse = await client.mcpResource.listProjects();
    if (isReadableStream(projectsResponse)) {
      console.info('Found projects: [Stream response]');
    } else {
      console.info(`Found ${projectsResponse.data?.length ?? 0} projects`);
    }

    // Only proceed if we have project data (not a stream) and at least one project
    if (
      !isReadableStream(projectsResponse) &&
      projectsResponse.data &&
      projectsResponse.data.length > 0
    ) {
      // Since we've already checked data exists and has length > 0, we can safely assert it's not undefined
      const projectId = projectsResponse.data[0].id;
      console.info(`Using project ID: ${projectId}`);

      // List query programs for the project
      const queryProgramsResponse =
        await client.mcpResource.listQueryPrograms(projectId);
      if (isReadableStream(queryProgramsResponse)) {
        console.info('Found query programs: [Stream response]');
      } else {
        console.info(
          `Found ${queryProgramsResponse.data?.length ?? 0} query programs`,
        );
      }

      // Create a knowledge graph (if you have permissions)
      try {
        const createKgResponse =
          await client.knowledgeGraph.createKnowledgeGraph({
            name: 'Example Knowledge Graph',
            description: 'Created via SDK example',
            projectId: projectId,
          });

        console.info('Created knowledge graph:', createKgResponse.data);

        // List knowledge graphs
        const kgListResponse = await client.knowledgeGraph.listKnowledgeGraphs({
          projectId: projectId,
        });
        console.info(
          `Project has ${kgListResponse.data?.length ?? 0} knowledge graphs`,
        );
      } catch (error) {
        // Check if error is an object with a message property
        if (error && typeof error === 'object' && 'message' in error) {
          console.error(
            'Validation error when creating knowledge graph:',
            (error as Error).message,
          );

          // Check if it has an errors property
          if ('errors' in error) {
            console.error('Validation details:', (error as any).errors);
          }
        } else {
          console.error('Error creating knowledge graph:', String(error));
        }
      }

      // Execute a query program with streaming if available
      if (
        !isReadableStream(queryProgramsResponse) &&
        queryProgramsResponse.data &&
        queryProgramsResponse.data.length > 0
      ) {
        // Since we've already checked data exists and has length > 0, we can safely assert it's not undefined
        const queryProgramId = queryProgramsResponse.data[0].id;
        console.info(`Executing query program: ${queryProgramId}`);

        try {
          const result = await client.queryprograms.executeQueryProgram(
            queryProgramId,
            {
              stream: true,
              maxTokens: 1000,
              timeout: 30000,
            },
          );

          if (isReadableStream(result)) {
            console.info('Received streaming response, processing events:');

            // Process events from the stream manually since we can't use for await
            const reader = result.getReader();

            // Manual reading of the stream
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                // Process the chunk
                const chunk = new TextDecoder().decode(value);
                console.info('Received chunk:', chunk);

                // Here you would normally parse and handle events
                // For simplicity, we're just logging the raw chunks
              }
            } finally {
              reader.releaseLock();
            }
          } else {
            // This is part of the if-else for isReadableStream(result)
            console.info('Received regular response:', result.data);
          }
        } catch (error) {
          console.error(
            'Error executing query program:',
            error instanceof Error ? error.message : String(error),
          );
        }
      }
    }
  } catch (error) {
    console.error(
      'Error:',
      error instanceof Error ? error.message : String(error),
    );
  }
}

run().catch(console.error);
