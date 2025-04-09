import type { Event, CreateEventParams } from '@/types/common.js';
import { sharedClient, type ApiResponse } from '@/core/shared-client.js';

export const eventsApi = {
  getProjectEvents: async (
    projectId: string,
  ): Promise<ApiResponse<Event[]>> => {
    return await sharedClient.get<Event[]>(`/v1/events/project/${projectId}`);
  },

  getEvent: async (eventId: string): Promise<ApiResponse<Event>> => {
    return await sharedClient.get<Event>(`/v1/events/${eventId}`);
  },

  createEvent: async (
    params: CreateEventParams,
  ): Promise<ApiResponse<Event>> => {
    return await sharedClient.post<Event>('/v1/events', params);
  },

  updateEventStatus: async (
    eventId: string,
    status: string,
  ): Promise<ApiResponse<Event>> => {
    return await sharedClient.patch<Event>(`/v1/events/${eventId}`, { status });
  },
};
