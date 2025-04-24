import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InfactoryClient, InfactoryClientError } from '../src/client.js';
import { PlatformsClient } from '../src/clients/platforms-client.js';
import { OrganizationsClient } from '../src/clients/organizations-client.js';
import { TeamsClient } from '../src/clients/teams-client.js';

// Mock the HttpClient
vi.mock('../src/core/http-client', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      getApiKey: vi.fn().mockReturnValue('test-api-key'),
      getBaseUrl: vi.fn().mockReturnValue('https://api.infactory.ai')
    }))
  };
});

// Mock resource clients
vi.mock('../src/clients/platforms-client', () => {
  return {
    PlatformsClient: vi.fn().mockImplementation(() => ({
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }))
  };
});

vi.mock('../src/clients/organizations-client', () => {
  return {
    OrganizationsClient: vi.fn().mockImplementation(() => ({
      list: vi.fn(),
      get: vi.fn(),
      getByClerkId: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      move: vi.fn()
    }))
  };
});

vi.mock('../src/clients/teams-client', () => {
  return {
    TeamsClient: vi.fn().mockImplementation(() => ({
      getTeams: vi.fn(),
      getTeam: vi.fn(),
      createTeam: vi.fn(),
      updateTeam: vi.fn(),
      deleteTeam: vi.fn(),
      moveTeam: vi.fn(),
      getTeamMemberships: vi.fn(),
      createTeamMembership: vi.fn(),
      updateTeamMembership: vi.fn(),
      deleteTeamMembership: vi.fn()
    }))
  };
});

describe('InfactoryClient', () => {
  describe('constructor', () => {
    it('should create a client with valid API key', () => {
      const client = new InfactoryClient({ apiKey: 'test-api-key' });
      expect(client.getApiKey()).toBe('test-api-key');
    });

    it('should throw an error if API key is not provided', () => {
      expect(() => {
        // @ts-ignore intentionally passing invalid params for test
        new InfactoryClient({ apiKey: '' });
      }).toThrow(InfactoryClientError);
    });

    it('should use custom baseURL if provided', () => {
      const customUrl = 'https://custom.infactory.ai';
      const client = new InfactoryClient({
        apiKey: 'test-api-key',
        baseURL: customUrl,
      });
      expect(client.getBaseURL()).toBe(customUrl);
    });

    it('should initialize all resource clients', () => {
      const client = new InfactoryClient({ apiKey: 'test-api-key' });
      
      // Check that all client classes were initialized
      expect(PlatformsClient).toHaveBeenCalledTimes(1);
      expect(OrganizationsClient).toHaveBeenCalledTimes(1);
      expect(TeamsClient).toHaveBeenCalledTimes(1);
      
      // Check that all clients are accessible on the instance
      expect(client.platforms).toBeDefined();
      expect(client.organizations).toBeDefined();
      expect(client.teams).toBeDefined();
    });
  });

  describe('getter methods', () => {
    let client: InfactoryClient;

    beforeEach(() => {
      client = new InfactoryClient({ apiKey: 'test-api-key' });
    });

    it('should return API key', () => {
      expect(client.getApiKey()).toBe('test-api-key');
    });

    it('should return base URL', () => {
      expect(client.getBaseURL()).toBe('https://api.infactory.ai');
    });

    it('should return HTTP client', () => {
      expect(client.getHttpClient()).toBeDefined();
    });
  });
});
