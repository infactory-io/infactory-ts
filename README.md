# Infactory TypeScript SDK

Official TypeScript SDK for interacting with the Infactory AI platform. This SDK allows you to programmatically access and manage your data, projects, and queries through the Infactory API.

## Installation

```bash
npm install @infactory/infactory-ts
```

## Configuration

Before using the SDK, you need to set up your Infactory API credentials:

1. Obtain an API key from the [Infactory Workshop](https://workshop.infactory.ai/api-keys)
2. Use the API key to initialize the client

## Quick Start

```typescript
import { InfactoryClient } from '@infactory/infactory-ts';

// Initialize the client with your API key
const client = new InfactoryClient({
  apiKey: 'your-api-key-here',
  // Optional: baseURL: 'https://api.infactory.ai' // Use custom API endpoint if needed
});

// Example: Get current user information
async function getCurrentUser() {
  const response = await client.users.getCurrentUser();
  if (response.error) {
    console.error(`Error: ${response.error.message}`);
    return null;
  }
  return response.data;
}

// Example: List all projects
async function listProjects() {
  const response = await client.projects.getProjects();
  if (response.error) {
    console.error(`Error: ${response.error.message}`);
    return [];
  }
  return response.data;
}
```

## Environment Variables

The SDK supports loading configuration from environment variables:

```bash
# Required
NF_API_KEY=your-api-key-here

# Optional - defaults to https://api.infactory.ai
NF_BASE_URL=https://api.infactory.ai
```

You can load these variables from a `.env` file using dotenv:

```typescript
import * as dotenv from 'dotenv';
import { InfactoryClient } from '@infactory/infactory-ts';

// Load environment variables
dotenv.config();

// Create client using environment variables
const client = new InfactoryClient({
  apiKey: process.env.NF_API_KEY || '',
});
```

## Available APIs

The SDK provides access to the following Infactory API resources:

- **Projects** - Create and manage projects
- **Teams** - Manage teams and team memberships
- **Organizations** - Access organization information
- **Users** - User management and authentication
- **Auth** - API key management
- **Chat** - Interact with the chat interface
- **Chat Integrations** - Work with chat tools and custom functions
- **Knowledge Graph** - Create and manage knowledge graphs
- **Datasources** - Connect to and manage data sources
- **Datalines** - Access and transform data
- **QueryPrograms** - Create, run, and publish queries
- **APIs** - Deploy and manage API endpoints
- **Credentials** - Manage connection credentials
- **Integrations** - Work with third-party integrations like Fivetran
- **Secrets** - Store and manage secrets
- **Tasks** - Track and manage tasks
- **Events** - Access event information
- **MCP** - Management Control Plane for administrative operations

## Common Workflows

### Creating a Project and Uploading Data

```typescript
// Create a new project
const projectResponse = await client.projects.createProject({
  name: 'Stock Analysis Project',
  teamId: teamId,
  description: 'Project for analyzing stock data',
});
const project = projectResponse.data;

// Create a datasource
const datasourceResponse = await client.datasources.createDatasource({
  name: 'Stock Data',
  projectId: project.id,
  type: 'csv',
});
const datasource = datasourceResponse.data;

// Upload a CSV file (This is a simplified example)
const formData = new FormData();
formData.append('file', fs.createReadStream('./data/stocks.csv'));

// Upload using the datasource
await fetch(
  `${client.getBaseURL()}/v1/actions/load/${project.id}?datasourceId=${datasource.id}`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${client.getApiKey()}`,
    },
    body: formData,
  },
);
```

### Working with Query Programs

```typescript
// Get query programs for a project
const queryProgramsResponse =
  await client.queryprograms.getQueryProgramsByProject(projectId);
const queryPrograms = queryProgramsResponse.data;

// Execute a query program
const evaluateResponse =
  await client.queryprograms.executeQueryProgram(queryProgramId);
const queryResult = evaluateResponse.data;

// Publish a query program to make it available as an API
await client.queryprograms.publishQueryProgram(queryProgramId);
```

### Accessing APIs

```typescript
// Get APIs for a project
const apisResponse = await client.apis.getProjectApis(projectId);
const apis = apisResponse.data;

// Get endpoints for an API
const endpointsResponse = await client.apis.getApiEndpoints(apiId);
const endpoints = endpointsResponse.data;
```

## Authentication Management

The SDK now includes an enhanced authentication manager that provides better control over API keys and authentication state:

```typescript
import { InfactoryClient, AuthManager } from '@infactory/infactory-ts';

// Create an authentication manager
const authManager = new AuthManager({
  apiKey: 'your-api-key-here',
});

// Create a client using the auth manager
const client = new InfactoryClient({
  authManager,
});

// Check if authenticated
if (authManager.isAuthenticated()) {
  console.log('Authenticated with API key!');
}

// Update API key if needed
authManager.setApiKey('new-api-key');
```

## Error Handling

The SDK provides an improved error handling system with specific error classes that match the OpenAPI specification:

```typescript
import {
  InfactoryClient,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
} from '@infactory/infactory-ts';

async function handleErrors() {
  try {
    const client = new InfactoryClient({ apiKey: 'your-api-key' });
    const response = await client.projects.getProject('non-existent-id');
    return response.data;
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error('Authentication failed. Please check your API key.');
    } else if (error instanceof PermissionError) {
      console.error('You do not have permission to access this resource.');
    } else if (error instanceof NotFoundError) {
      console.error('The requested resource was not found.');
    } else if (error instanceof ValidationError) {
      console.error(`Validation error: ${error.message}`);
      console.error('Validation details:', error.errors);
    } else if (error instanceof RateLimitError) {
      console.error(
        `Rate limit exceeded. Try again in ${error.retryAfter} seconds.`,
      );
    } else if (error instanceof ServerError) {
      console.error(`Server error: ${error.message}`);
    } else {
      console.error(`Unexpected error: ${error.message}`);
    }
  }
}
```

### Handling Streaming Responses

Some API endpoints like `executeQueryProgram` can return streaming responses. The SDK provides enhanced utilities to handle these responses, including event-based streaming:

```typescript
import {
  InfactoryClient,
  isReadableStream,
  processStreamToApiResponse,
  streamEvents,
} from '@infactory/infactory-ts';

async function handleBasicStreamingResponse() {
  const client = new InfactoryClient({ apiKey: 'your-api-key' });

  // This may return a stream or a regular response
  const result = await client.queryprograms.executeQueryProgram(
    queryProgramId,
    { stream: true },
  );

  if (isReadableStream(result)) {
    // Process the stream into a regular API response
    const apiResponse = await processStreamToApiResponse(result);
    return apiResponse.data;
  } else {
    // Handle regular API response
    return result.data;
  }
}

// Enhanced event-based streaming for real-time data processing
async function handleEventStreamingResponse() {
  const client = new InfactoryClient({ apiKey: 'your-api-key' });

  // Get a streaming response
  const result = await client.queryprograms.executeQueryProgram(
    queryProgramId,
    { stream: true },
  );

  if (isReadableStream(result)) {
    // Process events from the stream as they arrive
    for await (const event of streamEvents(result)) {
      switch (event.type) {
        case 'data':
          console.log('Received data chunk:', event.data);
          // Process data in real-time
          break;
        case 'thinking':
          console.log('AI is thinking:', event.content);
          // Update UI with thinking state
          break;
        case 'completion':
          console.log('Received completion:', event.content);
          // Handle final result
          break;
        case 'error':
          console.error('Stream error:', event.error);
          // Handle errors appropriately
          break;
      }
    }
  } else {
    // Handle regular API response
    return result.data;
  }
}
```

## Complete Examples

For complete examples, see:

- `example.ts` - Basic SDK usage examples
- `infactory-e2e-test.ts` - End-to-end testing workflow including project creation, data upload, query execution, and API usage

## Command Line Tools

To run the included example files:

```bash
# Set up your API key
export NF_API_KEY=your-api-key-here

# Run the basic example
npm run example

# Run the end-to-end test
npm run e2e-test
```

## Development

### Building from Source

```bash
git clone https://github.com/infactory-io/infactory-ts.git
cd infactory-ts
npm install
npm run e2e-test
```

## Testing the SDK

The SDK includes a comprehensive test suite using Jest with several types of tests:

### Unit Tests

Unit tests verify individual components of the SDK in isolation:

```bash
npm run test:unit
```

### Integration Tests

Integration tests verify how components work together and with the Infactory API:

```bash
npm run test:integration
```

### Mock Service Worker Tests

MSW tests simulate API interactions using request interception:

```bash
npm run test:msw
```

### Running All Tests

To run the entire test suite:

```bash
npm test
```

### Test Coverage

Generate test coverage reports:

```bash
npm run test:coverage
```

### Setting Up Tests

For contributors writing tests:

1. **Unit Tests**: Place in `src/__tests__/` and name as `*.test.ts`
2. **Integration Tests**: Place in `src/__tests__/integration/` directory
3. **MSW Tests**: Place in `src/__tests__/msw/` directory

### Testing Dependencies

The test suite uses several tools:
- **vitest**: Test runner and assertion library
- **nock**: HTTP server mocking
- **MSW**: API mocking via request interception

## License

This Infactory TypeScript SDK is licensed under the MIT License. See the LICENSE file for more details.
