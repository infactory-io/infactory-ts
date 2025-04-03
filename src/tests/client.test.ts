import { fetchApi } from '@/core/client.js';

// Mock global fetch
global.fetch = jest.fn();

describe('Client API', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('should handle successful API responses', async () => {
    // Mock implementation
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: '123' }),
    });

    const response = await fetchApi('/test-endpoint');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(response.data).toEqual({ id: '123' });
    expect(response.error).toBeUndefined();
  });

  it('should handle API errors', async () => {
    // Mock implementation
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve('Not Found'),
    });

    const response = await fetchApi('/test-endpoint');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(response.error).toBeDefined();
    expect(response.error?.status).toBe(404);
    expect(response.data).toBeUndefined();
  });
});
