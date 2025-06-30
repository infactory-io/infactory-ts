import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InfactoryClient, InfactoryClientError } from '../src/client.js';
import { PlatformsClient } from '../src/clients/platforms-client.js';
import { OrganizationsClient } from '../src/clients/organizations-client.js';
import { TeamsClient } from '../src/clients/teams-client.js';
import { ProjectsClient } from '../src/clients/projects-client.js';
import { BuildClient } from '../src/clients/build-client.js';
import { RunClient } from '../src/clients/run-client.js';
import { ConnectClient } from '../src/clients/connect-client.js';

// Mock the HttpClient
vi.mock('../src/core/http-client', () => {
  return {
    HttpClient: vi.fn().mockImplementation(() => ({
      getApiKey: vi.fn().mockReturnValue('test-api-key'),
      getBaseUrl: vi.fn().mockReturnValue('https://api.infactory.ai'),
    })),
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
      delete: vi.fn(),
    })),
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
      move: vi.fn(),
    })),
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
      deleteTeamMembership: vi.fn(),
    })),
  };
});

vi.mock('../src/clients/projects-client', () => {
  return {
    ProjectsClient: vi.fn().mockImplementation(() => ({
      getProjects: vi.fn(),
      getTeamProjects: vi.fn(),
      getProject: vi.fn(),
      createProject: vi.fn(),
      updateProject: vi.fn(),
      deleteProject: vi.fn(),
      moveProject: vi.fn(),
      exportProject: vi.fn(),
      importProject: vi.fn(),
      validateImport: vi.fn(),
    })),
  };
});

vi.mock('../src/clients/build-client', () => {
  return {
    BuildClient: vi.fn().mockImplementation(() => ({
      // Mock methods as needed
    })),
  };
});

vi.mock('../src/clients/run-client', () => {
  return {
    RunClient: vi.fn().mockImplementation(() => ({
      // Mock methods as needed
    })),
  };
});

vi.mock('../src/clients/connect-client', () => {
  return {
    ConnectClient: vi.fn().mockImplementation(() => ({
      // Mock methods as needed
    })),
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
      expect(ProjectsClient).toHaveBeenCalledTimes(1);
      expect(BuildClient).toHaveBeenCalledTimes(1);
      expect(RunClient).toHaveBeenCalledTimes(1);
      expect(ConnectClient).toHaveBeenCalledTimes(1);

      // Check that all clients are accessible on the instance
      expect(client.platforms).toBeDefined();
      expect(client.organizations).toBeDefined();
      expect(client.teams).toBeDefined();
      expect(client.projects).toBeDefined();
      expect(client.build).toBeDefined();
      expect(client.run).toBeDefined();
      expect(client.connect).toBeDefined();
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
