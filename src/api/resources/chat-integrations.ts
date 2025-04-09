import { get, post } from '@/core/client.js';
import { ApiResponse, ToolNameSpace } from '@/types/common.js';

/**
 * Chat Integrations API endpoints
 * Provides access to integration points for chat platforms.
 */
export const chatIntegrationsApi = {
  /**
   * Gets OpenAI chat completions compatible tools for a specific project
   *
   * @param project_id - The ID of the project
   * @returns A list of tools compatible with OpenAI chat completions API
   */
  getToolsEndpoint: async (
    project_id: string,
  ): Promise<ApiResponse<ToolNameSpace>> => {
    return await get<ToolNameSpace>(
      `/v1/integrations/chat/${project_id}/tools.json`,
    );
  },

  /**
   * Gets chat tool schema for a specific project
   *
   * @param project_id - The ID of the project
   * @returns The schema for chat tools
   */
  getChatToolSchema: async (project_id: string): Promise<ApiResponse<any>> => {
    return await get<any>(`/v1/integrations/chat/${project_id}/schema`);
  },

  /**
   * Call a specific tool function for a chat integration
   *
   * @param project_id - The ID of the project
   * @param tool_name - The name of the tool to call
   * @param params - The parameters to pass to the tool
   * @returns The result of the tool call
   */
  callToolFunction: async (
    project_id: string,
    tool_name: string,
    params: Record<string, any>,
  ): Promise<ApiResponse<any>> => {
    return await post<any>(
      `/v1/integrations/chat/${project_id}/call/${tool_name}`,
      {
        body: params,
      },
    );
  },
};
