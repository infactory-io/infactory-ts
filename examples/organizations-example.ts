import { InfactoryClient } from '../src/client.js';
import * as dotenv from 'dotenv';

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
 * Example function demonstrating how to use the OrganizationsClient
 */
async function organizationsExample() {
    try {
        console.log('=== Organizations API Example ===');

        // List all organizations
        console.log('\n1. Listing all organizations:');
        const organizationsResponse = await client.organizations.list();
        if (organizationsResponse.error) {
            console.error('Error listing organizations:', organizationsResponse.error);
        } else {
            console.log(`Found ${organizationsResponse.data?.length || 0} organizations`);
            if (organizationsResponse.data && organizationsResponse.data.length > 0) {
                organizationsResponse.data.forEach((organization) => {
                    console.log(`- ${organization.name} (ID: ${organization.id})`);
                });

                // Get details for the first organization
                const firstOrgId = organizationsResponse.data[0].id;
                console.log(`\n2. Getting details for organization ${firstOrgId}:`);

                const organizationResponse = await client.organizations.get(firstOrgId);
                if (organizationResponse.error) {
                    console.error('Error getting organization:', organizationResponse.error);
                } else {
                    console.log('Organization details:');
                    console.log(JSON.stringify(organizationResponse.data, null, 2));

                    // List teams for this organization
                    //   console.log(`\n3. Listing teams for organization ${firstOrgId}:`);
                    //   const teamsResponse = await client.teams.getTeams(firstOrgId);
                    //   if (teamsResponse.error) {
                    //     console.error('Error listing teams:', teamsResponse.error);
                    //   } else {
                    //     console.log(`Found ${teamsResponse.data?.length || 0} teams`);
                    //     teamsResponse.data?.forEach((team) => {
                    //       console.log(`- ${team.name} (ID: ${team.id})`);
                    //     });
                    //   }
                }
            }
        }

        // Create a new organization example (commented out to prevent accidental creation)
        /*
        console.log('\n4. Creating a new organization:');
        const createResponse = await client.organizations.create({
          name: 'Example Organization',
          description: 'An organization created via the SDK example',
          platformId: 'platform-id', // Replace with an actual platform ID
        });
        
        if (createResponse.error) {
          console.error('Error creating organization:', createResponse.error);
        } else {
          console.log('Organization created:');
          console.log(JSON.stringify(createResponse.data, null, 2));
          
          // Update the created organization
          const orgId = createResponse.data!.id;
          console.log(`\n5. Updating organization ${orgId}:`);
          
          const updateResponse = await client.organizations.update(orgId, {
            description: 'Updated description via SDK example'
          });
          
          if (updateResponse.error) {
            console.error('Error updating organization:', updateResponse.error);
          } else {
            console.log('Organization updated:');
            console.log(JSON.stringify(updateResponse.data, null, 2));
          }
          
          // Delete the created organization
          console.log(`\n6. Deleting organization ${orgId}:`);
          
          const deleteResponse = await client.organizations.delete(orgId);
          if (deleteResponse.error) {
            console.error('Error deleting organization:', deleteResponse.error);
          } else {
            console.log('Organization deleted successfully');
          }
        }
        */

        // Example of organization client-side validation
        console.log('\n7. Client-side validation:');
        try {
            // @ts-ignore - Intentionally passing invalid parameters for demonstration
            await client.organizations.create({
                name: '' // Empty name should be invalid
            });
        } catch (validationError) {
            console.log('Validation caught invalid parameters:', (validationError as Error).message);
        }

    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

// Run the example
organizationsExample()
    .then(() => console.log('\nOrganizations example completed'))
    .catch(error => console.error('Fatal error:', error));
