import { post } from '@/core/client.js';
import { ApiResponse } from '@/types/common.js';

/**
 * Integration API endpoints
 * Provides access to various third-party integrations.
 */
export const integrationsApi = {
  /**
   * Handle Fivetran webhook notifications
   *
   * @param payload - The webhook payload from Fivetran
   * @param signatureHeader - The X-Fivetran-Signature-256 header for verification
   * @returns Response from the webhook handler
   */
  fivetranWebhook: async (
    payload: Record<string, any>,
    signatureHeader: string,
  ): Promise<ApiResponse<any>> => {
    return await post<any>('/v1/integrations/fivetran/webhook', {
      body: payload,
      headers: { 'X-Fivetran-Signature-256': signatureHeader },
    });
  },
};
