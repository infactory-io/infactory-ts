import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { InfactoryClient } from '../../src/client.js';

// Initialize client and global variables for tests
let client: InfactoryClient;
let apiKey: string | undefined;
let baseURL: string | undefined;

// Test data and state management
const testData = {
  // Current user info
  user: { id: '', name: '', email: '' },
  // Organization info
  organization: { id: '', name: '', originalName: '' },
  // Team info
  team: { id: '', name: '' },
  // For invitation testing
  invitation: { id: '', email: '' },
  // Member management testing
  member: { id: '', name: '', email: '', role: '' },
  // Billing testing
  billing: {
    originalOverageSetting: false,
    subscription: {
      id: '',
      productId: '',
      interval: '',
    },
  },
};

describe('Settings Management E2E Tests', () => {
  beforeAll(async () => {
    // Ensure API key is set and store in module scope for all tests
    apiKey = process.env.NF_API_KEY;
    if (!apiKey) {
      throw new Error(
        'NF_API_KEY environment variable is required for E2E tests',
      );
    }

    // Ensure baseURL is properly formatted for Node.js environment and store in module scope
    baseURL = process.env.NF_BASE_URL;
    if (!baseURL) {
      throw new Error(
        'NF_BASE_URL environment variable is required for E2E tests',
      );
    }

    console.info(`Connecting to API at: ${baseURL}`);

    // Create client instance with absolute URL
    client = new InfactoryClient({
      apiKey,
      baseURL,
      isServer: true,
    });

    // For E2E testing, we don't want to attempt any real API calls if the API is down
    // We'll skip tests if we can't connect to the API
    const skipTests = process.env.SKIP_E2E_TESTS === 'true';
    if (skipTests) {
      console.info('Skipping E2E tests as SKIP_E2E_TESTS=true');
      // Mark all tests as skipped
      test.skipIf(true)('Skipping all tests', () => {});
      return;
    }

    try {
      // Step 1: Get current user
      console.info('Fetching current user...');
      const userResponse = await client.users.getCurrentUser();

      if (userResponse.error || !userResponse.data) {
        throw new Error(
          'Failed to fetch current user: ' + userResponse.error?.message,
        );
      }

      testData.user.id = userResponse.data.id;
      testData.user.name = userResponse.data.name || '';
      testData.user.email = userResponse.data.email;
      console.info(`Using user: ${testData.user.name} (${testData.user.id})`);

      // Step 2: Get organizations - use the first available organization
      console.info('Fetching organizations...');
      const orgsResponse = await client.organizations.list();

      if (!orgsResponse.data || orgsResponse.data.length === 0) {
        throw new Error(
          'Failed to fetch organizations or no organizations available',
        );
      }

      const organization = orgsResponse.data[0];
      testData.organization.id = organization.id;
      testData.organization.name = organization.name;
      testData.organization.originalName = organization.name;
      console.info(
        `Using organization: ${testData.organization.name} (${testData.organization.id})`,
      );

      // Step 3: Get teams - use the first available team in the organization
      console.info('Fetching teams...');
      const teamsResponse = await client.teams.getTeams(
        testData.organization.id,
      );

      if (!teamsResponse.data || teamsResponse.data.length === 0) {
        throw new Error(
          'Failed to fetch teams or no teams available in the organization',
        );
      }

      const team = teamsResponse.data[0];
      testData.team.id = team.id;
      testData.team.name = team.name;
      console.info(`Using team: ${testData.team.name} (${testData.team.id})`);
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up any changes made during tests
    console.info('Cleaning up test data...');

    // Restore original organization name if changed
    if (
      testData.organization.id &&
      testData.organization.name !== testData.organization.originalName
    ) {
      try {
        console.info(
          `Restoring original organization name: ${testData.organization.originalName}`,
        );
        await client.organizations.update(testData.organization.id, {
          name: testData.organization.originalName,
        });
      } catch (error) {
        console.warn(
          `Error restoring organization name: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
  });

  test('1. Update Organization General Settings', async () => {
    // This simulates the GeneralSettings view - updating organization name
    const newOrgName = `Updated Org Name ${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substring(2, 7)}`;

    console.info(
      `Updating organization name to: ${newOrgName} ${testData.organization.id}`,
    );
    const updateResponse = await client.organizations.update(
      testData.organization.id,
      { name: newOrgName },
    );
    console.info('!!!! updateResponse', updateResponse);
    expect(updateResponse.error).toBeUndefined();
    expect(updateResponse.data).toBeDefined();
    expect(updateResponse.data?.name).toBe(newOrgName);

    // Update the test data with the new name
    testData.organization.name = newOrgName;
    console.info(`Successfully updated organization name to: ${newOrgName}`);

    // Verify the update by fetching the organization
    const getResponse = await client.organizations.get(
      testData.organization.id,
    );
    expect(getResponse.error).toBeUndefined();
    expect(getResponse.data?.name).toBe(newOrgName);
  });

  test.skip('2. Invite Team Member', async () => {
    // Not implemented - skipping
    console.info('Skipping invite team member test as it is not implemented');
  });

  test.skip('3. Revoke Team Member Invitation', async () => {
    // Not implemented - skipping
    console.info(
      'Skipping revoke team member invitation test as it is not implemented',
    );
  });

  test.skip('4. Create Test Member and Update Role', async () => {
    // Not implemented - skipping
    console.info(
      'Skipping create test member and update role test as it is not implemented',
    );
  });

  test.skip('5. Remove Team Member', async () => {
    // Not implemented - skipping
    console.info('Skipping remove team member test as it is not implemented');
  });

  test.skip('6. Update Billing Overage Settings', async () => {
    // Not implemented - skipping
    console.info(
      'Skipping update billing overage settings test as it is not implemented',
    );
  });

  test.skip('7. Preview Subscription Upgrade', async () => {
    // Not implemented - skipping
    console.info(
      'Skipping preview subscription upgrade test as it is not implemented',
    );
  });

  test.skip('8. Apply Subscription Upgrade', async () => {
    // Not implemented - skipping
    console.info(
      'Skipping apply subscription upgrade test as it is not implemented',
    );
  });

  test.skip('9. Cancel Subscription', async () => {
    // Not implemented - skipping
    console.info('Skipping cancel subscription test as it is not implemented');
  });
});
