import { HttpClient } from '../../src/core/http-client.js';
import { ApiResponse } from '../types/common.js';

/**
 * Subscription information
 */
export interface Subscription {
  id: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  product: {
    id: string;
    name: string;
    description: string;
  };
  price: {
    id: string;
    unitAmount: number;
    currency: string;
    interval: string;
    intervalCount: number;
  };
  customer: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Customer Portal Session
 */
export interface PortalSession {
  url: string;
}

/**
 * Usage information for a subscription
 */
export interface UsageInformation {
  periodStart: string;
  periodEnd: string;
  currentUsage: number;
  includedQuantity: number;
  overageRate: number;
  overageEnabled: boolean;
  meteredFeatures: {
    [key: string]: {
      used: number;
      included: number;
    };
  };
}

/**
 * Product tier information
 */
export interface ProductTier {
  id: string;
  name: string;
  description: string;
  features: string[];
  prices: {
    monthly: {
      id: string;
      unitAmount: number;
      currency: string;
    };
    yearly: {
      id: string;
      unitAmount: number;
      currency: string;
    };
  };
}

/**
 * Checkout session information
 */
export interface CheckoutSession {
  url: string;
}

/**
 * Subscription upgrade preview
 */
export interface SubscriptionUpgradePreview {
  prorationDate: string;
  costNow: number;
  costNextCycle: number;
  currency: string;
}

/**
 * Client for managing subscriptions and billing
 */
export class SubscriptionsClient {
  private httpClient: HttpClient;

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Get subscription information for an organization
   * @param {string} organizationId - The Clerk organization ID
   * @returns {Promise<ApiResponse<Subscription>>} A promise that resolves with the subscription information
   * @example
   * const response = await client.subscriptions.getSubscription('org_123');
   * if (response.data) {
   *   console.info('Subscription:', response.data);
   * } else {
   *   console.error('Error getting subscription:', response.error);
   * }
   */
  async getSubscription(
    organizationId: string,
  ): Promise<ApiResponse<Subscription>> {
    return await this.httpClient.get<Subscription>(
      '/v1/billing/subscriptions',
      { organization_id: organizationId },
    );
  }

  /**
   * Create a customer in Stripe and link it to the organization
   * @returns {Promise<ApiResponse<any>>} A promise that resolves with the created customer information
   * @example
   * const response = await client.subscriptions.createCustomer();
   * if (response.data) {
   *   console.info('Customer created:', response.data);
   * } else {
   *   console.error('Error creating customer:', response.error);
   * }
   */
  async createCustomer(): Promise<ApiResponse<any>> {
    return await this.httpClient.post<any>(
      '/v1/billing/subscriptions/create-customer',
      {},
    );
  }

  /**
   * Create a Stripe Customer Portal session for subscription management
   * @param {string} organizationId - The Clerk organization ID
   * @param {string} returnUrl - URL to return to after portal session
   * @returns {Promise<ApiResponse<PortalSession>>} A promise that resolves with the portal session information
   * @example
   * const response = await client.subscriptions.createPortalSession('org_123', 'https://example.com/billing');
   * if (response.data) {
   *   // Redirect the user to the portal URL
   *   window.location.href = response.data.url;
   * } else {
   *   console.error('Error creating portal session:', response.error);
   * }
   */
  async createPortalSession(
    organizationId: string,
    returnUrl: string,
  ): Promise<ApiResponse<PortalSession>> {
    return await this.httpClient.get<PortalSession>(
      '/v1/billing/subscriptions/portal-session',
      { organization_id: organizationId, return_url: returnUrl },
    );
  }

  /**
   * Update overage settings for an organization
   * @param {object} overageSettings - The overage settings to update
   * @returns {Promise<ApiResponse<any>>} A promise that resolves with the updated overage settings
   * @example
   * const response = await client.subscriptions.updateOverageSettings({
   *   organizationId: 'org_123',
   *   overageEnabled: true
   * });
   * if (response.data) {
   *   console.info('Overage settings updated:', response.data);
   * } else {
   *   console.error('Error updating overage settings:', response.error);
   * }
   */
  async updateOverageSettings(
    overageSettings: Record<string, any>,
  ): Promise<ApiResponse<any>> {
    return await this.httpClient.post<any>(
      '/v1/billing/subscriptions/update-overage',
      overageSettings,
    );
  }

  /**
   * Create a Stripe checkout session for the selected product
   * @param {object} checkoutOptions - Options for the checkout session
   * @returns {Promise<ApiResponse<CheckoutSession>>} A promise that resolves with the checkout session information
   * @example
   * const response = await client.subscriptions.createCheckoutSession({
   *   priceId: 'price_123',
   *   organizationId: 'org_123',
   *   successUrl: 'https://example.com/success',
   *   cancelUrl: 'https://example.com/cancel'
   * });
   * if (response.data) {
   *   // Redirect the user to the checkout URL
   *   window.location.href = response.data.url;
   * } else {
   *   console.error('Error creating checkout session:', response.error);
   * }
   */
  async createCheckoutSession(
    checkoutOptions: Record<string, any>,
  ): Promise<ApiResponse<CheckoutSession>> {
    return await this.httpClient.post<CheckoutSession>(
      '/v1/billing/subscriptions/create-checkout-session',
      checkoutOptions,
    );
  }

  /**
   * Get detailed API usage information for the current billing period
   * @param {string} organizationId - The Clerk organization ID
   * @returns {Promise<ApiResponse<UsageInformation>>} A promise that resolves with the usage information
   * @example
   * const response = await client.subscriptions.getUsage('org_123');
   * if (response.data) {
   *   console.info('Usage information:', response.data);
   *   console.info(`Used ${response.data.currentUsage} of ${response.data.includedQuantity} included`);
   * } else {
   *   console.error('Error getting usage information:', response.error);
   * }
   */
  async getUsage(
    organizationId: string,
  ): Promise<ApiResponse<UsageInformation>> {
    return await this.httpClient.get<UsageInformation>(
      '/v1/billing/subscriptions/usage',
      { organization_id: organizationId },
    );
  }

  /**
   * Preview a subscription upgrade with proration calculation
   * @param {object} upgradeOptions - Options for the upgrade preview
   * @returns {Promise<ApiResponse<SubscriptionUpgradePreview>>} A promise that resolves with the upgrade preview information
   * @example
   * const response = await client.subscriptions.previewSubscriptionUpgrade({
   *   organizationId: 'org_123',
   *   newPriceId: 'price_new'
   * });
   * if (response.data) {
   *   console.info('Upgrade preview:', response.data);
   *   console.info(`Immediate cost: ${response.data.costNow} ${response.data.currency}`);
   *   console.info(`Next cycle cost: ${response.data.costNextCycle} ${response.data.currency}`);
   * } else {
   *   console.error('Error previewing upgrade:', response.error);
   * }
   */
  async previewSubscriptionUpgrade(
    upgradeOptions: Record<string, any>,
  ): Promise<ApiResponse<SubscriptionUpgradePreview>> {
    return await this.httpClient.post<SubscriptionUpgradePreview>(
      '/v1/billing/subscriptions/preview-upgrade',
      upgradeOptions,
    );
  }

  /**
   * Apply a subscription upgrade with proration
   * @param {object} upgradeOptions - Options for the upgrade
   * @returns {Promise<ApiResponse<Subscription>>} A promise that resolves with the updated subscription information
   * @example
   * const response = await client.subscriptions.applySubscriptionUpgrade({
   *   organizationId: 'org_123',
   *   newPriceId: 'price_new'
   * });
   * if (response.data) {
   *   console.info('Subscription upgraded:', response.data);
   * } else {
   *   console.error('Error applying upgrade:', response.error);
   * }
   */
  async applySubscriptionUpgrade(
    upgradeOptions: Record<string, any>,
  ): Promise<ApiResponse<Subscription>> {
    return await this.httpClient.post<Subscription>(
      '/v1/billing/subscriptions/apply-upgrade',
      upgradeOptions,
    );
  }

  /**
   * Cancel a subscription (downgrade to free tier)
   * @param {object} cancelOptions - Options for cancellation
   * @returns {Promise<ApiResponse<Subscription>>} A promise that resolves with the updated subscription information
   * @example
   * const response = await client.subscriptions.cancelSubscription({
   *   organizationId: 'org_123'
   * });
   * if (response.data) {
   *   console.info('Subscription cancelled:', response.data);
   *   console.info(`Subscription will end on: ${response.data.currentPeriodEnd}`);
   * } else {
   *   console.error('Error cancelling subscription:', response.error);
   * }
   */
  async cancelSubscription(
    cancelOptions: Record<string, any>,
  ): Promise<ApiResponse<Subscription>> {
    return await this.httpClient.post<Subscription>(
      '/v1/billing/subscriptions/cancel',
      cancelOptions,
    );
  }

  /**
   * List available product tiers with monthly and yearly pricing
   * @returns {Promise<ApiResponse<ProductTier[]>>} A promise that resolves with the available product tiers
   * @example
   * const response = await client.subscriptions.listAvailableTiers();
   * if (response.data) {
   *   console.info('Available tiers:', response.data);
   *   for (const tier of response.data) {
   *     console.info(`${tier.name}: $${tier.prices.monthly.unitAmount/100}/month or $${tier.prices.yearly.unitAmount/100}/year`);
   *   }
   * } else {
   *   console.error('Error listing available tiers:', response.error);
   * }
   */
  async listAvailableTiers(): Promise<ApiResponse<ProductTier[]>> {
    return await this.httpClient.get<ProductTier[]>(
      '/v1/billing/subscriptions/products',
    );
  }
}
