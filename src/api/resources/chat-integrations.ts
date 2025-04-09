import { sharedClient, ApiResponse } from '@/core/shared-client.js';
import { ToolNameSpace } from '@/types/common.js';

/**
 * Chat Integrations API endpoints
 * Provides access to integration points for chat platforms.
 */
export const chatIntegrationsApi = {
  /**
   * Gets OpenAI chat completions compatible tools for a specific project
   *
   * @param projectId - The ID of the project
   * @returns A list of tools compatible with OpenAI chat completions API
   */
  getToolsEndpoint: async (
    projectId: string,
  ): Promise<ApiResponse<ToolNameSpace>> => {
    return await sharedClient.get<ToolNameSpace>(
      `/v1/integrations/chat/${projectId}/tools.json`,
    );
  },

  /**
   * Gets chat tool schema for a specific project
   *
   * @param projectId - The ID of the project
   * @returns The schema for chat tools
   */
  getChatToolSchema: async (projectId: string): Promise<ApiResponse<any>> => {
    return await sharedClient.get<any>(
      `/v1/integrations/chat/${projectId}/schema`,
    );
  },

  /**
   * Call a specific tool function for a chat integration
   *
   * @param projectId - The ID of the project
   * @param tool_name - The name of the tool to call
   * @param params - The parameters to pass to the tool
   * @returns The result of the tool call
   */
  callToolFunction: async (
    projectId: string,
    toolName: string,
    params: Record<string, any>,
  ): Promise<ApiResponse<any>> => {
    return await sharedClient.post<any>(
      `/v1/integrations/chat/${projectId}/call/${toolName}`,
      {
        body: params,
      },
    );
  },
};
