import { fetchApi } from './client';
import { Task, CreateTaskParams } from './types';

export const tasksApi = {
  // Get all tasks
  getTasks: async (): Promise<Task[]> => {
    const response = await fetchApi<Task[]>('/v1/tasks');
    return response.data || [];
  },

  // Get tasks for a project
  getProjectTasks: async (projectId: string): Promise<Task[]> => {
    const response = await fetchApi<Task[]>(`/v1/projects/${projectId}/tasks`);
    return response.data || [];
  },

  // Get a single task
  getTask: async (taskId: string): Promise<Task | null> => {
    const response = await fetchApi<Task>(`/v1/tasks/${taskId}`);
    return response.data || null;
  },

  // Create a new task
  createTask: async (params: CreateTaskParams): Promise<Task | null> => {
    const response = await fetchApi<Task>('/v1/tasks', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    return response.data || null;
  },

  // Update a task
  updateTask: async (
    taskId: string,
    params: Partial<CreateTaskParams>
  ): Promise<Task | null> => {
    const response = await fetchApi<Task>(`/v1/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(params)
    });
    return response.data || null;
  },

  // Delete a task
  deleteTask: async (taskId: string): Promise<Task | null> => {
    const response = await fetchApi<Task>(`/v1/tasks/${taskId}`, {
      method: 'DELETE'
    });
    return response.data || null;
  },

  // Cancel a task
  cancelTask: async (taskId: string): Promise<Task | null> => {
    const response = await fetchApi<Task>(`/v1/tasks/${taskId}/cancel`, {
      method: 'POST'
    });
    return response.data || null;
  },

  // Retry a failed task
  retryTask: async (taskId: string): Promise<Task | null> => {
    const response = await fetchApi<Task>(`/v1/tasks/${taskId}/retry`, {
      method: 'POST'
    });
    return response.data || null;
  }
};
