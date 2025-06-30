import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { InfactoryClient } from '../../src/client.js';
import { setupE2EEnvironment, cleanupE2EEnvironment } from './e2e-setup.js';
import { Organization, Team } from '../../src/types/common.js';

// Initialize client and global variables for tests
describe('Settings Management E2E Tests', () => {
  let client: InfactoryClient;
  let organization: Organization;
  let team: Team;
  let originalOrgName: string;

  // Test data and state management
  const testData = {
    organization: { id: '', name: '' },
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

  beforeAll(async () => {
    const env = await setupE2EEnvironment();
    client = env.client;
    organization = env.organization;
    team = env.team;
    testData.organization = { id: organization.id, name: organization.name };
    originalOrgName = organization.name;
  }, 60000);

  afterAll(async () => {
    await cleanupE2EEnvironment(client, organization.id, team.id);

    // Restore original organization name if changed
    if (organization.id && organization.name !== originalOrgName) {
      try {
        console.info(
          `Restoring original organization name: ${originalOrgName}`,
        );
        await client.organizations.update(organization.id, {
          name: originalOrgName,
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
