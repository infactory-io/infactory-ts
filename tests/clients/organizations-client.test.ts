import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrganizationsClient } from '../../src/clients/organizations-client.js';
import { HttpClient } from '../../src/core/http-client.js';
import { createErrorFromStatus } from '../../src/errors/index.js';

// Mock the HttpClient
vi.mock('../../src/core/http-client.js', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      get: vi.fn(),
      post: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn()
    }))
  };
});

describe('OrganizationsClient', () => {
  let organizationsClient: OrganizationsClient;
  let mockHttpClient: HttpClient;

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();
    
    // Create a new mock HttpClient instance
    mockHttpClient = new HttpClient({
      baseUrl: 'https://api.infactory.ai',
      apiKey: 'test-api-key'
    });
    
    // Create a new OrganizationsClient with the mock HttpClient
    organizationsClient = new OrganizationsClient(mockHttpClient);
  });

  describe('list', () => {
    it('should call the correct endpoint to list organizations', async () => {
      // Mock response data
      const mockOrganizations = [
        {
          id: 'org-1',
          name: 'Organization 1',
          description: 'Test Organization 1',
          platformId: 'platform-1',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z'
        },
        {
          id: 'org-2',
          name: 'Organization 2',
          description: 'Test Organization 2',
          platformId: 'platform-1',
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z'
        }
      ];

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockOrganizations
      });

      // Call the method
      const result = await organizationsClient.list();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/orgs');
      
      // Verify the result
      expect(result.data).toEqual(mockOrganizations);
    });

    it('should handle errors when listing organizations', async () => {
      // Setup the mock to return an error
      const mockError = createErrorFromStatus(500, 'server_error', 'Internal server error');

      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        error: mockError
      });

      // Call the method
      const result = await organizationsClient.list();

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/orgs');
      
      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('get', () => {
    it('should call the correct endpoint to get an organization by ID', async () => {
      // Mock response data
      const mockOrganization = {
        id: 'org-1',
        name: 'Organization 1',
        description: 'Test Organization 1',
        platformId: 'platform-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockOrganization
      });

      // Call the method
      const result = await organizationsClient.get('org-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/orgs/org-1');
      
      // Verify the result
      expect(result.data).toEqual(mockOrganization);
    });

    it('should handle errors when getting an organization by ID', async () => {
      // Setup the mock to return an error
      const mockError = createErrorFromStatus(404, 'not_found', 'Organization not found');

      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        error: mockError
      });

      // Call the method
      const result = await organizationsClient.get('non-existent-org');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/orgs/non-existent-org');
      
      // Verify the error was returned
      expect(result.error).toEqual(mockError);
    });
  });

  describe('getByClerkId', () => {
    it('should call the correct endpoint to get an organization by Clerk ID', async () => {
      // Mock response data
      const mockOrganization = {
        id: 'org-1',
        name: 'Organization 1',
        description: 'Test Organization 1',
        platformId: 'platform-1',
        clerkOrgId: 'clerk-org-123',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z'
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.get).mockResolvedValueOnce({
        data: mockOrganization
      });

      // Call the method
      const result = await organizationsClient.getByClerkId('clerk-org-123');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.get).toHaveBeenCalledWith('/v1/orgs/clerk/clerk-org-123');
      
      // Verify the result
      expect(result.data).toEqual(mockOrganization);
    });
  });

  describe('create', () => {
    it('should call the correct endpoint to create an organization', async () => {
      // Mock request data
      const createParams = {
        name: 'New Organization',
        description: 'New Test Organization',
        platformId: 'platform-1',
        clerkOrgId: 'clerk-org-456'
      };

      // Mock response data
      const mockResponse = {
        id: 'new-org',
        name: 'New Organization',
        description: 'New Test Organization',
        platformId: 'platform-1',
        clerkOrgId: 'clerk-org-456',
        createdAt: '2025-01-03T00:00:00Z',
        updatedAt: '2025-01-03T00:00:00Z'
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse
      });

      // Call the method
      const result = await organizationsClient.create(createParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith('/v1/orgs', createParams);
      
      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('update', () => {
    it('should call the correct endpoint to update an organization', async () => {
      // Mock request data
      const updateParams = {
        name: 'Updated Organization',
        description: 'Updated Test Organization'
      };

      // Mock response data
      const mockResponse = {
        id: 'org-1',
        name: 'Updated Organization',
        description: 'Updated Test Organization',
        platformId: 'platform-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-04T00:00:00Z'
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.patch).mockResolvedValueOnce({
        data: mockResponse
      });

      // Call the method
      const result = await organizationsClient.update('org-1', updateParams);

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.patch).toHaveBeenCalledWith('/v1/orgs/org-1', updateParams);
      
      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('delete', () => {
    it('should call the correct endpoint to delete an organization', async () => {
      // Mock response data
      const mockResponse = {
        id: 'org-1',
        name: 'Organization 1',
        description: 'Test Organization 1',
        platformId: 'platform-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
        deletedAt: '2025-01-05T00:00:00Z'
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.delete).mockResolvedValueOnce({
        data: mockResponse
      });

      // Call the method
      const result = await organizationsClient.delete('org-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.delete).toHaveBeenCalledWith('/v1/orgs/org-1');
      
      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('move', () => {
    it('should call the correct endpoint to move an organization to a new platform', async () => {
      // Mock response data
      const mockResponse = {
        id: 'org-1',
        name: 'Organization 1',
        description: 'Test Organization 1',
        platformId: 'new-platform-1',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-05T00:00:00Z'
      };

      // Setup the mock response
      vi.mocked(mockHttpClient.post).mockResolvedValueOnce({
        data: mockResponse
      });

      // Call the method
      const result = await organizationsClient.move('org-1', 'new-platform-1');

      // Verify the HTTP client was called correctly
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        '/v1/orgs/org-1/move', 
        { new_platform_id: 'new-platform-1' }
      );
      
      // Verify the result
      expect(result.data).toEqual(mockResponse);
    });
  });
});