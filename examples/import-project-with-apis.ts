import { InfactoryClient } from '../src/client.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables from .env file
dotenv.config();

const importFilePath = process.env.NF_IMPORT_PROJECT_FILE;
const importApiKey = process.env.NF_IMPORT_PROJECT_APIKEY;
const apiKey = process.env.NF_API_KEY;
const baseURL = process.env.NF_BASE_URL || 'https://api.infactory.ai';

if (!importFilePath) {
  console.error(
    'Error: NF_IMPORT_PROJECT_FILE environment variable is not set',
  );
  process.exit(1);
}
if (!importApiKey) {
  console.error(
    'Error: NF_IMPORT_PROJECT_APIKEY environment variable is not set',
  );
  process.exit(1);
}
if (!apiKey) {
  console.error('Error: NF_API_KEY environment variable is not set');
  process.exit(1);
}
if (!fs.existsSync(importFilePath)) {
  console.error(`Error: Import file not found at ${importFilePath}`);
  process.exit(1);
}

console.log(`Using API base URL: ${baseURL}`);
console.log(`Import file: ${importFilePath}`);

const client = new InfactoryClient({
  apiKey: apiKey,
  baseURL: baseURL,
});

async function main() {
  //   try {
  // 1. Get current user and pick a team to import into
  const userResp = await client.users.getCurrentUser();
  if (userResp.error || !userResp.data) {
    throw new Error('Could not get current user');
  }
  const email = userResp.data.email;
  const teamsResp = await client.users.getTeamsWithOrganizationsAndProjects({
    email,
  });
  if (teamsResp.error || !teamsResp.data?.teams?.length) {
    throw new Error('Could not get user teams');
  }
  const team = teamsResp.data.teams[0];
  console.log(`Importing into team: ${team.name} (${team.id})`);

  // 2. Import project using SDK with file path
  // The SDK will handle creating the FormData with the correct fields internally
  console.log('Importing project...');
  const importResp = await client.projects.importProject(
    team.id,
    importFilePath as string,
    { conflictStrategy: 'rename' },
  );
  if (importResp.error) {
    throw new Error(`Import failed: ${JSON.stringify(importResp.error)}`);
  }

  // Handle the successful response format from the server
  // The server returns: { success, message, project_id, project_name }
  const projectId = importResp.data?.project_id;
  const projectName = importResp.data?.project_name;
  const message = importResp.data?.message;

  if (!projectId || !projectName) {
    console.warn(
      'Project imported but response format was unexpected:',
      importResp.data,
    );
  } else {
    console.log(`Imported project: ${projectName} (${projectId})`);
    console.log(`Server message: ${message}`);
  }

  // 4. List connections (datasources)
  if (!projectId) {
    console.error('Cannot list datasources: projectId is undefined');
    throw new Error('Project ID is required');
  }
  const datasourcesResp = await client.datasources.getProjectDatasources(
    projectId as string,
  );
  if (datasourcesResp.error) {
    throw new Error('Failed to list datasources');
  }
  console.log(
    `Connections/datasources (${datasourcesResp.data?.length || 0}):`,
  );
  (datasourcesResp.data || []).forEach((ds: any) => {
    console.log(`- ${ds.name} (${ds.id}) [${ds.type}]`);
  });

  // 5. List query programs
  const qpResp = await client.queryPrograms.listQueryPrograms({
    projectId: projectId,
  });
  if (qpResp.error) {
    throw new Error('Failed to list query programs');
  }
  const queryPrograms = qpResp.data || [];
  console.log(`Query programs (${queryPrograms.length}):`);
  queryPrograms.forEach((qp) => {
    console.log(`- ${qp.name} (${qp.id})`);
  });

  // 6. Evaluate each query program
  for (const qp of queryPrograms) {
    console.log(`\nEvaluating query program: ${qp.name} (${qp.id})`);
    try {
      if (!projectId) {
        console.error('Cannot evaluate query program: projectId is undefined');
        continue;
      }
      const result = await client.queryPrograms.evaluateQueryProgramSync(
        projectId,
        qp.id,
      );
      if (result.error) {
        console.error(
          `Error evaluating query program ${qp.name}:`,
          result.error.message,
        );
      } else {
        const outputFile = `example-import-project-${projectId}.jsonl`;
        fs.appendFileSync(
          outputFile,
          JSON.stringify({
            queryProgramId: qp.id,
            queryProgramName: qp.name,
            result: result.data,
          }) + '\n',
        );
        console.log(`Saved evaluation result to ${outputFile}`);
      }
    } catch (err) {
      console.error(`Exception evaluating query program ${qp.name}:`, err);
    }
  }

  //     console.log('\nAll done.');
  //   } catch (err) {
  //     console.error('Error in import-project-with-apis example:', err);
  //     process.exit(1);
  //   }
}

main();
