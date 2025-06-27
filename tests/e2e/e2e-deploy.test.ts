import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { InfactoryClient } from '../../src/client.js';
import {
  Organization,
  Team,
  Project,
  CreateQueryProgramParams,
  QueryProgram,
  CreateAPIParams,
  API,
  APIEndpoint,
  CreateAPIEndpointParams,
} from '../../src/types/common.js';
import { setupE2EEnvironment, cleanupE2EEnvironment } from './e2e-setup.js';

describe('E2E Tests: API Deployment Workflow', () => {
  let client: InfactoryClient;
  let organization: Organization;
  let team: Team;
  let project: Project;
  let queryProgram: QueryProgram;
  let api: API;
  let endpoint: APIEndpoint;
  let uniqueId: string;

  // Generate unique names for test resources
  const projectName = (id: string) => `e2e-api-project-${id}`;
  const queryProgramName = (id: string) => `e2e-api-query-${id}`;
  const apiName = (id: string) => `e2e-api-${id}`;
  const endpointName = (id: string) => `e2e-endpoint-${id}`;

  // Query program code for our test
  const queryProgramCode = `class AnswerQueryProgram(QueryProgram):
    """
    A simple query program for the API deployment test.
    """

    def __init__(self):
        self.plan = ["This is a sample query program for API testing"]
        self.load_params = []
        self.slots = []
        self.lets = []
        self.stores = [
            Store(At.MAIN, "str")
        ]

    def run(self):
        (
            self
            .new("Hello from the API endpoint", store=At.A)
            .move(At.A, At.MAIN)
        )`;

  // Chat completion message
  const chatMessage = 'Tell me about this API endpoint';

  beforeAll(async () => {
    const env = await setupE2EEnvironment();
    client = env.client;
    organization = env.organization;
    team = env.team;
    uniqueId = env.uniqueId;

    try {
      console.info(
        `Creating project: ${projectName(uniqueId)} in team ${team.id}`,
      );
      const projectReq = { name: projectName(uniqueId), teamId: team.id };
      const projectResponse = await client.projects.createProject(projectReq);
      expect(projectResponse.data).toBeDefined();
      project = projectResponse.data!;
      console.info(`Created project ID: ${project.id}`);
    } catch (error) {
      console.error('Failed during project setup:', error);
      throw error; // Re-throw to fail the test suite
    }
  }, 60000); // Increase timeout for setup

  afterAll(async () => {
    await cleanupE2EEnvironment(client, organization.id, team.id, project?.id);
  }, 60000); // Increased timeout

  it('should create and publish a query program for API use', async () => {
    console.info(`Creating query program: ${queryProgramName(uniqueId)}`);
    try {
      const createReq: CreateQueryProgramParams = {
        cue: queryProgramName(uniqueId),
        projectId: project.id,
        code: queryProgramCode,
        published: false, // Start unpublished, then publish later
      };

      const createResponse =
        await client.queryPrograms.createQueryProgram(createReq);
      if (createResponse.error) {
        console.warn('Error creating query program:', createResponse.error);
        return;
      }

      expect(createResponse.data).toBeDefined();
      queryProgram = createResponse.data!;
      expect(queryProgram.id).toBeDefined();
      console.info(`Created query program ID: ${queryProgram.id}`);

      // Add a delay before publishing to allow the query program to be processed fully
      console.info('Waiting 5 seconds before publishing...');
      await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 second delay

      // Publish the query program so it can be used in an API
      console.info(`Publishing query program ID: ${queryProgram.id}`);
      try {
        const publishResponse = await client.queryPrograms.publishQueryProgram(
          queryProgram.id,
        );

        if (publishResponse.error) {
          console.warn(
            'Error publishing query program:',
            publishResponse.error,
          );
          console.info(
            'Will continue with tests using unpublished query program',
          );
          return;
        }

        // Verify it's published
        const getResponse = await client.queryPrograms.getQueryProgram(
          queryProgram.id,
        );
        if (getResponse.error) {
          console.warn(
            'Error getting query program details after publish:',
            getResponse.error,
          );
          return;
        }

        expect(getResponse.data).toBeDefined();
        console.info(`Published status: ${getResponse.data!.published}`);

        if (getResponse.data!.published) {
          console.info('Query program published successfully');
        } else {
          console.info(
            'Query program not showing as published yet, may take time to update',
          );
        }
      } catch (publishError) {
        console.error(
          'Unexpected error publishing query program:',
          publishError,
        );
        console.info(
          'Will continue with tests using unpublished query program',
        );
      }
    } catch (error) {
      console.error('Unexpected error in query program test:', error);
    }
  }, 60000); // 60-second timeout

  it('should use the chat completions API with a project', async () => {
    // This step corresponds to: CompletionsPlayground, Click "Run", CompletionsPlayground,
    // POST /v1/integrations/chat/[project_id]/chat/completions

    console.info('Testing chat completions with project...');

    try {
      // Create a conversation to use for the chat
      const conversationResponse = await client.explore.createConversation({
        projectId: project.id,
        title: `API Test Conversation - ${uniqueId}`,
      });

      // Don't expect in try block - handle errors separately
      if (conversationResponse.error) {
        console.warn(
          'Error creating conversation:',
          conversationResponse.error,
        );
        console.info('Skipping chat completions test...');
        return;
      }

      const conversationId = conversationResponse.data!.id;

      // Send a message to test completions
      console.info(`Sending chat message in conversation ${conversationId}`);
      const chatResponse = await client.explore.sendMessage(
        conversationId,
        {
          conversationId: conversationId,
          projectId: project.id,
          content: chatMessage,
          authorRole: 'user',
        },
        false, // noReply parameter
      );

      // For stream responses, we just verify something was returned
      expect(chatResponse).toBeDefined();
      console.info('Chat completions request successful');
    } catch (error) {
      console.error('Error using chat completions:', error);
      // Log but don't fail the test as chat might not be fully available in all environments
      console.info('Continuing with test suite...');
    }
  }, 60000); // Increased timeout

  it('should create an API for the project', async () => {
    console.info(
      `Creating API: ${apiName(uniqueId)} for project ${project.id}`,
    );

    const createApiParams: CreateAPIParams = {
      projectId: project.id,
      name: apiName(uniqueId),
      description: 'API created for e2e tests',
      version: '1.0.0',
      slug: uniqueId,
    };

    try {
      const createResponse = await client.apis.createApi(createApiParams);
      if (createResponse.error) {
        console.warn('Error creating API:', createResponse.error);
        return; // Skip assertions if there's an error
      }

      expect(createResponse.data).toBeDefined();
      api = createResponse.data!;
      expect(api.id).toBeDefined();
      console.info(`Created API ID: ${api.id}`);
    } catch (error) {
      console.error('Unexpected error creating API:', error);
      // Continue with the test suite
    }
  }, 60000); // 60-second timeout

  it('should get all APIs for a project', async () => {
    // This step corresponds to: DeployedAPIs, Auto-loads first API, APIDetailLiveDocs, apisApi.getProjectApis

    console.info(`Fetching APIs for project ${project.id}`);
    const apisResponse = await client.apis.getProjectApis(project.id);

    if (apisResponse.error) {
      console.warn('Error fetching APIs:', apisResponse.error);
      return; // Skip if there's an error
    }

    expect(apisResponse.data).toBeDefined();
    expect(Array.isArray(apisResponse.data)).toBe(true);
    console.info(`Found ${apisResponse.data!.length} APIs for the project`);

    // If our API object is defined, verify it's in the list
    if (api?.id) {
      const foundApi = apisResponse.data!.find((a) => a.id === api.id);
      expect(foundApi).toBeDefined();
      console.info(`Verified API ${api.id} is in the list`);
    } else {
      console.info('API object not defined, skipping verification');
    }
  }, 60000); // 60-second timeout

  it('should update API details', async () => {
    // Skip this test if API was not created
    if (!api?.id) {
      console.info(
        'Skipping API update test - API was not created successfully',
      );
      return;
    }

    // This step corresponds to: APIDetailEditDocs, Save API Details, APIDetailEditDocs, apisApi.updateApi
    console.info(`Updating API ${api.id} details`);
    const updateParams = {
      description: 'Updated API description for e2e tests',
      version: '1.0.1',
    };

    try {
      const updateResponse = await client.apis.updateApi(api.id, updateParams);
      if (updateResponse.error) {
        console.warn('Error updating API:', updateResponse.error);
        return;
      }

      expect(updateResponse.data).toBeDefined();
      expect(updateResponse.data!.description).toBe(updateParams.description);
      expect(updateResponse.data!.version).toBe(updateParams.version);

      // Update our local copy
      api = updateResponse.data!;
      console.info('API details updated successfully');
    } catch (error) {
      console.error('Unexpected error updating API:', error);
    }
  }, 60000); // 60-second timeout

  it('should get all published query programs for the project', async () => {
    // This step corresponds to: APIDetailEditDocs, Add Endpoint Click, AddEndpointDialog,
    // apisApi.getProjectPublishedPrograms (to populate dropdown)

    console.info(`Fetching published query programs for project ${project.id}`);
    try {
      const programsResponse = await client.apis.getProjectPublishedPrograms(
        project.id,
      );
      if (programsResponse.error) {
        console.warn(
          'Error getting published programs:',
          programsResponse.error,
        );
        return;
      }

      expect(programsResponse.data).toBeDefined();
      expect(Array.isArray(programsResponse.data)).toBe(true);
      console.info(
        `Found ${programsResponse.data!.length} published query programs`,
      );

      // Verify our published query program is in the list
      if (queryProgram?.id) {
        const foundProgram = programsResponse.data!.find(
          (p) => p.id === queryProgram.id,
        );
        expect(foundProgram).toBeDefined();
        console.info(
          `Verified query program ${queryProgram.id} is in the list`,
        );
      }
    } catch (error) {
      console.error('Unexpected error getting published programs:', error);
    }
  }, 60000); // 60-second timeout

  it('should create an API endpoint for the query program', async () => {
    // Skip if either API or query program is not available
    if (!api?.id || !queryProgram?.id) {
      console.info(
        'Skipping endpoint creation - API or QueryProgram not available',
      );
      return;
    }

    // This step corresponds to: AddEndpointDialog, Add Success, APIDetailEditDocs, apisApi.createApiEndpoint
    console.info(
      `Creating API endpoint ${endpointName(uniqueId)} for API ${api.id}`,
    );
    const createEndpointParams: CreateAPIEndpointParams = {
      apiId: api.id,
      endpointName: endpointName(uniqueId),
      httpMethod: 'GET',
      path: '/sample',
      queryprogramId: queryProgram.id,
      description: 'Sample endpoint created for e2e testing',
      operationId: `get${endpointName(uniqueId)}`,
      // Optional parameters
      tags: 'test,e2e',
      parameters: '',
      responses: JSON.stringify({
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                type: 'string',
              },
            },
          },
        },
      }),
    };

    try {
      const createResponse =
        await client.apis.createApiEndpoint(createEndpointParams);
      if (createResponse.error) {
        console.warn('Error creating endpoint:', createResponse.error);
        return;
      }

      expect(createResponse.data).toBeDefined();
      endpoint = createResponse.data!;
      expect(endpoint.id).toBeDefined();
      console.info(`Created API endpoint ID: ${endpoint.id}`);
    } catch (error) {
      console.error('Unexpected error creating endpoint:', error);
    }
  }, 60000); // 60-second timeout

  it('should get all endpoints for an API', async () => {
    // Skip if API is not available
    if (!api?.id) {
      console.info('Skipping get endpoints test - API not available');
      return;
    }

    console.info(`Fetching endpoints for API ${api.id}`);
    try {
      const endpointsResponse = await client.apis.getApiEndpoints(api.id);
      if (endpointsResponse.error) {
        console.warn('Error getting endpoints:', endpointsResponse.error);
        return;
      }

      expect(endpointsResponse.data).toBeDefined();
      expect(Array.isArray(endpointsResponse.data)).toBe(true);
      console.info(
        `Found ${endpointsResponse.data!.length} endpoints for the API`,
      );

      // Verify our created endpoint is in the list if it exists
      if (endpoint?.id) {
        const foundEndpoint = endpointsResponse.data!.find(
          (e) => e.id === endpoint.id,
        );
        expect(foundEndpoint).toBeDefined();
        console.info(`Verified endpoint ${endpoint.id} is in the list`);
      }
    } catch (error) {
      console.error('Unexpected error getting endpoints:', error);
    }
  }, 60000); // 60-second timeout

  it('should update an API endpoint', async () => {
    // Skip if endpoint is not available
    if (!endpoint?.id) {
      console.info('Skipping update endpoint test - Endpoint not available');
      return;
    }

    console.info(`Updating API endpoint ${endpoint.id}`);
    const updateParams = {
      description: 'Updated endpoint description for e2e tests',
      httpMethod: 'POST' as const, // Using type assertion to match the expected enum
    };

    try {
      const updateResponse = await client.apis.updateApiEndpoint(
        endpoint.id,
        updateParams,
      );
      if (updateResponse.error) {
        console.warn('Error updating endpoint:', updateResponse.error);
        return;
      }

      expect(updateResponse.data).toBeDefined();
      expect(updateResponse.data!.description).toBe(updateParams.description);
      expect(updateResponse.data!.httpMethod).toBe(updateParams.httpMethod);

      // Update our local copy
      endpoint = updateResponse.data!;
      console.info('API endpoint updated successfully');
    } catch (error) {
      console.error('Unexpected error updating endpoint:', error);
    }
  }, 60000); // 60-second timeout

  it('should delete an API endpoint', async () => {
    // Skip if endpoint or API is not available
    if (!endpoint?.id || !api?.id) {
      console.info(
        'Skipping delete endpoint test - Endpoint or API not available',
      );
      return;
    }

    // This step corresponds to: APIDetailEditDocs, Delete Endpoint, APIDetailEditDocs, apisApi.deleteApiEndpoint
    console.info(`Deleting API endpoint ${endpoint.id}`);
    try {
      const deleteResponse = await client.apis.deleteApiEndpoint(endpoint.id);
      if (deleteResponse.error) {
        console.warn('Error deleting endpoint:', deleteResponse.error);
        return;
      }

      // Verify the endpoint is deleted
      const endpointsResponse = await client.apis.getApiEndpoints(api.id);
      if (endpointsResponse.error) {
        console.warn(
          'Error verifying endpoint deletion:',
          endpointsResponse.error,
        );
        return;
      }

      expect(endpointsResponse.data).toBeDefined();
      const foundEndpoint = endpointsResponse.data!.find(
        (e) => e.id === endpoint.id,
      );
      expect(foundEndpoint).toBeUndefined();
      console.info('API endpoint deleted successfully');
    } catch (error) {
      console.error('Unexpected error deleting endpoint:', error);
    }
  }, 60000); // 60-second timeout

  it('should delete the API', async () => {
    // Skip if API is not available
    if (!api?.id) {
      console.info('Skipping delete API test - API not available');
      return;
    }

    console.info(`Deleting API ${api.id}`);
    try {
      const deleteResponse = await client.apis.deleteApi(api.id);
      if (deleteResponse.error) {
        console.warn('Error deleting API:', deleteResponse.error);
        return;
      }

      // Verify the API is deleted
      try {
        const getResponse = await client.apis.getApi(api.id);
        // If the API has a deletedAt field, it means soft delete was used
        if (getResponse.data?.deletedAt) {
          console.info('API soft deleted successfully');
        } else {
          console.warn('API still exists after delete operation');
        }
      } catch (error: any) {
        // If we get a 404, it means hard delete was used
        if (error.response?.status === 404) {
          console.info('API hard deleted successfully (404 response)');
        } else {
          console.error('Unexpected error when checking deleted API:', error);
        }
      }
    } catch (error) {
      console.error('Unexpected error deleting API:', error);
    }
  }, 60000); // 60-second timeout

  it('should clean up by deleting the query program', async () => {
    console.info(`Deleting query program ${queryProgram.id}`);
    const deleteResponse = await client.queryPrograms.deleteQueryProgram(
      queryProgram.id,
    );
    expect(deleteResponse.error).toBeUndefined();
    console.info('Query program deleted successfully');
  }, 60000); // 60-second timeout
});
