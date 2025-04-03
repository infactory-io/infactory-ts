// src/__tests__/resources/users.test.ts
import { usersApi } from '../../api/resources/users.js';
import fetchMock from 'jest-fetch-mock';

global.fetch = fetchMock;

describe('Users API', () => {
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  describe('getCurrentUser', () => {
    it('should return current user when successful', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        clerk_user_id: 'clerk-123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      fetchMock.mockResponseOnce(JSON.stringify(mockUser));

      const response = await usersApi.getCurrentUser();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/v1/authentication/me'),
        expect.any(Object),
      );

      expect(response.data).toEqual(mockUser);
      expect(response.error).toBeUndefined();
    });

    it('should return error when request fails', async () => {
      fetchMock.mockRejectOnce(new Error('API error'));

      const response = await usersApi.getCurrentUser();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(response.data).toBeUndefined();
      expect(response.error).toBeDefined();
    });
  });
});
