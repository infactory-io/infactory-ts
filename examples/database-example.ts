// examples/database-example.ts
import { InfactoryClient } from '../src/client.js';
import * as dotenv from 'dotenv';
import {
  ValidateSqlQueryResponse,
  ExtractSqlParametersResponse,
} from '../src/types/common.js';

// Load environment variables from .env file
dotenv.config();

// Get API key from environment variable
const apiKey = process.env.NF_API_KEY;
if (!apiKey) {
  console.error('Error: NF_API_KEY environment variable is not set');
  process.exit(1);
}

// Get base URL from environment variable or use default
const baseURL = process.env.NF_BASE_URL || 'https://api.infactory.ai';

// Create a new instance of the InfactoryClient
const client = new InfactoryClient({
  apiKey: apiKey,
  baseURL: baseURL,
});

console.log(`Using API at: ${baseURL}`);

/**
 * Example function demonstrating how to use database API functionality
 */
async function databaseExample() {
  try {
    console.log('=== Database API Example ===');

    // Get database connection string from environment variable
    const connectionString = process.env.NF_TEST_DB_CONNECTION_STRING;
    if (!connectionString) {
      console.error(
        'Error: NF_TEST_DB_CONNECTION_STRING environment variable is not set',
      );
      console.error('Please set it to a valid PostgreSQL connection string:');
      console.error(
        "Example: export NF_TEST_DB_CONNECTION_STRING='postgres://user:password@localhost:5432/dbname'",
      );
      return;
    }

    // Get table name from environment variable or use default
    const tableName = process.env.NF_TEST_DB_TABLE || 'queryparams';
    const tableNames = [tableName];

    // Create SQL queries based on the table name
    const sqlQuery = `SELECT * FROM ${tableName} LIMIT 10`;
    const samplingSqlQuery = `SELECT * FROM ${tableName} LIMIT 5`;

    console.log(
      `Using database connection: ${connectionString.replace(/:[^:]*@/, ':****@')}`,
    );
    console.log(`Using tables: ${tableNames.join(', ')}`);

    // We'll use the datasources client for database operations
    let datasourcesClient;
    try {
      datasourcesClient = client.datasources;
      console.log('Successfully initialized datasourcesClient');
    } catch (error) {
      console.error('Error initializing datasourcesClient:', error);
      throw error;
    }

    // Get projects to find one to use
    console.log('Getting available projects...');
    let projectsResponse;
    try {
      projectsResponse = await client.projects.getProjects();
      console.log('Successfully retrieved projects');
    } catch (error) {
      console.error('Error retrieving projects:', error);
      throw error;
    }

    if (
      projectsResponse.error ||
      !projectsResponse.data ||
      projectsResponse.data.length === 0
    ) {
      console.error(
        'Error getting projects or no projects found:',
        projectsResponse.error,
      );
      return;
    }

    // Find a project to work with
    const firstProject = projectsResponse.data[0];
    const projectId = firstProject.id;
    console.log(`Using project: ${firstProject.name} (${projectId})`);

    // Create a datasource for the database connection
    console.log('\n1. Creating a datasource for the database connection:');
    const createDatasourceResponse = await client.datasources.createDatasource({
      name: 'Database Connection Example',
      projectId: projectId,
      type: 'DATABASE',
      description: 'A datasource for demonstrating database API functionality',
    });

    if (createDatasourceResponse.error) {
      console.error(
        'Error creating datasource:',
        createDatasourceResponse.error,
      );
      return;
    }

    const datasourceId = createDatasourceResponse.data?.id;
    console.log(
      `Created datasource: ${createDatasourceResponse.data?.name} (ID: ${datasourceId})`,
    );

    // We'll use the databaseApi functions directly
    // No need for the HTTP client anymore

    // EXAMPLE 1: Test database connection
    console.log('\n2. Testing database connection:');
    try {
      // Use the datasourcesClient for database operations
      // Note: The client method will convert camelCase to snake_case internally
      console.log(
        'About to call testDatabaseConnection with:',
        connectionString.replace(/:[^:]*@/, ':****@'),
      );
      const testConnectionResponse =
        await datasourcesClient.testDatabaseConnection(connectionString);

      if (testConnectionResponse.error) {
        console.error('Error testing connection:');
        if (
          testConnectionResponse.error.details &&
          testConnectionResponse.error.details.detail
        ) {
          console.error(
            'Details:',
            JSON.stringify(
              testConnectionResponse.error.details.detail,
              null,
              2,
            ),
          );
        }
        console.error(
          'Please check that your database connection string is correct and the database is accessible.',
        );
      } else {
        console.log('Connection test result:');
        // Type assertion for the response data
        const testData = testConnectionResponse.data as {
          success: boolean;
          tables: Array<any>;
        };
        console.log(`- Success: ${testData.success}`);
        console.log(`- Tables found: ${testData.tables?.length || 0}`);
        if (testData.tables && testData.tables.length > 0) {
          console.log('Sample tables:');
          testData.tables.slice(0, 3).forEach((table: any, index: number) => {
            console.log(
              `  ${index + 1}. ${table.name} - Rows: ~${
                table.estimatedRows
              }, Size: ${table.estimatedSize}, Columns: ${table.columnCount}`,
            );
          });
        }
      }
    } catch (error) {
      console.error('Error in test connection:', error);
      console.error(
        'Make sure your database is running and accessible from your current network.',
      );
    }

    // EXAMPLE 2: Sample database tables
    console.log('\n3. Sampling database tables:');
    try {
      // Use the datasourcesClient for database operations
      // Note: The client method will convert camelCase to snake_case internally
      const sampleTablesResponse = await datasourcesClient.sampleDatabaseTables(
        {
          connectionString, // Will be converted to connection_string
          tableNames, // Will be converted to table_names
          projectId, // Will be converted to project_id
          datasourceId, // Will be converted to datasource_id
          name: 'Sampled Tables Example',
        },
      );

      if (sampleTablesResponse.error) {
        console.error('Error sampling tables:');
        if (
          sampleTablesResponse.error.details &&
          sampleTablesResponse.error.details.detail
        ) {
          console.error(
            'Details:',
            JSON.stringify(sampleTablesResponse.error.details.detail, null, 2),
          );
        }
        console.error(
          'Please check that your database connection string is correct and the specified tables exist.',
        );
      } else {
        console.log('Sample tables result:');
        // Type assertion for the response data
        const sampleData = sampleTablesResponse.data as {
          dataObjects: Record<string, string>;
          jobs: Array<any>;
        };
        console.log(
          `- Data Objects: ${Object.keys(sampleData.dataObjects || {}).length}`,
        );
        console.log(`- Jobs created: ${sampleData.jobs?.length || 0}`);

        if (sampleData.jobs && sampleData.jobs.length > 0) {
          console.log('Jobs:');
          sampleData.jobs.forEach((job: any, index: number) => {
            console.log(`  ${index + 1}. Job Type: ${job.jobType}`);
            console.log(`     Project ID: ${job.projectId}`);
          });
        }
      }
    } catch (error) {
      console.error('Error in sample tables:', error);
      console.error(
        'Make sure your database is running and the specified tables exist.',
      );
    }

    // EXAMPLE 3: Execute custom SQL
    console.log('\n4. Executing custom SQL:');
    try {
      // Use the datasourcesClient for database operations
      // Note: The client method will convert camelCase to snake_case internally
      const executeCustomSqlResponse = await datasourcesClient.executeCustomSql(
        {
          connectionString, // Will be converted to connection_string
          sqlQuery, // Will be converted to sql_query
          samplingSqlQuery, // Will be converted to sampling_sql_query
          projectId, // Will be converted to project_id
          datasourceId, // Will be converted to datasource_id
          name: 'Custom SQL Example',
        },
      );

      if (executeCustomSqlResponse.error) {
        console.error('Error executing custom SQL:');
        if (
          executeCustomSqlResponse.error.details &&
          executeCustomSqlResponse.error.details.detail
        ) {
          console.error(
            'Details:',
            JSON.stringify(
              executeCustomSqlResponse.error.details.detail,
              null,
              2,
            ),
          );
        }
        console.error(
          'Please check that your SQL query is valid and the database is accessible.',
        );
      } else {
        console.log('Execute custom SQL result:');
        // Type assertion for the response data
        const sqlData = executeCustomSqlResponse.data as { jobs: Array<any> };
        console.log(`- Jobs created: ${sqlData.jobs?.length || 0}`);

        if (sqlData.jobs && sqlData.jobs.length > 0) {
          console.log('Jobs:');
          sqlData.jobs.forEach((job: any, index: number) => {
            console.log(`  ${index + 1}. Job Type: ${job.jobType}`);
            console.log(`     Project ID: ${job.projectId}`);
            console.log(
              `     Metadata: ${JSON.stringify(job.metadata, null, 2)}`,
            );
          });
        }
      }
    } catch (error) {
      console.error('Error in execute custom SQL:', error);
      console.error(
        'Make sure your SQL query is valid for your database schema.',
      );
    }

    // EXAMPLE 4: Validate SQL syntax
    console.log('\n5. Validating SQL syntax:');
    try {
      // Use the datasourcesClient for database operations
      // Note: The client method will convert camelCase to snake_case internally
      const validateSqlSyntaxResponse =
        await datasourcesClient.validateSqlSyntax({
          connectionString, // Will be converted to connection_string
          sqlQuery, // Will be converted to sql_query
        });

      if (validateSqlSyntaxResponse.error) {
        console.error(
          'Error validating SQL syntax:',
          validateSqlSyntaxResponse.error,
        );
        console.error(
          'Please check that your SQL query syntax is correct for your database type.',
        );
      } else {
        console.log('SQL syntax validation result:');
        // Type assertion for the response data
        const syntaxData = validateSqlSyntaxResponse.data as {
          valid: boolean;
          message?: string;
        };
        console.log(`- Valid: ${syntaxData.valid}`);
        if (syntaxData.message) {
          console.log(`- Message: ${syntaxData.message}`);
        }
      }
    } catch (error) {
      console.error('Error in validate SQL syntax:', error);
      console.error(
        'Make sure your SQL query syntax is correct for your database type.',
      );
    }

    // EXAMPLE 5: Validate SQL query (row count)
    console.log('\n6. Validating SQL query (row count):');
    try {
      // Use the datasourcesClient for database operations
      // Note: The client method will convert camelCase to snake_case internally
      const validateSqlQueryResponse = await datasourcesClient.validateSqlQuery(
        {
          connectionString, // Will be converted to connection_string
          sqlQuery, // Will be converted to sql_query
        },
      );

      if (validateSqlQueryResponse.error) {
        console.error(
          'Error validating SQL query:',
          validateSqlQueryResponse.error,
        );
        console.error(
          'Please check that your SQL query is valid and the max_rows parameter is appropriate.',
        );
      } else {
        console.log('SQL query validation result:');
        // Use the proper type from the imported interfaces
        const queryData =
          validateSqlQueryResponse.data as ValidateSqlQueryResponse;
        console.log(`- Valid: ${queryData.valid}`);
        console.log(`- Row Count: ${queryData.rowCount}`);
        if (queryData.message) {
          console.log(`- Message: ${queryData.message}`);
        }
      }
    } catch (error) {
      console.error('Error in validate SQL query:', error);
      console.error(
        'Make sure your SQL query is valid and returns fewer rows than max_rows.',
      );
    }

    // EXAMPLE 6: Extract SQL parameters
    console.log('\n7. Extracting SQL parameters:');
    try {
      // Use a SQL query with parameters for this example
      const parameterizedSqlQuery =
        "SELECT * FROM users WHERE status = '{{status}}' AND created_at > '{{start_date}}'";

      // Use the datasourcesClient for database operations
      const extractSqlParametersResponse =
        await datasourcesClient.extractSqlParameters(parameterizedSqlQuery);

      if (extractSqlParametersResponse.error) {
        console.error(
          'Error extracting SQL parameters:',
          extractSqlParametersResponse.error,
        );
        console.error(
          'Please check that your SQL query contains properly formatted parameters like {{parameter_name}}.',
        );
      } else {
        console.log('SQL parameters extraction result:');
        // Use the proper type from the imported interfaces
        const paramsData =
          extractSqlParametersResponse.data as ExtractSqlParametersResponse;
        console.log(
          `- Parameters found: ${paramsData.parameters?.length || 0}`,
        );
        console.log(`- Parsed Query: ${paramsData.parsedQuery}`);

        if (paramsData.parameters && paramsData.parameters.length > 0) {
          console.log('Parameters:');
          paramsData.parameters.forEach((param: any, index: number) => {
            console.log(`  ${index + 1}. ${param.displayName}`);
            console.log(`     Type: ${param.type}`);
            console.log(`     Field: ${param.field}`);
            console.log(`     Operator: ${param.operator}`);
            console.log(`     Value: ${param.value}`);
          });
        }
      }
    } catch (error) {
      console.error('Error in extract SQL parameters:', error);
      console.error(
        'Make sure your SQL query contains properly formatted parameters like {{parameter_name}}.',
      );
    }

    // Clean up the created datasource
    if (datasourceId) {
      console.log('\nCleaning up - Deleting the datasource:');
      const deleteResponse =
        await client.datasources.deleteDatasource(datasourceId);
      if (deleteResponse.error) {
        console.error('Error deleting datasource:', deleteResponse.error);
      } else {
        console.log('Datasource deleted successfully');
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the example with better error handling
try {
  databaseExample()
    .then(() => console.log('\nDatabase example completed'))
    .catch((error: unknown) => {
      console.error('Fatal error in databaseExample():', error);
      if (error instanceof Error && error.stack) {
        console.error('Stack trace:', error.stack);
      }
    });
} catch (error: unknown) {
  console.error('Exception caught at top level:', error);
  if (error instanceof Error && error.stack) {
    console.error('Stack trace:', error.stack);
  }
}
