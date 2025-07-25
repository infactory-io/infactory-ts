# End-to-End Quick-Start using TypeScript SDK

This document outlines the end-to-end quick-start scenario for the Infactory TypeScript SDK, as demonstrated in the E2E test (`e2e.test.ts`).

It automates the typical user workflow: sign-in → create a project → connect data (`stocks.csv`) → build & deploy queries → exercise live APIs → explore results → clean up.

Run this

    npm run test:e2e:quickstart

## Setup: Initialize Client and Create Sandbox Project

- **Action**: Before tests run, a new `InfactoryClient` is instantiated. A fresh project is created to isolate the test artifacts. A local `stocks.csv` file is also generated for the test.
- **Purpose**: Ensure a clean, isolated environment for the test run.
- **SDK Method(s)**
  - `new InfactoryClient({ apiKey, baseURL })`
  - `client.projects.createProject({ name, teamId })`
- **Done when**: The client is ready and a new project ID is successfully retrieved.

---

## 1. Sign in and retrieve user profile

- **Action**: Fetch the current authenticated user's profile.
- **Purpose**: Establish a valid session and confirm API key authentication.
- **SDK Method(s)**
  - `client.users.getCurrentUser()`
- **Done when**: The call returns a **2xx** status with a valid user payload.

## 2. Inspect existing projects

- **Action**: List all projects accessible to the user.
- **Purpose**: Confirm the client can read project-level resources.
- **SDK Method(s)**
  - `client.projects.getProjects(teamId)`
- **Done when**: The project list is returned and contains the newly created sandbox project.

## 3. Connect Data & Wait for Schema

- **Action**: Upload the local `stocks.csv` file to the sandbox project and wait for the service to process it.
- **Purpose**: Seed the project with data and wait for Infactory's AI to infer the data schema, making it queryable.
- **SDK Method(s)**
  1. `client.datasources.getProjectDatasources(projectId)` – Verify no datasource exists initially.
  2. `client.datasources.uploadCsvFile(projectId, ...)` – A helper method to create the datasource and upload the file in one step.
  3. Poll `client.datasources.getDatasource(datasourceId)` until the response object's `status` property is `"ready"`.
- **Done when**: The datasource `status` is `"ready"`, indicating schema inference is complete.

## 4. List & Run Autogenerated Queries

- **Action**: Generate and execute starter queries based on the connected data.
- **Purpose**: Validate that the platform can automatically suggest relevant queries and that the data is queryable.
- **SDK Method(s)**
  1. `client.build.createCues({ projectId, ... })` – Request autogenerated query programs.
  2. Poll `client.queryPrograms.listQueryPrograms({ projectId })` until the expected number of queries appear.
  3. `client.queryPrograms.evaluateQueryProgramSync(projectId, queryProgramId)` – Execute one of the new queries.
- **Done when**: The query execution completes successfully and returns a non-empty result set.

## 5. Create & Execute an AI-Generated Query

- **Action**: Create a new query program from a natural language question and run it.
- **Purpose**: Test the natural-language-to-code generation feature of the SDK.
- **SDK Method(s)**
  1. `client.build.createQueryProgram({ projectId, question })` – Ask a question like "What is the average trading volume for each symbol?".
  2. `client.queryPrograms.evaluateQueryProgramSync(projectId, queryProgramId)` – Run the newly created query.
- **Done when**: The AI generates a valid query program, which then executes and returns the correct, verifiable data.

## 6. Deploy & Test a Query as a Live API

- **Action**: Publish a query program as a REST API endpoint and then call it.
- **Purpose**: Test the full "build-to-deploy" lifecycle, making custom logic available externally.
- **SDK Method(s)**
  1. `client.queryPrograms.publishQueryProgram(queryProgramId)` – Deploys the query.
  2. Poll `client.apis.getProjectApis(projectId)` – Wait for the deployed API to appear in the project's API list.
  3. `client.apis.getApiEndpoints(apiId)` – Retrieve the specific endpoint path.
  4. `client.live.callCustomEndpoint(slug, version, path)` – Call the live API.
- **Done when**: The live API endpoint returns a **2xx** status with data matching the original query's output.

## 7. Test the Unified Chat Endpoint

- **Action**: Ask a question to the project's conversational chat endpoint, which can route the request to a deployed API (tool).
- **Purpose**: Show how natural language can be used to interact with deployed tools in a conversational context.
- **SDK Method(s)**
  - `client.run.chatCompletions(projectId, { messages, model })`
- **Done when**: The streaming response indicates the correct tool was used and returns the expected data.

## 8. Use the Explore Chat & Visualization Graph

- **Action**: Create a new "Explore" session, ask a question, and retrieve the resulting conversation graph.
- **Purpose**: Test the conversational analytics and visualization capabilities.
- **SDK Method(s)**
  1. `client.explore.createConversation({ projectId })` – Starts a new session.
  2. `client.explore.sendMessage(conversationId, { content, ... })` – Asks a question in the session.
  3. `client.explore.getConversationGraph(conversationId)` – Retrieves the graph of messages and data interactions.
- **Done when**: All calls return a **2xx** status, and the final graph object contains the expected message and data nodes.

---

## Teardown: Clean Up Resources

- **Action**: In `afterAll`, the test deletes the resources it created.
- **Purpose**: Keep the tenant clean for future repeatable tests.
- **SDK Method(s)**
  - `client.datasources.deleteDatasource(datasourceId)`
  - `client.projects.deleteProject(projectId)`
- **Done when**: Both `DELETE` calls return a **2xx** status.

## Success Criteria Summary

- Every SDK method call above completes without errors.
- Query data is non-empty and consistent across the initial run, the live API endpoint, and the chat endpoint.
- All test artifacts (project, datasource) are successfully removed during cleanup.
