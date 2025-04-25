// examples/users-example.ts
import { InfactoryClient } from '../src/client.js';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Get API key from environment variable
const apiKey = process.env.NF_API_KEY;
if (!apiKey) {
  console.error('Error: NF_API_KEY environment variable is not set');
  process.exit(1);
}

// Create a new instance of the InfactoryClient
const client = new InfactoryClient({
  apiKey: apiKey,
});

/**
 * Example function demonstrating how to use the UsersClient
 */
async function usersExample() {
  try {
    console.log('=== Users API Example ===');

    // Get current user information
    console.log('\n1. Getting current user info:');
    const currentUserResponse = await client.users.getCurrentUser();
    if (currentUserResponse.error) {
      console.error('Error getting current user:', currentUserResponse.error);
    } else {
      console.log(
        `Current user: ${currentUserResponse.data?.name} (${currentUserResponse.data?.email})`,
      );
      console.log(
        `Organization: ${currentUserResponse.data?.organization?.name}`,
      );
      console.log(`Teams: ${currentUserResponse.data?.userTeams?.length || 0}`);
    }

    // List all users in the organization
    if (currentUserResponse.data?.organizationId) {
      console.log(
        `\n2. Listing users in organization ${currentUserResponse.data?.organization?.name}:`,
      );
      const usersResponse = await client.users.getUsers(
        currentUserResponse.data.organizationId,
      );
      if (usersResponse.error) {
        console.error('Error listing users:', usersResponse.error);
      } else {
        console.log(`Found ${usersResponse.data?.length || 0} users`);
        usersResponse.data?.forEach((user) => {
          console.log(`- ${user.name} (${user.email}) - ID: ${user.id}`);
        });
      }
    }

    // Get specific user by ID
    if (currentUserResponse.data?.id) {
      console.log(`\n3. Getting specific user by ID:`);
      const userResponse = await client.users.getUser(
        currentUserResponse.data.id,
      );
      if (userResponse.error) {
        console.error('Error getting user:', userResponse.error);
      } else {
        console.log(`User details for ${userResponse.data?.name}:`);
        console.log(JSON.stringify(userResponse.data, null, 2));
      }
    }

    // Get user roles
    console.log(`\n4. Getting roles for current user:`);
    if (currentUserResponse.data?.id) {
      const rolesResponse = await client.users.getUserRoles(
        currentUserResponse.data.id,
      );
      if (rolesResponse.error) {
        console.error('Error getting user roles:', rolesResponse.error);
      } else {
        console.log(`User has ${rolesResponse.data?.length || 0} roles`);
        rolesResponse.data?.forEach((role) => {
          console.log(`- ${role.name}: ${role.description}`);
          console.log(`  Permissions: ${role.permissions.join(', ')}`);
        });
      }
    }

    // Get teams with organizations and projects
    console.log(`\n5. Getting teams, organizations, and projects:`);
    const teamsResponse =
      await client.users.getTeamsWithOrganizationsAndProjects({
        userId: currentUserResponse.data?.id,
      });
    if (teamsResponse.error) {
      console.error('Error getting teams data:', teamsResponse.error);
    } else {
      console.log('Teams with organizations and projects:');
      console.log(JSON.stringify(teamsResponse.data, null, 2));
    }

    // Example of updating a user (commented out to prevent actual changes)
    console.log('\n6. Example of updating a user (not executed):');
    console.log('Code example:');
    console.log(`
  // Update user information
  const updateResponse = await client.users.updateUser('user-id', {
    name: 'Updated Name',
    email: 'updated@example.com',
    role: 'admin'
  });
  `);

    // Example of creating a user (commented out to prevent actual changes)
    console.log('\n7. Example of creating a user (not executed):');
    console.log('Code example:');
    console.log(`
  // Create a new user
  const createResponse = await client.users.createUser({
    email: 'newuser@example.com',
    name: 'New User',
    organizationId: 'org-id',
    role: 'viewer'
  });
  `);

    // Example of deleting a user (commented out to prevent actual changes)
    console.log('\n8. Example of deleting a user (not executed):');
    console.log('Code example:');
    console.log(`
  // Delete a user
  const deleteResponse = await client.users.deleteUser('user-id');
  `);

    // Example of moving a user to a new organization (commented out to prevent actual changes)
    console.log(
      '\n9. Example of moving a user to a new organization (not executed):',
    );
    console.log('Code example:');
    console.log(`
  // Move a user to a new organization
  const moveResponse = await client.users.moveUser('user-id', 'new-org-id');
  `);

    // Example of getting or creating a user, team, and organization (commented out to prevent actual changes)
    console.log(
      '\n10. Example of getting or creating a user, team, and organization (not executed):',
    );
    console.log('Code example:');
    console.log(`
  // Get or create user, team, and organization
  const getOrCreateResponse = await client.users.getOrCreateUserTeamOrganization({
    clerkUserId: 'clerk-user-id',
    email: 'user@example.com',
    name: 'User Name',
    clerkOrgId: 'clerk-org-id',
    organizationName: 'Organization Name',
    platformId: 'platform-id'
  });
  `);

    // Example of adding and removing user roles (commented out to prevent actual changes)
    console.log(
      '\n11. Example of adding and removing user roles (not executed):',
    );
    console.log('Code example:');
    console.log(`
  // Add a role to a user
  const addRoleResponse = await client.users.addUserRole('user-id', 'role-id');
  
  // Remove a role from a user
  const removeRoleResponse = await client.users.removeUserRole('user-id', 'role-id');
  `);

    // Client-side validation examples
    console.log('\n12. Client-side validation examples:');
    try {
      // This will throw an error because we're not providing required parameters
      await client.users.getTeamsWithOrganizationsAndProjects({});
    } catch (error: any) {
      console.log(`Validation caught: ${error.message}`);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the example
usersExample()
  .then(() => console.log('\nUsers example completed'))
  .catch((error) => console.error('Fatal error:', error));
