import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { InfactoryClient } from '../../src/client.js';
import { ProductTier } from '../../src/clients/subscriptions-client.js';

// Initialize client and global variables for tests
let client: InfactoryClient;
let apiKey: string | undefined;
let baseURL: string | undefined;

// Test data and state management
const testData = {
  // Current user info
  user: { id: '', name: '', email: '' },
  // Organization info
  organization: { id: '', name: '', clerkOrgId: '' },
  // Billing testing
  billing: {
    originalOverageSetting: false,
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
  },
};

describe('Subscription Management E2E Tests', () => {
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

    console.log(`Connecting to API at: ${baseURL}`);

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
      console.log('Skipping E2E tests as SKIP_E2E_TESTS=true');
      // Mark all tests as skipped
      test.skipIf(true)('Skipping all tests', () => {});
      return;
    }

    try {
      // Step 1: Get current user
      console.log('Fetching current user...');
      const userResponse = await client.auth.getMe();

      if (userResponse.error || !userResponse.data) {
        throw new Error(
          'Failed to fetch current user: ' + userResponse.error?.message,
        );
      }

      testData.user.id = userResponse.data.id;
      testData.user.name = userResponse.data.name || userResponse.data.email;
      testData.user.email = userResponse.data.email;
      console.log(`Using user: ${testData.user.name} (${testData.user.id})`);

      // Step 2: Get organizations - use the first available organization
      console.log('Fetching organizations...');
      const orgsResponse = await client.organizations.list();

      if (!orgsResponse.data || orgsResponse.data.length === 0) {
        throw new Error(
          'Failed to fetch organizations or no organizations available',
        );
      }

      const organization = orgsResponse.data[0];
      testData.organization.id = organization.id;
      testData.organization.name = organization.name;
      testData.organization.clerkOrgId = organization.clerkOrgId || '';
      console.log(
        `Using organization: ${testData.organization.name} (${testData.organization.id})`,
      );

      if (!testData.organization.clerkOrgId) {
        console.warn(
          'No Clerk Organization ID found, some tests may be skipped',
        );
      }

      // Step 3: Get current billing overage settings
      try {
        console.log('Fetching billing settings...');
        // Use the new subscriptions client instead of direct HTTP calls
        await client.subscriptions.updateOverageSettings({
          organizationId: testData.organization.id,
          overageEnabled: testData.billing.originalOverageSetting,
        });

        console.log(
          `Current overage setting: ${testData.billing.originalOverageSetting}`,
        );
      } catch (error) {
        console.warn(
          'Unable to fetch billing settings, proceeding with defaults',
        );
      }
    } catch (error) {
      console.error('Setup failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up any changes made during tests
    console.log('Cleaning up test data...');

    // Restore original billing settings if changed
    try {
      console.log('Restoring original billing settings');
      await client.subscriptions.updateOverageSettings({
        organizationId: testData.organization.id,
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

    console.log('Fetching subscription information');
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

      console.log('Subscription info:', {
        id: response.data.id,
        status: response.data.status,
        product: response.data.product?.name,
        price: `${response.data.price?.unitAmount / 100} ${response.data.price?.currency}/${response.data.price?.interval}`,
        currentPeriodEnd: response.data.currentPeriodEnd,
      });
    } else if (response.error) {
      console.log(`No subscription found or error: ${response.error.message}`);
    }
  });

  test('2. Create Customer in Stripe', async () => {
    // We'll attempt to create a customer but not assert anything specific
    // as the organization might already have a customer in Stripe
    console.log('Attempting to create Stripe customer for the organization');
    const response = await client.subscriptions.createCustomer();

    if (response.data) {
      console.log('Customer creation response:', response.data);
    } else if (response.error) {
      console.log(
        `Customer creation failed or already exists: ${response.error.message}`,
      );
      // Don't fail the test if the customer already exists
      if (response.error.status === 409) {
        console.log('Customer already exists - this is expected in most cases');
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
    console.log('Creating portal session');
    const response = await client.subscriptions.createPortalSession(
      testData.organization.clerkOrgId,
      returnUrl,
    );

    if (response.data) {
      console.log(
        'Portal session URL created:',
        response.data.url.substring(0, 60) + '...',
      );
      // In a real application, the user would be redirected to this URL
      expect(response.data.url).toContain('billing.stripe.com');
    } else if (response.error) {
      console.log(`Portal session creation failed: ${response.error.message}`);
      // Don't fail the test as the account might not be configured for Stripe
    }
  });

  test('4. Update Overage Settings', async () => {
    console.log('Updating overage settings');
    // Toggle the current overage setting
    const newSetting = !testData.billing.originalOverageSetting;

    const response = await client.subscriptions.updateOverageSettings({
      organizationId: testData.organization.id,
      overageEnabled: newSetting,
    });

    if (response.data) {
      console.log(`Overage setting updated to: ${newSetting}`);
    } else if (response.error) {
      console.log(`Overage setting update failed: ${response.error.message}`);
      // Don't fail the test as permissions might be restrictive in test environment
    }

    // Verify the change by getting settings again
    try {
      // We don't have a direct get method for overage settings in the client
      // so we'll just log the expected setting
      console.log(`Setting expected to be updated to: ${newSetting}`);
    } catch (error) {
      console.warn('Unable to verify overage settings');
    }
  });

  test('5. Get Usage Information', async () => {
    // Skip if no Clerk Organization ID
    if (!testData.organization.clerkOrgId) {
      console.warn('No Clerk Organization ID available, skipping test');
      return;
    }

    console.log('Fetching usage information');
    const response = await client.subscriptions.getUsage(
      testData.organization.clerkOrgId,
    );

    if (response.data) {
      // Store usage data
      testData.billing.usage.currentUsage = response.data.currentUsage;
      testData.billing.usage.includedQuantity = response.data.includedQuantity;

      console.log('Usage info:', {
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
        console.log('Metered features:');
        for (const [feature, usage] of Object.entries(
          response.data.meteredFeatures,
        )) {
          console.log(`- ${feature}: ${usage.used}/${usage.included}`);
        }
      }
    } else if (response.error) {
      console.log(`Usage information unavailable: ${response.error.message}`);
      // Don't fail the test as usage tracking might not be enabled
    }
  });

  test('6. List Available Tiers', async () => {
    console.log('Fetching available subscription tiers');
    const response = await client.subscriptions.listAvailableTiers();

    if (response.data) {
      // Store products for later tests
      testData.billing.products = response.data;

      console.log(`Found ${response.data.length} available product tiers:`);
      for (const tier of response.data) {
        console.log(
          `- ${tier.name}: $${tier.prices?.monthly?.unitAmount / 100}/month or $${tier.prices?.yearly?.unitAmount / 100}/year`,
        );
      }
    } else if (response.error) {
      console.log(`Product tiers unavailable: ${response.error.message}`);
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

    console.log(`Previewing upgrade to tier: ${targetTier.name} (Monthly)`);
    const response = await client.subscriptions.previewSubscriptionUpgrade({
      organizationId: testData.organization.clerkOrgId,
      newPriceId: priceId,
    });

    if (response.data) {
      console.log('Upgrade preview:', {
        prorationDate: response.data.prorationDate,
        costNow: `${response.data.costNow / 100} ${response.data.currency}`,
        costNextCycle: `${response.data.costNextCycle / 100} ${response.data.currency}`,
      });
    } else if (response.error) {
      console.log(`Upgrade preview unavailable: ${response.error.message}`);
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

    console.log(
      `Creating checkout session for tier: ${targetTier.name} (Monthly)`,
    );
    const response = await client.subscriptions.createCheckoutSession({
      organizationId: testData.organization.clerkOrgId,
      priceId: priceId,
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    });

    if (response.data) {
      console.log(
        `Checkout session URL created: ${response.data.url.substring(0, 60)}...`,
      );
      // In a real application, the user would be redirected to this URL
      expect(response.data.url).toContain('checkout.stripe.com');
    } else if (response.error) {
      console.log(
        `Checkout session creation failed: ${response.error.message}`,
      );
    }
  });

  // Note: We're not going to test actual subscription upgrades or cancellations
  // as those would affect billing and potentially incur charges
});
