# Infactory SDK: End-to-End SaaS Usage Monitoring Example

This directory contains an end-to-end example demonstrating how a developer building a SaaS product can use the `@infactory/infactory-ts` SDK to monitor application usage stored in a Postgres database.

The script performs the following actions:

1.  Initializes the Infactory client.
2.  Creates a new Infactory project.
3.  Registers the SaaS application's Postgres database as a datasource.
4.  Generates several `QueryProgram`s based on common SaaS usage questions (e.g., user signups, feature usage).
5.  Publishes these `QueryProgram`s as API endpoints under a newly created API.
6.  Retrieves and prints the OpenAPI specification for the generated API.
7.  Demonstrates interacting with the project's data via the chat endpoint.
8.  Provides instructions on how to use the generated OpenAPI specification with a tool like Claude to build a visualization dashboard.

## Prerequisites

Before running this example, ensure you have the following:

- **Node.js and npm/yarn:** Installed on your system (Node.js >= 18 recommended).
- **Infactory API Key:** Obtain an API key from the [Infactory Workshop](https://workshop.infactory.ai/api-keys).
- **Postgres Database:** A running Postgres database for your SaaS application containing usage data (e.g., tables for `users`, `events`, `subscriptions`).
- **Postgres Connection String:** The connection string for your database (e.g., `postgresql://user:password@host:port/database`).

## Setup

1.  **Save the Script:** Ensure the example script `monitor-saas-usage.ts` (provided in the previous response) is saved in your project directory.

2.  **Install Dependencies:** Navigate to your project directory in the terminal and install the necessary dependencies:

    ```bash
    # Using npm
    npm install @infactory/infactory-ts dotenv crypto node-fetch@^3 form-data tsx

    # OR Using yarn
    yarn add @infactory/infactory-ts dotenv crypto node-fetch@^3 form-data tsx
    ```

    _(Note: `tsx` is used for running the TypeScript script directly. You might install it globally `npm install -g tsx` or use `npx tsx`)_.

3.  **Create `.env` File:** Create a file named `.env` in the same directory as the script and add your Infactory API key and Postgres connection string:

    ```dotenv
    # Replace with your actual Infactory API Key
    NF_API_KEY=if_pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

    # Replace with your actual Postgres Connection String
    DB_CONNECTION_STRING=postgresql://your_db_user:your_db_password@your_db_host:5432/your_db_name
    ```

    **Important:** Keep this file secure and do not commit it to version control.

## Running the Example

Execute the script from your terminal:

```bash
tsx monitor-saas-usage.ts
```

The script will log its progress for each step.

## What the Script Does

- **Initialization:** Connects to the Infactory API using your key.
- **Project Setup:** Finds an existing team or prompts if none exist, then creates a new Infactory project specifically for this monitoring task.
- **Datasource Registration:** Creates a datasource entry in the project representing your Postgres database. The connection string itself is assumed to be securely handled by the Infactory platform (you might need to confirm connection details in the Workshop).
- **Query Generation:** Translates predefined questions about SaaS usage (like signup counts, feature use) into `QueryProgram` creation requests. Infactory's AI uses these requests and the database schema context (once analyzed) to build executable queries.
- **API Publishing:** Creates an `API` container object. Then, for each successfully generated `QueryProgram`, it publishes the query and creates a corresponding `APIEndpoint` (e.g., `GET /saas-usage-xxxx/v1/total-users`).
- **OpenAPI Specification:** Fetches the complete OpenAPI v3 specification for the newly created API and its endpoints. **This specification is printed directly to your console.**
- **Chat Demonstration:** Shows how to create a chat conversation linked to the project and ask a question about the data.
- **Visualization Guidance:** Instructs you on the next steps using the printed OpenAPI specification.

## Expected Output

The script will output logs to the console indicating the success or failure of each step:

- Client initialization status.
- IDs of the created project, datasource, API, and endpoints.
- Status of query generation and publishing.
- **Crucially, the full OpenAPI specification JSON will be printed between `--- BEGIN OPENAPI SPECIFICATION ---` and `--- END OPENAPI SPECIFICATION ---` markers.**
- Logs from the chat interaction demonstration.
- Final instructions for using the OpenAPI spec.

## Next Steps: Visualization

After the script completes successfully:

1.  **Copy the OpenAPI Specification:** Select and copy the entire JSON object printed between the `--- BEGIN ---` and `--- END ---` markers in your console output.
2.  **Use an LLM/Tool (like Claude):** Paste the copied specification into an AI assistant like Anthropic's Claude.
3.  **Prompt for Dashboard Generation:** Use a prompt similar to the one provided in the script's final output step to ask the AI to generate a single-page HTML/CSS/JavaScript dashboard based on the specification.
4.  **Deploy and Use:**
    - Save the generated code as an HTML file.
    - Open the HTML file in your browser (you might need a simple local web server).
    - The generated dashboard will likely require you to input your Infactory API key (as a Bearer token) to authenticate the requests it makes to the newly created API endpoints.
    - View your SaaS usage metrics visualized!

## Troubleshooting & Notes

- **Database Connection:** Ensure your `DB_CONNECTION_STRING` is correct and that the Infactory platform can reach your database if required for schema analysis or direct querying (network rules, firewall).
- **Schema Analysis:** Depending on the platform's behavior, you might need to visit the Infactory Workshop after creating the datasource to trigger or confirm the database schema analysis. This context is vital for successful query generation.
- **API Path Uniqueness:** The script uses random characters in the API base path (`/saas-usage-xxxx/v1`) to avoid conflicts. Note the specific path generated in your run.
- **Rate Limits:** The script includes small delays between some API calls to mitigate potential rate limiting. If you encounter issues, you might need to adjust these delays.
