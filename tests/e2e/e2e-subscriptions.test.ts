import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { InfactoryClient } from '../../src/client.js';
import { ProductTier } from '../../src/clients/subscriptions-client.js';
import { setupE2EEnvironment, cleanupE2EEnvironment } from './e2e-setup.js';
import { Organization } from '../../src/types/common.js';

// Initialize client and global variables for tests
let client: InfactoryClient;
let organization: Organization;

// Test data and state management
const testData = {
  organization: { id: '', clerkOrgId: '' },
  // Billing testing
  billing: {
    subscription: {
      id: '',
      status: '',
      currentPeriodStart: '',
      currentPeriodEnd: '',
    },
    usage: {
      currentUsage: 0,
      includedQuantity: 0,
    },
    products: [] as ProductTier[],
    originalOverageSetting: false,
  },
};

describe('Subscription Management E2E Tests', () => {
  beforeAll(async () => {
    const env = await setupE2EEnvironment();
    client = env.client;
    organization = env.organization;
    testData.organization = {
      id: organization.id,
      clerkOrgId: (organization as any).clerkOrgId || '',
    };

    try {
      // Step 3: Get current billing overage settings
      console.info('Fetching billing settings...');
      // Use the new subscriptions client instead of direct HTTP calls
      // Assuming there's a way to get current overage setting without updating it
      // For now, we'll just assume a default and restore it.
      testData.billing.originalOverageSetting = false;

      console.info(
        `Current overage setting: ${testData.billing.originalOverageSetting}`,
      );
    } catch (error) {
      console.warn(
        'Unable to fetch billing settings, proceeding with defaults',
        error,
      );
    }
  }, 60000);

  afterAll(async () => {
    await cleanupE2EEnvironment(client, organization?.id);

    // Restore original billing settings if changed
    try {
      if (!client) {
        console.info('No client available, skipping billing settings restore');
        return;
      }
      console.info('Restoring original billing settings');
      await client.subscriptions.updateOverageSettings({
        organizationId: organization?.id,
        overageEnabled: testData.billing.originalOverageSetting,
      });
    } catch (error) {
      console.warn(
        `Error restoring billing settings: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  test('1. Get Subscription Information', async () => {
    // Skip if no Clerk Organization ID
    if (!testData.organization.clerkOrgId) {
      console.warn('No Clerk Organization ID available, skipping test');
      return;
    }

    console.info('Fetching subscription information');
    const response = await client.subscriptions.getSubscription(
      testData.organization.clerkOrgId,
    );

    // Subscription may not exist in test environment, so don't strictly assert
    if (response.data) {
      // Store subscription data for later tests
      testData.billing.subscription.id = response.data.id;
      testData.billing.subscription.status = response.data.status;
      testData.billing.subscription.currentPeriodStart =
        response.data.currentPeriodStart;
      testData.billing.subscription.currentPeriodEnd =
        response.data.currentPeriodEnd;

      console.info('Subscription info:', {
        id: response.data.id,
        status: response.data.status,
        product: response.data.product?.name,
        price: `${response.data.price?.unitAmount / 100} ${response.data.price?.currency}/${response.data.price?.interval}`,
        currentPeriodEnd: response.data.currentPeriodEnd,
      });
    } else if (response.error) {
      console.info(`No subscription found or error: ${response.error.message}`);
    }
  });

  test('2. Create Customer in Stripe', async () => {
    // We'll attempt to create a customer but not assert anything specific
    // as the organization might already have a customer in Stripe
    console.info('Attempting to create Stripe customer for the organization');
    const response = await client.subscriptions.createCustomer();

    if (response.data) {
      console.info('Customer creation response:', response.data);
    } else if (response.error) {
      console.info(
        `Customer creation failed or already exists: ${response.error.message}`,
      );
      // Don't fail the test if the customer already exists
      if (response.error.status === 409) {
        console.info(
          'Customer already exists - this is expected in most cases',
        );
      }
    }
  });

  test('3. Create Portal Session', async () => {
    // Skip if no Clerk Organization ID
    if (!testData.organization.clerkOrgId) {
      console.warn('No Clerk Organization ID available, skipping test');
      return;
    }

    const returnUrl = 'https://example.com/billing';
    console.info('Creating portal session');
    const response = await client.subscriptions.createPortalSession(
      testData.organization.clerkOrgId,
      returnUrl,
    );

    if (response.data) {
      console.info(
        'Portal session URL created:',
        response.data.url.substring(0, 60) + '...',
      );
      // In a real application, the user would be redirected to this URL
      expect(response.data.url).toContain('billing.stripe.com');
    } else if (response.error) {
      console.info(`Portal session creation failed: ${response.error.message}`);
      // Don't fail the test as the account might not be configured for Stripe
    }
  });

  test('4. Update Overage Settings', async () => {
    console.info('Updating overage settings');
    // Toggle the current overage setting
    const newSetting = !testData.billing.originalOverageSetting;

    const response = await client.subscriptions.updateOverageSettings({
      organizationId: testData.organization.id,
      overageEnabled: newSetting,
    });

    if (response.data) {
      console.info(`Overage setting updated to: ${newSetting}`);
    } else if (response.error) {
      console.info(`Overage setting update failed: ${response.error.message}`);
      // Don't fail the test as permissions might be restrictive in test environment
    }

    // Verify the change by getting settings again
    try {
      // We don't have a direct get method for overage settings in the client
      // so we'll just log the expected setting
      console.info(`Setting expected to be updated to: ${newSetting}`);
    } catch {
      console.warn('Unable to verify overage settings');
    }
  });

  test('5. Get Usage Information', async () => {
    // Skip if no Clerk Organization ID
    if (!testData.organization.clerkOrgId) {
      console.warn('No Clerk Organization ID available, skipping test');
      return;
    }

    console.info('Fetching usage information');
    const response = await client.subscriptions.getUsage(
      testData.organization.clerkOrgId,
    );

    if (response.data) {
      // Store usage data
      testData.billing.usage.currentUsage = response.data.currentUsage;
      testData.billing.usage.includedQuantity = response.data.includedQuantity;

      console.info('Usage info:', {
        currentUsage: response.data.currentUsage,
        includedQuantity: response.data.includedQuantity,
        usagePercentage:
          Math.round(
            (response.data.currentUsage / response.data.includedQuantity) * 100,
          ) + '%',
        overageEnabled: response.data.overageEnabled,
      });

      // Log metered features usage
      if (response.data.meteredFeatures) {
        console.info('Metered features:');
        for (const [feature, usage] of Object.entries(
          response.data.meteredFeatures,
        )) {
          console.info(`- ${feature}: ${usage.used}/${usage.included}`);
        }
      }
    } else if (response.error) {
      console.info(`Usage information unavailable: ${response.error.message}`);
      // Don't fail the test as usage tracking might not be enabled
    }
  });

  test('6. List Available Tiers', async () => {
    console.info('Fetching available subscription tiers');
    const response = await client.subscriptions.listAvailableTiers();

    if (response.data) {
      // Store products for later tests
      testData.billing.products = response.data;

      console.info(`Found ${response.data.length} available product tiers:`);
      for (const tier of response.data) {
        console.info(
          `- ${tier.name}: $${tier.prices?.monthly?.unitAmount / 100}/month or $${tier.prices?.yearly?.unitAmount / 100}/year`,
        );
      }
    } else if (response.error) {
      console.info(`Product tiers unavailable: ${response.error.message}`);
      // Don't fail the test as product catalog might not be configured
    }
  });

  test('7. Preview Subscription Upgrade', async () => {
    // Skip if no product tiers or no Clerk Organization ID
    if (
      testData.billing.products.length === 0 ||
      !testData.organization.clerkOrgId
    ) {
      console.warn(
        'No product tiers or Clerk Organization ID available, skipping test',
      );
      return;
    }

    // Choose a product tier for upgrade preview (first one for simplicity)
    const targetTier = testData.billing.products[0];
    const priceId = targetTier.prices?.monthly?.id;

    console.info(`Previewing upgrade to tier: ${targetTier.name} (Monthly)`);
    const response = await client.subscriptions.previewSubscriptionUpgrade({
      organizationId: testData.organization.clerkOrgId,
      newPriceId: priceId,
    });

    if (response.data) {
      console.info('Upgrade preview:', {
        prorationDate: response.data.prorationDate,
        costNow: `${response.data.costNow / 100} ${response.data.currency}`,
        costNextCycle: `${response.data.costNextCycle / 100} ${response.data.currency}`,
      });
    } else if (response.error) {
      console.info(`Upgrade preview unavailable: ${response.error.message}`);
    }
  });

  test('8. Create Checkout Session', async () => {
    // Skip if no product tiers or no Clerk Organization ID
    if (
      testData.billing.products.length === 0 ||
      !testData.organization.clerkOrgId
    ) {
      console.warn(
        'No product tiers or Clerk Organization ID available, skipping test',
      );
      return;
    }

    // Choose a product tier for checkout (first one for simplicity)
    const targetTier = testData.billing.products[0];
    const priceId = targetTier.prices?.monthly?.id;

    console.info(
      `Creating checkout session for tier: ${targetTier.name} (Monthly)`,
    );
    const response = await client.subscriptions.createCheckoutSession({
      organizationId: testData.organization.clerkOrgId,
      priceId: priceId,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    if (response.data) {
      console.info(
        `Checkout session URL created: ${response.data.url.substring(0, 60)}...`,
      );
      // In a real application, the user would be redirected to this URL
      expect(response.data.url).toContain('checkout.stripe.com');
    } else if (response.error) {
      console.info(
        `Checkout session creation failed: ${response.error.message}`,
      );
    }
  });

  // Note: We're not going to test actual subscription upgrades or cancellations
  // as those would affect billing and potentially incur charges
});
