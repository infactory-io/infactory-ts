import { fetchApi } from './client';
import { Event, CreateEventParams, ApiResponse } from './types';

export const eventsApi = {
  getProjectEvents: async (
    projectId: string
  ): Promise<ApiResponse<Event[]>> => {
    return fetchApi<Event[]>(`/v1/events/project/${projectId}`);
  },

  getEvent: async (eventId: string): Promise<ApiResponse<Event>> => {
    return fetchApi<Event>(`/v1/events/${eventId}`);
  },

  createEvent: async (
    params: CreateEventParams
  ): Promise<ApiResponse<Event>> => {
    return fetchApi<Event>('/v1/events', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  },

  updateEventStatus: async (
    eventId: string,
    status: string
  ): Promise<ApiResponse<Event>> => {
    return fetchApi<Event>(`/v1/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }
};
