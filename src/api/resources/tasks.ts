import { sharedClient, ApiResponse } from '@/core/shared-client.js';
import { Task, CreateTaskParams } from '@/types/common.js';

export const tasksApi = {
  // Get all tasks
  getTasks: async (): Promise<ApiResponse<Task[]>> => {
    return await sharedClient.get<Task[]>('/v1/tasks');
  },

  // Get tasks for a project
  getProjectTasks: async (projectId: string): Promise<ApiResponse<Task[]>> => {
    return await sharedClient.get<Task[]>(`/v1/projects/${projectId}/tasks`);
  },

  // Get a single task
  getTask: async (taskId: string): Promise<ApiResponse<Task>> => {
    return await sharedClient.get<Task>(`/v1/tasks/${taskId}`);
  },

  // Create a new task
  createTask: async (params: CreateTaskParams): Promise<ApiResponse<Task>> => {
    return await sharedClient.post<Task>('/v1/tasks', { body: params });
  },

  // Update a task
  updateTask: async (
    taskId: string,
    params: Partial<CreateTaskParams>,
  ): Promise<ApiResponse<Task>> => {
    return await sharedClient.patch<Task>(`/v1/tasks/${taskId}`, {
      body: params,
    });
  },

  // Delete a task
  deleteTask: async (taskId: string): Promise<ApiResponse<void>> => {
    return await sharedClient.delete<void>(`/v1/tasks/${taskId}`);
  },

  // Cancel a task
  cancelTask: async (taskId: string): Promise<ApiResponse<Task>> => {
    return await sharedClient.post<Task>(`/v1/tasks/${taskId}/cancel`);
  },

  // Retry a failed task
  retryTask: async (taskId: string): Promise<ApiResponse<Task>> => {
    return await sharedClient.post<Task>(`/v1/tasks/${taskId}/retry`);
  },
};
