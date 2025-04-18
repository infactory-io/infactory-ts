// src/__tests__/resources/users.test.ts
import { usersApi } from '../../api/resources/users.js';

// The global.fetch is now handled by jest-fetch-mock

describe('Users API', () => {
  beforeEach(() => {
    // Reset mocks before each test
    fetchMock.doMock();
    fetchMock.resetMocks();
  });

  describe('getCurrentUser', () => {
    it('should return current user when successful', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        clerk_userId: 'clerk-123',
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
      };

      // Use the proper mock method from jest-fetch-mock
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
      // Use the proper mock method from jest-fetch-mock
      fetchMock.mockRejectOnce(new Error('API error'));

      const response = await usersApi.getCurrentUser();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(response.data).toBeUndefined();
      expect(response.error).toBeDefined();
    });
  });
});
