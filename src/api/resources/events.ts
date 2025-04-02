import { get, post, patch } from '@/core/client.js';
import { Event, ApiResponse, CreateEventParams } from '@/types/common.js';

export const eventsApi = {
  getProjectEvents: async (
    projectId: string,
  ): Promise<ApiResponse<Event[]>> => {
    return await get<Event[]>(`/v1/events/project/${projectId}`);
  },

  getEvent: async (eventId: string): Promise<ApiResponse<Event>> => {
    return await get<Event>(`/v1/events/${eventId}`);
  },

  createEvent: async (
    params: CreateEventParams,
  ): Promise<ApiResponse<Event>> => {
    return await post<Event>('/v1/events', {
      body: JSON.stringify(params),
    });
  },

  updateEventStatus: async (
    eventId: string,
    status: string,
  ): Promise<ApiResponse<Event>> => {
    return await patch<Event>(`/v1/events/${eventId}`, {
      body: JSON.stringify({ status }),
    });
  },
};
