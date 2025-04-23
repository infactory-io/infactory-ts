// Usage: tsx monitor-saas-usage.ts

import {
  InfactoryClient,
  // Project,
  // Team,
  // Datasource,
  QueryProgram,
  // API,
  APIEndpoint,
  // OpenAPISpec,
  Conversation,
  // ChatMessageCreate,
  ApiResponse,
  // InfactoryAPIError,
  isReadableStream,
  processStreamToApiResponse,
  Project,
} from '@infactory/infactory-ts';
import * as dotenv from 'dotenv';
import { randomBytes } from 'crypto';
import { InfactoryAPIError } from '@infactory/infactory-ts';
import { OpenAPISpec } from '@/api/live.js';

// Load environment variables from .env file
dotenv.config();

// --- Configuration ---
const API_KEY = process.env.NF_API_KEY;
const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING;

if (!API_KEY) {
  console.error(
    '🔴 Error: NF_API_KEY environment variable is not set. Please create a .env file with your key.',
  );
  process.exit(1);
}

if (!DB_CONNECTION_STRING) {
  console.error(
    '🔴 Error: DB_CONNECTION_STRING environment variable is not set. Please create a .env file with your Postgres connection string.',
  );
  process.exit(1);
}

// --- Helper Function ---
function logStep(step: number, title: string) {
  console.log(`\n✅ Step ${step}: ${title}`);
  console.log('--------------------------------------------------');
}

function logInfo(message: string) {
  console.log(`   🔵 ${message}`);
}

function logSuccess(message: string) {
  console.log(`   🟢 ${message}`);
}

function logWarning(message: string) {
  console.warn(`   🟡 ${message}`);
}

function logError(message: string, error?: any) {
  console.error(`   🔴 ${message}`);
  if (error instanceof InfactoryAPIError) {
    console.error(`      Status: ${error.status}`);
    console.error(`      Code: ${error.code}`);
    console.error(`      Details: ${JSON.stringify(error.details)}`);
  } else if (error instanceof Error) {
    console.error(`      Error: ${error.message}`);
  } else if (error) {
    console.error(`      Details: ${JSON.stringify(error)}`);
  }
}

// Function to handle potential errors in API responses
async function handleResponse<T>(
  responsePromise: Promise<ApiResponse<T> | ReadableStream<Uint8Array>>,
  operationName: string,
): Promise<T | null> {
  try {
    let response = await responsePromise;

    if (isReadableStream(response)) {
      logInfo(`Processing stream response for ${operationName}...`);
      response = await processStreamToApiResponse<T>(response);
    }

    if (response.error) {
      logError(`Error during "${operationName}"`, response.error);
      return null;
    }

    if (response.data === undefined) {
      logWarning(
        `Operation "${operationName}" completed successfully but returned no data.`,
      );
      return null; // Or potentially return {} or handle as needed
    }

    logSuccess(`Operation "${operationName}" successful.`);
    return response.data;
  } catch (error) {
    logError(`Unexpected exception during "${operationName}"`, error);
    return null;
  }
}

// --- Main Example Function ---
async function runSaaSMonitoringExample() {
  logStep(0, 'Initializing Infactory Client');
  const client = new InfactoryClient({ apiKey: API_KEY });
  logSuccess('Client initialized.');

  // === Step 0: Get Logged-in User
  const user = await handleResponse(
    client.users.getCurrentUser(),
    'Fetching User',
  );
  if (!user) {
    logError('Failed to fetch user information.');
    return;
  }
  logInfo(`User ID: ${JSON.stringify(user)}`);
  const organizationId = user.organizationId;

  if (!organizationId) {
    logError('Failed to fetch organization ID.');
    return;
  }
  // === Step 0.5: Get Organization
  const organization = await handleResponse(
    client.organizations.getOrganization(organizationId),
    'Fetching Organization',
  );
  if (!organization) {
    logError('Failed to fetch organization information.');
    return;
  }
  logInfo(`Organization: ${JSON.stringify(organization)}`);

  // === Step 1: Create a project and connect the database ===
  logStep(1, 'Create Project and Datasource');

  const userTeam = user.userTeams[0];
  if (!userTeam) {
    logError('Failed to fetch user team information.');
    return;
  }
  const teamId = userTeam.teamId;
  logInfo(`Using Team ID: ${teamId}`);

  const teams = await handleResponse(
    client.teams.getTeams(organizationId),
    'Fetching Teams',
  );
  if (!teams || teams.length === 0) {
    logError(
      'No teams found for this user. Please create a team in the Infactory Workshop.',
    );
    return;
  }
  logInfo(`Using Team ID: ${teamId}`);

  const projectName = `SaaS Usage Monitor (${randomBytes(3).toString('hex')})`;
  const project = await handleResponse<Project>(
    client.projects.createProject({
      name: projectName,
      teamId: teamId,
      description: 'Monitoring usage metrics for our SaaS application',
    }),
    'Creating Project',
  );
  logInfo(
    `Project "${JSON.stringify(project)}" created with ID: ${project?.id}`,
  );
  if (!project?.id) {
    throw new Error('Failed to create project.');
  }
  const projectId = project.id;
  logInfo(`Project "${project.name}" created with ID: ${projectId}`);

  // Create a datasource representing the Postgres DB
  // Note: The actual connection and schema reading happen within the Infactory platform
  // when you interact via the Workshop or specific API calls trigger analysis.
  // This step primarily registers the datasource.
  const datasource = await handleResponse(
    client.datasources.createDatasource({
      name: 'SaaS App DB (Postgres)',
      projectId: projectId,
      type: 'postgresql', // Specify the type
      // The URI is often handled via Credentials for security,
      // but for simplicity in this example, we imply it's used by the platform later.
      // Alternatively, you could store it in uri or config if the API supports it directly.
      // Let's assume the connection string is used securely by the platform based on this registration.
      // You might need to use client.credentials API in a real-world scenario.
      uri: 'placeholder: see DB_CONNECTION_STRING', // Placeholder URI
    }),
    'Creating Datasource',
  );

  if (!datasource) return;
  const datasourceId = datasource.id;
  logInfo(`Datasource "${datasource.name}" created with ID: ${datasourceId}`);
  logInfo(
    'Note: You may need to go to the Infactory Workshop to finalize DB connection details and trigger schema analysis if not done automatically.',
  );

  // === Step 2: Ask questions based on the database schema ===
  // (We'll generate QueryPrograms based on these questions)
  logStep(2, 'Generate Queries from Questions');

  // Assume the SaaS database has tables like 'users', 'events', 'subscriptions'
  const questions = [
    'How many total users have signed up?',
    'How many users signed up in the last 7 days?',
    'What are the top 5 most used features this month?', // Assumes an 'events' table with feature name
    'List users who joined yesterday.',
    'Show the count of active subscriptions.', // Assumes a 'subscriptions' table
    'What is the daily user sign-up rate for the past week?',
    'Which users logged in today?', // Assumes login events
  ];

  logInfo(
    `Generating ${questions.length} query programs based on questions...`,
  );
  const queryPrograms: QueryProgram[] = [];

  for (const question of questions) {
    logInfo(`Generating query for: "${question}"`);
    // Using createQueryProgram directly for simplicity.
    // The platform's AI will translate the name/query into an executable program.
    const qp = await handleResponse(
      client.queryprograms.createQueryProgram({
        projectId: projectId,
        name: question, // Use the question as the name
        // Provide context that might help generation (optional)
        query: `Based on the SaaS database schema (tables like users, events, subscriptions), answer: ${question}`,
        // Link the datasource if the API supports it directly in creation (check API docs)
        // datasourceIds: [datasourceId] // This might be a custom parameter or handled differently
      }),
      `Creating Query Program for "${question.substring(0, 30)}..."`,
    );
    if (qp) {
      queryPrograms.push(qp);
      logInfo(`   Created Query Program ID: ${qp.id}`);
    } else {
      logWarning(`   Skipped query program for: "${question}" due to error.`);
    }
    // Add a small delay to avoid potential rate limits if any
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  if (queryPrograms.length === 0) {
    logError('No query programs were created. Cannot proceed.');
    return;
  }
  logSuccess(
    `Successfully attempted to create ${queryPrograms.length} queries.`,
  );

  // === Step 3: Publish queries as API endpoints ===
  logStep(3, 'Publish Queries as API Endpoints');

  // First, create a single API container for these endpoints
  const apiName = `SaaS Usage API (${randomBytes(3).toString('hex')})`;
  const apiBasePath = `saas-usage-${randomBytes(4).toString('hex')}`; // Unique base path
  const apiVersion = 'v1';

  const api = await handleResponse(
    client.apis.createApi({
      name: apiName,
      projectId: projectId,
      basePath: apiBasePath,
      version: apiVersion,
      description: 'API for querying SaaS application usage metrics',
    }),
    'Creating API Container',
  );

  if (!api) return;
  const apiId = api.id;
  logInfo(`API Container "${apiName}" created with ID: ${apiId}`);
  logInfo(`   Base Path: /${apiBasePath}/${apiVersion}`);

  // Now, publish each query and create an endpoint for it
  const publishedEndpoints: APIEndpoint[] = [];
  for (const qp of queryPrograms) {
    logInfo(`Publishing query: "${qp.name}" (ID: ${qp.id})`);
    const publishedQp = await handleResponse(
      client.queryprograms.publishQueryProgram(qp.id),
      `Publishing Query ${qp.id}`,
    );

    if (!publishedQp) {
      logWarning(`Skipping endpoint creation for Query ${qp.id} due to error.`);
      continue;
    }

    // Create a sensible path for the endpoint
    const endpointPath = (qp.name ?? `query-${qp.id}`)
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, ''); // Remove non-alphanumeric characters except hyphens

    logInfo(`Creating API endpoint for path: /${endpointPath}`);
    const endpoint = await handleResponse(
      client.apis.createApiEndpoint({
        apiId: apiId,
        endpointName: qp.name ?? `Query ${qp.id}`,
        description: qp.name ?? `Endpoint for Query ${qp.id}`,
        httpMethod: 'GET', // Assuming most usage queries are GET requests
        path: `/${endpointPath}`, // Path relative to the API base path
        queryprogramId: qp.id,
      }),
      `Creating API Endpoint for Query ${qp.id}`,
    );

    if (endpoint) {
      publishedEndpoints.push(endpoint);
      logInfo(
        `   Endpoint created: ${endpoint.httpMethod} /${apiBasePath}/${apiVersion}/${endpointPath}`,
      );
    } else {
      logWarning(
        `   Failed to create endpoint for Query ${qp.id} after publishing.`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, 500)); // Delay
  }

  if (publishedEndpoints.length === 0) {
    logError('No API endpoints were created. Cannot proceed.');
    return;
  }
  logSuccess(
    `Successfully published ${publishedEndpoints.length} queries as API endpoints.`,
  );

  // === Step 4: Get the OpenAPI specification ===
  logStep(4, 'Get OpenAPI Specification');

  const openapiSpec = await handleResponse<OpenAPISpec>(
    client.live.getOpenAPISpec(apiBasePath, apiVersion),
    'Fetching OpenAPI Specification',
  );

  if (!openapiSpec) return;

  // Log the OpenAPI spec clearly for copy-pasting
  console.log('\n--- BEGIN OPENAPI SPECIFICATION ---');
  console.log(JSON.stringify(openapiSpec, null, 2));
  console.log('--- END OPENAPI SPECIFICATION ---\n');
  logSuccess('OpenAPI specification retrieved.');

  // === Step 5: Use the project chat endpoint ===
  logStep(5, 'Chat with Project Endpoints');

  const conversation = await handleResponse<Conversation>(
    client.chat.createConversation({ projectId: projectId }),
    'Creating Chat Conversation',
  );

  if (!conversation) return;
  const conversationId = conversation.id;
  logInfo(`Created chat conversation ID: ${conversationId}`);

  const chatQuestion = 'How many users signed up yesterday?';
  logInfo(`Sending chat message: "${chatQuestion}"`);

  // Sending a message - this often returns a stream
  const chatResponseStream = await client.chat.sendMessage(conversationId, {
    projectId: projectId,
    conversationId: conversationId,
    content: chatQuestion,
    // Optionally specify model, temperature etc.
  });

  // Process the stream response
  logInfo('Waiting for chat response...');
  const finalChatResponse = await handleResponse(
    chatResponseStream, // Pass the stream directly
    'Sending Chat Message',
  );

  // The structure of the final chat response after streaming might vary.
  // It might contain the last message, aggregated results, or just confirmation.
  // We'll log whatever we get back after processing the stream.
  if (finalChatResponse) {
    logSuccess('Chat interaction completed.');
    logInfo(
      `Final chat response (summary): ${JSON.stringify(finalChatResponse).substring(0, 200)}...`,
    );
    // You would typically process the stream events *during* the stream
    // to show thinking indicators and partial results in a UI.
    // The handleResponse function currently just aggregates the stream for simplicity.
  } else {
    logWarning('Chat interaction finished, but no final data was returned.');
  }

  // === Step 6: Prepare for Visualization ===
  logStep(6, 'Prepare for Visualization with Claude');
  logInfo(
    'The OpenAPI specification for your new API endpoints was printed in Step 4.',
  );
  logInfo(
    'Copy the entire JSON object between "--- BEGIN OPENAPI SPECIFICATION ---" and "--- END OPENAPI SPECIFICATION ---".',
  );
  logInfo(
    'Paste this specification into Claude (or another LLM/tool) and ask it to generate a single-page web application (HTML, CSS, JavaScript) to create a dashboard visualizing the data from these endpoints.',
  );
  logInfo('Example prompt for Claude:');
  console.log(`
      "Here is an OpenAPI specification for an API that provides SaaS usage metrics:
  
      <PASTE_OPENAPI_SPEC_HERE>
  
      Please generate a single-page web application (using HTML, CSS, and vanilla JavaScript - no frameworks needed) that acts as a dashboard.
      For each GET endpoint in the specification:
      1. Create a card or section on the dashboard.
      2. The card title should be based on the endpoint's summary or description.
      3. When the page loads, call the endpoint using the Fetch API (remember to include an input field or mechanism for the user to provide the necessary API key as a Bearer token).
      4. Display the results clearly within the card. If the result is a number, display it prominently. If it's a list, display it as a table or list. If it's complex JSON, format it nicely.
      5. Handle potential loading states and errors gracefully.
      Provide the complete HTML, CSS, and JavaScript code."
      `);
  logInfo(
    'You will need to host the generated HTML file and provide your Infactory API key to the running application to make the calls.',
  );

  logSuccess('End-to-End Example Completed!');
}

// --- Run the Example ---
runSaaSMonitoringExample().catch((error) => {
  console.error(
    '\n🚨 An unexpected error occurred during the example execution:',
  );
  console.error(error);
  process.exit(1);
});
