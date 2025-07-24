import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import {
  InfactoryClient,
  Project,
  Datasource,
  QueryProgram,
  API,
  isReadableStream,
} from '../../dist/index.js'; // Adjust path if running from within the repo
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// --- Test Configuration ---
dotenv.config();
const {
  NF_API_KEY: API_KEY,
  NF_BASE_URL: BASE_URL = 'https://workshop.infactory.ai',
} = process.env;

if (!API_KEY) {
  throw new Error('🔴 FATAL: NF_API_KEY environment variable not set.');
}

// Parse the SSE event-style response into a list of events
function parseSSEEvents(sseData: string) {
  const events: { event: string; data: any }[] = [];
  // Split by double newlines (end of event)
  const rawEvents = sseData.split(/\r?\n\r?\n/);
  for (const rawEvent of rawEvents) {
    if (!rawEvent.trim()) continue;
    const lines = rawEvent.split(/\r?\n/);
    let eventType = '';
    const dataLines: string[] = [];
    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        dataLines.push(line.slice(6));
      }
    }
    if (eventType && dataLines.length > 0) {
      // Try to parse JSON, fallback to string
      let data: any = dataLines.join('\n');
      try {
        data = JSON.parse(data);
      } catch {
        // leave as string
      }
      events.push({ event: eventType, data });
    }
  }
  return events;
}

// --- Helper Functions ---
const logInfo = (message: string) => console.log(`[INFO] ${message}`);
const logSuccess = (message: string) => console.log(`✅ [SUCCESS] ${message}`);
const logError = (message: string, error?: any) => {
  console.error(`🔴 [ERROR] ${message}`);
  if (error) console.error(error);
};
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function poll<T>(
  operation: () => Promise<{ data?: T; error?: any }>,
  isReady: (result: T | undefined) => boolean,
  timeout = 90000,
  interval = 5000,
): Promise<T> {
  const startTime = Date.now();
  let timeoutId: NodeJS.Timeout | null = null;
  let timedOut = false;

  // Set up a timeout that will flip the flag and reject after the timeout period
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      timedOut = true;
      reject(new Error(`Polling timed out after ${timeout / 1000} seconds.`));
    }, timeout);
  });

  // The polling logic as a promise
  const pollingPromise = (async () => {
    while (!timedOut) {
      const { data, error } = await operation();
      if (error) {
        if (timeoutId) clearTimeout(timeoutId);
        throw error; // Fail fast if the operation returns an error
      }
      if (isReady(data)) {
        if (timeoutId) clearTimeout(timeoutId);
        return data as T;
      }
      await delay(interval);
    }
    // If we exit the loop due to timeout, throw (shouldn't happen, handled by timeoutPromise)
    throw new Error(`Polling timed out after ${timeout / 1000} seconds.`);
  })();

  // Race the polling and the timeout
  return Promise.race([pollingPromise, timeoutPromise]);
}

// --- Test Suite ---
describe('E2E Quickstart Scenario', () => {
  let client: InfactoryClient;
  let sandboxProject: Project | undefined;
  let stocksDatasource: Datasource | undefined;
  //   let aiQueryProgram: QueryProgram | undefined;
  //   let deployedApi: API | undefined;

  const csvFilePath = path.join(__dirname, 'stocks.csv');

  // Increase timeout for the entire suite
  vi.setConfig({ testTimeout: 120000 });

  beforeAll(async () => {
    logInfo('Setting up E2E test suite...');
    client = new InfactoryClient({
      apiKey: API_KEY,
      baseURL: BASE_URL,
      isServer: true,
    });
    console.log('Client created:', client);

    // Step 3 (Setup): Create a fresh sandbox project
    const userResponse = await client.users.getCurrentUser();
    if (userResponse.error || !userResponse.data?.userTeams?.[0]?.teamId) {
      throw new Error('Could not get user or team ID for setup.');
    }
    const teamId = userResponse.data.userTeams[0].teamId;

    const projectResponse = await client.projects.createProject({
      name: `Vitest E2E Quickstart ${Date.now()}`,
      teamId: teamId,
    });
    if (projectResponse.error || !projectResponse.data) {
      throw new Error('Failed to create sandbox project in beforeAll.');
    }
    sandboxProject = projectResponse.data;
    logSuccess(`Setup complete. Using project: ${sandboxProject.id}`);

    // Create a dummy CSV file for testing
    const csvContent =
      'Date,Symbol,Open,High,Low,Close,Volume\n' +
      '2023-01-03,AAPL,124.5,130.9,124.2,125.1,112117500\n' +
      '2023-01-04,AAPL,126.9,128.7,125.1,126.4,89113600\n' +
      '2023-01-03,GOOGL,89.8,91.6,89.0,89.7,28131200\n' +
      '2023-01-04,GOOGL,91.0,91.4,87.8,88.7,34854800\n';
    fs.writeFileSync(csvFilePath, csvContent);
  });

  afterAll(async () => {
    logInfo('Tearing down E2E test suite...');
    // Step 19 (Teardown): Clean up all created resources
    if (stocksDatasource?.id) {
      await client.datasources
        .deleteDatasource(stocksDatasource.id)
        .catch((e) =>
          logError(`Cleanup failed for datasource ${stocksDatasource!.id}`, e),
        );
      logSuccess(`Cleaned up datasource: ${stocksDatasource.id}`);
    }
    if (sandboxProject?.id) {
      await client.projects
        .deleteProject(sandboxProject.id)
        .catch((e) =>
          logError(`Cleanup failed for project ${sandboxProject!.id}`, e),
        );
      logSuccess(`Cleaned up project: ${sandboxProject.id}`);
    }
    if (fs.existsSync(csvFilePath)) {
      fs.unlinkSync(csvFilePath);
      logSuccess('Removed temporary stocks.csv file.');
    }
  });

  it('Step 1: should sign in and retrieve user profile', async () => {
    const response = await client.users.getCurrentUser();
    expect(response.error).toBeUndefined();
    expect(response.data).toBeDefined();
    expect(response.data?.email).toEqual(expect.any(String));
    logSuccess(`Signed in as ${response.data?.email}`);
  });

  it('Step 2: should inspect existing projects', async () => {
    const teamId = (await client.users.getCurrentUser()).data?.userTeams?.[0]
      ?.teamId;
    const response = await client.projects.getProjects(teamId);
    expect(response.error).toBeUndefined();
    expect(response.data).toBeDefined();
    expect(response.data!.length).toBeGreaterThan(0);
    logSuccess(`Found ${response.data!.length} projects.`);
  });

  it('Steps 4-6: should upload stocks.csv and wait for schema generation', async () => {
    // Step 4: List initial datasources
    if (!sandboxProject) {
      throw new Error('Sandbox project not found');
    }
    const initialDsResponse = await client.datasources.getProjectDatasources(
      sandboxProject.id,
    );
    expect(initialDsResponse.error).toBeUndefined();
    expect(initialDsResponse.data?.length).toBe(0);

    // Step 5: Upload stocks.csv
    // curl -X POST \
    // -H "Authorization: Bearer YOUR_ACTUAL_TOKEN_HERE" \
    // -F "file=@/Users/seankruzel/repos/dev/__yard_sale/slots_examples/stocks.csv" \
    // "http://localhost:8000/v1/actions/load/d6413dc7-5f1f-4599-ae5b-e0b5b2979f98?datasource_id=46b57288-2b96-495e-8a0d-717de10cf7ee"

    const uploadResult = await client.datasources.uploadCsvFile(
      sandboxProject.id,
      csvFilePath,
      10,
      'stocks.csv',
    );
    expect(uploadResult.datasource?.id).toBeDefined();
    expect(uploadResult.uploadResponse).toBeDefined();
    expect((uploadResult.uploadResponse as any)?.message).toBeDefined();
    expect((uploadResult.uploadResponse as any)?.redirect_to).toBeDefined();
    expect((uploadResult.uploadResponse as any)?.success).toBe(true);
    expect((uploadResult.uploadResponse as any)?.datasource_id).toBe(
      uploadResult.datasource?.id,
    );
    stocksDatasource = uploadResult.datasource;
    logSuccess(`Datasource created with ID: ${stocksDatasource.id}`);

    // Step 6: Wait for schema generation
    logInfo(`Polling status for datasource ${stocksDatasource.id}...`);
    const readyDatasource = await poll(
      () => client.datasources.getDatasource(stocksDatasource!.id),
      (ds) => {
        console.info(`Polling status for datasource ${ds?.id}...`);
        return ds?.status === 'ready';
      },
    );
    expect(readyDatasource.status).toBe('ready');
    logSuccess('Datasource is ready.');
  });

  it('Steps 7-8: should list and run an autogenerated query', async () => {
    // Step 7: Open the Build tab
    const qpListResponse = await client.queryPrograms.listQueryPrograms({
      projectId: sandboxProject!.id,
    });
    expect(qpListResponse.error).toBeUndefined();
    expect(qpListResponse.data).toBeDefined();
    expect(qpListResponse.data?.length).toEqual(0);

    // Should call auto-generate queries - synchronous
    logInfo(`Creating 2 autogenerated queries...`);
    const autoGenerateResponse = await client.build.createCues({
      projectId: sandboxProject!.id,
      previousQuestions: [],
      count: 2,
      guidance: 'Explore the trading volume',
    });
    expect(autoGenerateResponse.error).toBeUndefined();
    expect(autoGenerateResponse.data).toBeDefined();
    // Poll until there are 2 query programs
    const queryPrograms = await poll(
      () =>
        client.queryPrograms.listQueryPrograms({
          projectId: sandboxProject!.id,
        }),
      (qps) => qps?.length === 2,
    );
    expect(queryPrograms.length).toBe(2);
    logSuccess(`Found ${queryPrograms.length} autogenerated queries.`);

    // Step 8: Run an autogenerated query
    const firstQp = queryPrograms[0];
    const runResponse = await client.queryPrograms.evaluateQueryProgramSync(
      sandboxProject!.id,
      firstQp.id,
    );
    expect(runResponse.error).toBeUndefined();
    // expect(runResponse.data.items['MAIN'].item.rows.length).toBeGreaterThan(0);
    logSuccess(
      `Autogenerated query ran successfully and returned ${runResponse.data.items['MAIN']}`,
    );
  });

  it('Steps 9-10: should create and execute a query via AI Assistant', async () => {
    // Step 9: Create a new query via the AI Assistant
    const nlQuery = 'What is the average trading volume for each symbol?';
    const response = await client.build.createQueryProgram({
      projectId: sandboxProject!.id,
      question: nlQuery,
    });
    expect(response.error).toBeUndefined();
    expect(response.data).toBeDefined();

    // Example usage:
    const sseEvents = parseSSEEvents(response.data as unknown as string);
    expect(Array.isArray(sseEvents)).toBe(true);
    expect(sseEvents.some((e) => e.event === 'QueryProgram')).toBe(true);
    const aiQueryProgram = sseEvents.find(
      (e) => e.event === 'QueryProgram',
    )?.data;
    logSuccess(`AI generated query`);

    // Step 10: Execute the new query
    const runResponse = await client.queryPrograms.evaluateQueryProgramSync(
      sandboxProject!.id,
      aiQueryProgram!.id,
    );
    expect(runResponse.error).toBeUndefined();
    expect(runResponse.data?.items['MAIN'].item.rows.length).toBeGreaterThan(0);
    const applVolume = runResponse.data?.items['MAIN'].item.rows.find(
      (r: any) => r[0] === 'AAPL',
    )[1];
    const googlVolume = runResponse.data?.items['MAIN'].item.rows.find(
      (r: any) => r[0] === 'GOOGL',
    )[1];
    expect(applVolume).toBeDefined();
    expect(googlVolume).toBeDefined();
    expect(applVolume).toBeCloseTo((112117500 + 89113600) / 2);
    expect(googlVolume).toBeCloseTo((28131200 + 34854800) / 2);
    logSuccess(
      `AI query ran successfully and calculated the average volume for AAPL and GOOGL.`,
    );
  });

  //   it('Steps 11-13: should deploy the query as an API and test it', async () => {
  //     expect(aiQueryProgram, 'Prerequisite: AI Query Program must exist').toBeDefined();

  //     // Step 11: Deploy the query as an API
  //     const deployResponse = await client.queryPrograms.publishQueryProgram(aiQueryProgram!.id);
  //     expect(deployResponse.error).toBeUndefined();
  //     expect(deployResponse.data?.published).toBe(true);
  //     logSuccess(`Deployed query ${aiQueryProgram!.id} as an API.`);
  //     await delay(3000); // Allow time for deployment propagation

  //     // Step 12: Browse the Deploy catalog
  //     const apisResponse = await client.apis.getProjectApis(sandboxProject!.id);
  //     deployedApi = apisResponse.data?.find(api => api.specification?.paths);
  //     expect(deployedApi).toBeDefined();
  //     logSuccess(`Found deployed API: "${deployedApi!.name}"`);

  //     // Step 13: Test the direct endpoint
  //     const endpointsResponse = await client.apis.getApiEndpoints(deployedApi!.id);
  //     const endpoint = endpointsResponse.data?.[0];
  //     expect(endpoint).toBeDefined();
  //     const apiCallResponse = await client.live.callCustomEndpoint(deployedApi!.slug, deployedApi!.version, endpoint!.path.substring(1));
  //     expect(apiCallResponse.error).toBeUndefined();
  //     expect(apiCallResponse.data).toBeDefined();
  //     logSuccess('Live API endpoint call was successful.');
  //   });

  //   it('Step 14: should test the unified chat endpoint', async () => {
  //     const chatQuestion = 'Using the available tools, what is the average trading volume for GOOGL?';
  //     const stream = await client.run.chatCompletions(sandboxProject!.id, { content: chatQuestion } as any);
  //     expect(isReadableStream(stream)).toBe(true);

  //     const reader = stream.getReader();
  //     const decoder = new TextDecoder();
  //     let fullResponse = '';
  //     while (true) {
  //         const { done, value } = await reader.read();
  //         if (done) break;
  //         fullResponse += decoder.decode(value);
  //     }
  //     expect(fullResponse).toContain('GOOGL');
  //     logSuccess('Chat completions endpoint responded as expected.');
  //   });

  //   it('Steps 16-18: should use the Explore chat feature and get a graph', async () => {
  //     // Step 16: Launch the Explore chat
  //     const convResponse = await client.explore.createConversation({ projectId: sandboxProject!.id });
  //     expect(convResponse.error).toBeUndefined();
  //     const conversation = convResponse.data!;
  //     logSuccess(`Created Explore session: ${conversation.id}`);

  //     // Step 17: Ask an exploratory question
  //     const exploreStream = await client.explore.sendMessage(conversation.id, { content: 'Show me AAPL volume' } as any);
  //     expect(isReadableStream(exploreStream)).toBe(true);
  //     logSuccess('Sent exploratory question.');

  //     // Step 18: Interact with the visualization (Get Graph)
  //     const graphResponse = await client.explore.getConversationGraph(conversation.id);
  //     expect(graphResponse.error).toBeUndefined();
  //     expect(graphResponse.data?.items?.length).toBeGreaterThan(0);
  //     logSuccess('Retrieved conversation graph successfully.');
  //   });
});
