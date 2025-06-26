import { InfactoryClient } from '../src/client.js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config();

// Get API key from environment variables
const apiKey = process.env.NF_API_KEY;
if (!apiKey) {
  console.error('Error: NF_API_KEY environment variable is not set');
  process.exit(1);
}

// Create a new instance of the InfactoryClient
const client = new InfactoryClient({
  apiKey: apiKey,
  baseURL: process.env.NF_BASE_URL || 'https://api.infactory.ai',
});

/**
 * Example function demonstrating how to use the ProjectsClient
 */
async function projectsExample() {
  try {
    console.info('=== Projects API Example ===');

    // First, get a list of organizations and teams to work with
    console.info('\n1. Fetching organizations:');
    const organizationsResponse = await client.organizations.list();
    if (organizationsResponse.error) {
      console.error(
        'Error fetching organizations:',
        organizationsResponse.error,
      );
      return;
    }

    if (
      !organizationsResponse.data ||
      organizationsResponse.data.length === 0
    ) {
      console.error(
        'No organizations found. Please create an organization first.',
      );
      return;
    }

    // Use the first organization for this example
    const organization = organizationsResponse.data[0];
    console.info(
      `Using organization: ${organization.name} (ID: ${organization.id})`,
    );

    // Get teams for this organization
    console.info(`\n2. Fetching teams for organization ${organization.id}:`);
    const teamsResponse = await client.teams.getTeams(organization.id);
    if (teamsResponse.error) {
      console.error('Error fetching teams:', teamsResponse.error);
      return;
    }

    if (!teamsResponse.data || teamsResponse.data.length === 0) {
      console.error('No teams found. Please create a team first.');
      return;
    }

    // Use the first team for this example
    const team = teamsResponse.data[0];
    console.info(`Using team: ${team.name} (ID: ${team.id})`);

    // List all projects for this team
    console.info(`\n3. Listing projects for team ${team.id}:`);
    const projectsResponse = await client.projects.getTeamProjects(team.id);
    if (projectsResponse.error) {
      console.error('Error listing projects:', projectsResponse.error);
    } else {
      console.info(`Found ${projectsResponse.data?.length || 0} projects`);
      if (projectsResponse.data && projectsResponse.data.length > 0) {
        projectsResponse.data.forEach((project) => {
          console.info(`- ${project.name} (ID: ${project.id})`);
        });

        // Get details for the first project
        const firstProject = projectsResponse.data[0];
        console.info(`\n4. Getting details for project ${firstProject.id}:`);

        const projectResponse = await client.projects.getProject(
          firstProject.id,
          team.id,
        );
        if (projectResponse.error) {
          console.error('Error getting project:', projectResponse.error);
        } else {
          console.info('Project details:');
          console.info(JSON.stringify(projectResponse.data, null, 2));
        }
      } else {
        console.info('No projects found for this team');
      }
    }

    // Create a new project example
    console.info(`\n5. Creating a new project in team ${team.id}:`);
    const projectName = `Test Project ${new Date().toISOString().split('T')[0]} ${Math.random().toString(36).substring(2, 7)}`;
    const createResponse = await client.projects.createProject({
      name: projectName,
      description: 'A project created via the SDK example',
      teamId: team.id,
    });

    if (createResponse.error) {
      console.error('Error creating project:', createResponse.error);
    } else {
      console.info('Project created:');
      console.info(JSON.stringify(createResponse.data, null, 2));

      const projectId = createResponse.data?.id;
      if (!projectId) {
        console.error('Error creating project: Project ID is missing');
        return;
      }

      // Update the created project
      console.info(`\n6. Updating project ${projectId}:`);
      try {
        const updateResponse = await client.projects.updateProject(projectId, {
          description: 'Updated description via SDK example',
          teamId: team.id,
        });
        console.info('Update response:');
        // Properly display the update response
        if (updateResponse.data) {
          console.info(JSON.stringify(updateResponse.data, null, 2));
        }
        if (updateResponse.error) {
          console.info('Error message:', updateResponse.error.message);
          console.info(
            'Full error details:',
            JSON.stringify(updateResponse.error, null, 2),
          );
        }
        if (updateResponse.error) {
          console.error('Error updating project:', updateResponse.error);
        } else {
          console.info('Project updated:');
          console.info(JSON.stringify(updateResponse.data, null, 2));
        }
      } catch (error) {
        console.error('Error updating project:', error);
      }

      // Export the project (commented out to avoid file system operations in examples)
      /*
      console.info(`\n7. Exporting project ${projectId}:`);
      const exportResponse = await client.projects.exportProject(projectId, team.id);
      if (exportResponse.error) {
        console.error('Error exporting project:', exportResponse.error);
      } else {
        console.info('Project exported successfully');
        console.info('Export data:', exportResponse.data);
      }
      */

      // Delete the created project
      console.info(`\n7. Deleting project ${projectId}:`);

      const deleteResponse = await client.projects.deleteProject(projectId);
      if (deleteResponse.error) {
        console.error('Error deleting project:', deleteResponse.error);
      } else {
        console.info('Project deleted successfully');
      }
    }

    // Example of project client-side validation
    console.info('\n8. Client-side validation:');
    try {
      // Creating a project with an empty name should fail
      await client.projects.createProject({
        name: '',
        teamId: team.id,
      });
    } catch (validationError) {
      console.info(
        'Validation caught invalid parameters:',
        (validationError as Error).message,
      );
    }

    try {
      // Creating a project without a team ID should fail
      await client.projects.createProject({
        name: 'Valid Project Name',
        teamId: '',
      });
    } catch (validationError) {
      console.info(
        'Validation caught missing team ID:',
        (validationError as Error).message,
      );
    }

    // Example of project import and validation (commented out to avoid file system operations)
    /*
    console.info('\n9. Project import and validation:');
    
    // Create a simple project file for import testing
    const projectFile = new File(
      [JSON.stringify({ name: 'Imported Project', description: 'Imported via SDK' })],
      'project-import.json',
      { type: 'application/json' }
    );
    
    // Validate the import file
    const validateResponse = await client.projects.validateImport(projectFile);
    if (validateResponse.error) {
      console.error('Error validating project import:', validateResponse.error);
    } else {
      console.info('Project import validation:');
      console.info(JSON.stringify(validateResponse.data, null, 2));
      
      // Import the project if validation passed
      if (validateResponse.data.valid) {
        const importResponse = await client.projects.importProject(team.id, projectFile);
        if (importResponse.error) {
          console.error('Error importing project:', importResponse.error);
        } else {
          console.info('Project imported successfully:');
          console.info(JSON.stringify(importResponse.data, null, 2));
          
          // Clean up by deleting the imported project
          const importedProjectId = importResponse.data.project.id;
          await client.projects.deleteProject(importedProjectId);
          console.info(`Imported project ${importedProjectId} cleaned up.`);
        }
      }
    }
    */
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the example
projectsExample()
  .then(() => console.info('\nProjects example completed'))
  .catch((error) => console.error('Fatal error:', error));
