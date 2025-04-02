import { get, post, patch, del } from '@/core/client.js';
import { Task, CreateTaskParams, ApiResponse } from '@/types/common.js';

export const tasksApi = {
  // Get all tasks
  getTasks: async (): Promise<ApiResponse<Task[]>> => {
    return await get<Task[]>('/v1/tasks');
  },

  // Get tasks for a project
  getProjectTasks: async (projectId: string): Promise<ApiResponse<Task[]>> => {
    return await get<Task[]>(`/v1/projects/${projectId}/tasks`);
  },

  // Get a single task
  getTask: async (taskId: string): Promise<ApiResponse<Task>> => {
    return await get<Task>(`/v1/tasks/${taskId}`);
  },

  // Create a new task
  createTask: async (params: CreateTaskParams): Promise<ApiResponse<Task>> => {
    return await post<Task>('/v1/tasks', { body: params });
  },

  // Update a task
  updateTask: async (
    taskId: string,
    params: Partial<CreateTaskParams>,
  ): Promise<ApiResponse<Task>> => {
    return await patch<Task>(`/v1/tasks/${taskId}`, { body: params });
  },

  // Delete a task
  deleteTask: async (taskId: string): Promise<ApiResponse<void>> => {
    return await del<void>(`/v1/tasks/${taskId}`);
  },

  // Cancel a task
  cancelTask: async (taskId: string): Promise<ApiResponse<Task>> => {
    return await post<Task>(`/v1/tasks/${taskId}/cancel`);
  },

  // Retry a failed task
  retryTask: async (taskId: string): Promise<ApiResponse<Task>> => {
    return await post<Task>(`/v1/tasks/${taskId}/retry`);
  },
};
