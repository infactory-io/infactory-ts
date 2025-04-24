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
 * Example function demonstrating how to use the PlatformsClient
 */
async function platformsExample() {
  try {
    console.log('=== Platforms API Example ===');
    
    // List all platforms
    console.log('\n1. Listing all platforms:');
    const platformsResponse = await client.platforms.list();
    if (platformsResponse.error) {
      console.error('Error listing platforms:', platformsResponse.error);
    } else {
      console.log(`Found ${platformsResponse.data?.length || 0} platforms`);
      if (platformsResponse.data && platformsResponse.data.length > 0) {
        platformsResponse.data.forEach((platform) => {
          console.log(`- ${platform.name} (ID: ${platform.id})`);
        });
        
        // Get details for the first platform
        const firstPlatformId = platformsResponse.data[0].id;
        console.log(`\n2. Getting details for platform ${firstPlatformId}:`);
        
        const platformResponse = await client.platforms.get(firstPlatformId);
        if (platformResponse.error) {
          console.error('Error getting platform:', platformResponse.error);
        } else {
          console.log('Platform details:');
          console.log(JSON.stringify(platformResponse.data, null, 2));
        }
      }
    }

    // Create a new platform example (commented out to prevent accidental creation)
    /*
    console.log('\n3. Creating a new platform:');
    const createResponse = await client.platforms.create({
      name: 'Example Platform',
      description: 'A platform created via the SDK example',
      metadata: {
        exampleKey: 'exampleValue'
      }
    });
    
    if (createResponse.error) {
      console.error('Error creating platform:', createResponse.error);
    } else {
      console.log('Platform created:');
      console.log(JSON.stringify(createResponse.data, null, 2));
      
      // Update the created platform
      const platformId = createResponse.data!.id;
      console.log(`\n4. Updating platform ${platformId}:`);
      
      const updateResponse = await client.platforms.update(platformId, {
        description: 'Updated description via SDK example'
      });
      
      if (updateResponse.error) {
        console.error('Error updating platform:', updateResponse.error);
      } else {
        console.log('Platform updated:');
        console.log(JSON.stringify(updateResponse.data, null, 2));
      }
      
      // Delete the created platform
      console.log(`\n5. Deleting platform ${platformId}:`);
      
      const deleteResponse = await client.platforms.delete(platformId);
      if (deleteResponse.error) {
        console.error('Error deleting platform:', deleteResponse.error);
      } else {
        console.log('Platform deleted successfully');
      }
    }
    */
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the example
platformsExample()
  .then(() => console.log('\nPlatforms example completed'))
  .catch(error => console.error('Fatal error:', error));
