import { describe, it, expect, beforeEach, vi, Mocked } from 'vitest';
import { HttpClient } from '../../src/core/http-client.js';
import {
  SubscriptionsClient,
  Subscription,
  PortalSession,
  UsageInformation,
  ProductTier,
  CheckoutSession,
  SubscriptionUpgradePreview,
} from '../../src/clients/subscriptions-client.js';
import { InfactoryAPIError } from '../../src/errors/index.js';
import { ApiResponse } from '@/types/common.js';

// Mock HttpClient
vi.mock('../../src/core/http-client.js');

describe('SubscriptionsClient', () => {
  let httpClientMock: Mocked<HttpClient>;
  let subscriptionsClient: SubscriptionsClient;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Create a fully mocked HttpClient instance
    const actualHttpClient = new HttpClient({
      apiKey: 'dummy',
      baseUrl: 'dummy',
    });
    httpClientMock = vi.mocked(actualHttpClient, true); // true for deep mocking

    subscriptionsClient = new SubscriptionsClient(httpClientMock);
  });

  // --- Test Data ---
  const mockSubscription: Subscription = {
    id: 'sub_123',
    status: 'active',
    currentPeriodStart: '2023-01-01T00:00:00Z',
    currentPeriodEnd: '2024-01-01T00:00:00Z',
    cancelAtPeriodEnd: false,
    product: {
      id: 'prod_123',
      name: 'Business Plan',
      description: 'For professional teams and organizations',
    },
    price: {
      id: 'price_123',
      unitAmount: 9900,
      currency: 'USD',
      interval: 'month',
      intervalCount: 1,
    },
    customer: {
      id: 'cus_123',
      email: 'test@example.com',
      name: 'Test Customer',
    },
  };

  const mockPortalSession: PortalSession = {
    url: 'https://billing.stripe.com/session/test',
  };

  const mockCheckoutSession: CheckoutSession = {
    url: 'https://checkout.stripe.com/session/test',
  };

  const mockUsage: UsageInformation = {
    periodStart: '2023-01-01T00:00:00Z',
    periodEnd: '2023-02-01T00:00:00Z',
    currentUsage: 450,
    includedQuantity: 1000,
    overageRate: 0.005,
    overageEnabled: true,
    meteredFeatures: {
      'api-calls': { used: 450, included: 1000 },
      'storage-gb': { used: 5, included: 10 },
    },
  };

  const mockProductTiers: ProductTier[] = [
    {
      id: 'prod_123',
      name: 'Basic',
      description: 'For individuals and small teams',
      features: ['Feature 1', 'Feature 2'],
      prices: {
        monthly: {
          id: 'price_123_monthly',
          unitAmount: 1900,
          currency: 'USD',
        },
        yearly: {
          id: 'price_123_yearly',
          unitAmount: 19000,
          currency: 'USD',
        },
      },
    },
    {
      id: 'prod_456',
      name: 'Pro',
      description: 'For growing teams',
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      prices: {
        monthly: {
          id: 'price_456_monthly',
          unitAmount: 4900,
          currency: 'USD',
        },
        yearly: {
          id: 'price_456_yearly',
          unitAmount: 49000,
          currency: 'USD',
        },
      },
    },
  ];

  const mockUpgradePreview: SubscriptionUpgradePreview = {
    prorationDate: '2023-01-15T00:00:00Z',
    costNow: 3000,
    costNextCycle: 9900,
    currency: 'USD',
  };

  // Correctly instantiate InfactoryAPIError with status, code, and message
  const mockError: InfactoryAPIError = new InfactoryAPIError(
    400,
    'BAD_REQUEST',
    'Bad Request',
  );

  // --- Get Subscription ---
  describe('getSubscription', () => {
    it('should call httpClient.get and return a successful response', async () => {
      const organizationId = 'org_123';
      const mockResponse: ApiResponse<Subscription> = {
        data: mockSubscription,
      };
      httpClientMock.get.mockResolvedValue(mockResponse);

      const result = await subscriptionsClient.getSubscription(organizationId);

      expect(httpClientMock.get).toHaveBeenCalledOnce();
      expect(httpClientMock.get).toHaveBeenCalledWith(
        '/v1/billing/subscriptions',
        { organization_id: organizationId },
      );
      expect(result).toEqual(mockResponse);
      expect(result.data).toBe(mockSubscription);
    });

    it('should return an error response if httpClient.get fails', async () => {
      const organizationId = 'org_123';
      const mockResponse: ApiResponse<Subscription> = {
        error: mockError,
      };
      httpClientMock.get.mockResolvedValue(mockResponse);

      const result = await subscriptionsClient.getSubscription(organizationId);

      expect(httpClientMock.get).toHaveBeenCalledOnce();
      expect(result.error).toBe(mockError);
    });
  });

  // --- Create Customer ---
  describe('createCustomer', () => {
    it('should call httpClient.post and return a successful response', async () => {
      const mockResponse: ApiResponse<any> = {
        data: { id: 'cus_123', object: 'customer' },
      };
      httpClientMock.post.mockResolvedValue(mockResponse);

      const result = await subscriptionsClient.createCustomer();

      expect(httpClientMock.post).toHaveBeenCalledOnce();
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/v1/billing/subscriptions/create-customer',
        {},
      );
      expect(result).toEqual(mockResponse);
    });

    it('should return an error response if httpClient.post fails', async () => {
      const mockResponse: ApiResponse<any> = {
        error: mockError,
      };
      httpClientMock.post.mockResolvedValue(mockResponse);

      const result = await subscriptionsClient.createCustomer();

      expect(httpClientMock.post).toHaveBeenCalledOnce();
      expect(result.error).toBe(mockError);
    });
  });

  // --- Create Portal Session ---
  describe('createPortalSession', () => {
    it('should call httpClient.get and return a successful response', async () => {
      const organizationId = 'org_123';
      const returnUrl = 'https://example.com/billing';
      const mockResponse: ApiResponse<PortalSession> = {
        data: mockPortalSession,
      };
      httpClientMock.get.mockResolvedValue(mockResponse);

      const result = await subscriptionsClient.createPortalSession(
        organizationId,
        returnUrl,
      );

      expect(httpClientMock.get).toHaveBeenCalledOnce();
      expect(httpClientMock.get).toHaveBeenCalledWith(
        '/v1/billing/subscriptions/portal-session',
        { organization_id: organizationId, return_url: returnUrl },
      );
      expect(result).toEqual(mockResponse);
      expect(result.data).toBe(mockPortalSession);
    });

    it('should return an error response if httpClient.get fails', async () => {
      const organizationId = 'org_123';
      const returnUrl = 'https://example.com/billing';
      const mockResponse: ApiResponse<PortalSession> = {
        error: mockError,
      };
      httpClientMock.get.mockResolvedValue(mockResponse);

      const result = await subscriptionsClient.createPortalSession(
        organizationId,
        returnUrl,
      );

      expect(httpClientMock.get).toHaveBeenCalledOnce();
      expect(result.error).toBe(mockError);
    });
  });

  // --- Update Overage Settings ---
  describe('updateOverageSettings', () => {
    it('should call httpClient.post and return a successful response', async () => {
      const overageSettings = {
        organizationId: 'org_123',
        overageEnabled: true,
      };
      const mockResponse: ApiResponse<any> = {
        data: {
          success: true,
          organizationId: 'org_123',
          overageEnabled: true,
        },
      };
      httpClientMock.post.mockResolvedValue(mockResponse);

      const result =
        await subscriptionsClient.updateOverageSettings(overageSettings);

      expect(httpClientMock.post).toHaveBeenCalledOnce();
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/v1/billing/subscriptions/update-overage',
        overageSettings,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should return an error response if httpClient.post fails', async () => {
      const overageSettings = {
        organizationId: 'org_123',
        overageEnabled: true,
      };
      const mockResponse: ApiResponse<any> = {
        error: mockError,
      };
      httpClientMock.post.mockResolvedValue(mockResponse);

      const result =
        await subscriptionsClient.updateOverageSettings(overageSettings);

      expect(httpClientMock.post).toHaveBeenCalledOnce();
      expect(result.error).toBe(mockError);
    });
  });

  // --- Create Checkout Session ---
  describe('createCheckoutSession', () => {
    it('should call httpClient.post and return a successful response', async () => {
      const checkoutOptions = {
        priceId: 'price_123',
        organizationId: 'org_123',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };
      const mockResponse: ApiResponse<CheckoutSession> = {
        data: mockCheckoutSession,
      };
      httpClientMock.post.mockResolvedValue(mockResponse);

      const result =
        await subscriptionsClient.createCheckoutSession(checkoutOptions);

      expect(httpClientMock.post).toHaveBeenCalledOnce();
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/v1/billing/subscriptions/create-checkout-session',
        checkoutOptions,
      );
      expect(result).toEqual(mockResponse);
      expect(result.data).toBe(mockCheckoutSession);
    });

    it('should return an error response if httpClient.post fails', async () => {
      const checkoutOptions = {
        priceId: 'price_123',
        organizationId: 'org_123',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      };
      const mockResponse: ApiResponse<CheckoutSession> = {
        error: mockError,
      };
      httpClientMock.post.mockResolvedValue(mockResponse);

      const result =
        await subscriptionsClient.createCheckoutSession(checkoutOptions);

      expect(httpClientMock.post).toHaveBeenCalledOnce();
      expect(result.error).toBe(mockError);
    });
  });

  // --- Get Usage ---
  describe('getUsage', () => {
    it('should call httpClient.get and return a successful response', async () => {
      const organizationId = 'org_123';
      const mockResponse: ApiResponse<UsageInformation> = {
        data: mockUsage,
      };
      httpClientMock.get.mockResolvedValue(mockResponse);

      const result = await subscriptionsClient.getUsage(organizationId);

      expect(httpClientMock.get).toHaveBeenCalledOnce();
      expect(httpClientMock.get).toHaveBeenCalledWith(
        '/v1/billing/subscriptions/usage',
        { organization_id: organizationId },
      );
      expect(result).toEqual(mockResponse);
      expect(result.data).toBe(mockUsage);
    });

    it('should return an error response if httpClient.get fails', async () => {
      const organizationId = 'org_123';
      const mockResponse: ApiResponse<UsageInformation> = {
        error: mockError,
      };
      httpClientMock.get.mockResolvedValue(mockResponse);

      const result = await subscriptionsClient.getUsage(organizationId);

      expect(httpClientMock.get).toHaveBeenCalledOnce();
      expect(result.error).toBe(mockError);
    });
  });

  // --- Preview Subscription Upgrade ---
  describe('previewSubscriptionUpgrade', () => {
    it('should call httpClient.post and return a successful response', async () => {
      const upgradeOptions = {
        organizationId: 'org_123',
        newPriceId: 'price_new',
      };
      const mockResponse: ApiResponse<SubscriptionUpgradePreview> = {
        data: mockUpgradePreview,
      };
      httpClientMock.post.mockResolvedValue(mockResponse);

      const result =
        await subscriptionsClient.previewSubscriptionUpgrade(upgradeOptions);

      expect(httpClientMock.post).toHaveBeenCalledOnce();
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/v1/billing/subscriptions/preview-upgrade',
        upgradeOptions,
      );
      expect(result).toEqual(mockResponse);
      expect(result.data).toBe(mockUpgradePreview);
    });

    it('should return an error response if httpClient.post fails', async () => {
      const upgradeOptions = {
        organizationId: 'org_123',
        newPriceId: 'price_new',
      };
      const mockResponse: ApiResponse<SubscriptionUpgradePreview> = {
        error: mockError,
      };
      httpClientMock.post.mockResolvedValue(mockResponse);

      const result =
        await subscriptionsClient.previewSubscriptionUpgrade(upgradeOptions);

      expect(httpClientMock.post).toHaveBeenCalledOnce();
      expect(result.error).toBe(mockError);
    });
  });

  // --- Apply Subscription Upgrade ---
  describe('applySubscriptionUpgrade', () => {
    it('should call httpClient.post and return a successful response', async () => {
      const upgradeOptions = {
        organizationId: 'org_123',
        newPriceId: 'price_new',
      };
      const mockResponse: ApiResponse<Subscription> = {
        data: mockSubscription,
      };
      httpClientMock.post.mockResolvedValue(mockResponse);

      const result =
        await subscriptionsClient.applySubscriptionUpgrade(upgradeOptions);

      expect(httpClientMock.post).toHaveBeenCalledOnce();
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/v1/billing/subscriptions/apply-upgrade',
        upgradeOptions,
      );
      expect(result).toEqual(mockResponse);
      expect(result.data).toBe(mockSubscription);
    });

    it('should return an error response if httpClient.post fails', async () => {
      const upgradeOptions = {
        organizationId: 'org_123',
        newPriceId: 'price_new',
      };
      const mockResponse: ApiResponse<Subscription> = {
        error: mockError,
      };
      httpClientMock.post.mockResolvedValue(mockResponse);

      const result =
        await subscriptionsClient.applySubscriptionUpgrade(upgradeOptions);

      expect(httpClientMock.post).toHaveBeenCalledOnce();
      expect(result.error).toBe(mockError);
    });
  });

  // --- Cancel Subscription ---
  describe('cancelSubscription', () => {
    it('should call httpClient.post and return a successful response', async () => {
      const cancelOptions = {
        organizationId: 'org_123',
      };
      const mockResponse: ApiResponse<Subscription> = {
        data: {
          ...mockSubscription,
          status: 'canceled',
          cancelAtPeriodEnd: true,
        },
      };
      httpClientMock.post.mockResolvedValue(mockResponse);

      const result =
        await subscriptionsClient.cancelSubscription(cancelOptions);

      expect(httpClientMock.post).toHaveBeenCalledOnce();
      expect(httpClientMock.post).toHaveBeenCalledWith(
        '/v1/billing/subscriptions/cancel',
        cancelOptions,
      );
      expect(result).toEqual(mockResponse);
      expect(result.data?.status).toBe('canceled');
      expect(result.data?.cancelAtPeriodEnd).toBe(true);
    });

    it('should return an error response if httpClient.post fails', async () => {
      const cancelOptions = {
        organizationId: 'org_123',
      };
      const mockResponse: ApiResponse<Subscription> = {
        error: mockError,
      };
      httpClientMock.post.mockResolvedValue(mockResponse);

      const result =
        await subscriptionsClient.cancelSubscription(cancelOptions);

      expect(httpClientMock.post).toHaveBeenCalledOnce();
      expect(result.error).toBe(mockError);
    });
  });

  // --- List Available Tiers ---
  describe('listAvailableTiers', () => {
    it('should call httpClient.get and return a successful response', async () => {
      const mockResponse: ApiResponse<ProductTier[]> = {
        data: mockProductTiers,
      };
      httpClientMock.get.mockResolvedValue(mockResponse);

      const result = await subscriptionsClient.listAvailableTiers();

      expect(httpClientMock.get).toHaveBeenCalledOnce();
      expect(httpClientMock.get).toHaveBeenCalledWith(
        '/v1/billing/subscriptions/products',
      );
      expect(result).toEqual(mockResponse);
      expect(result.data).toBe(mockProductTiers);
    });

    it('should return an error response if httpClient.get fails', async () => {
      const mockResponse: ApiResponse<ProductTier[]> = {
        error: mockError,
      };
      httpClientMock.get.mockResolvedValue(mockResponse);

      const result = await subscriptionsClient.listAvailableTiers();

      expect(httpClientMock.get).toHaveBeenCalledOnce();
      expect(result.error).toBe(mockError);
    });
  });
});
