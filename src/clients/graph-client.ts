import { HttpClient } from '../core/http-client.js';
import { ApiResponse, PaginationParams } from '../types/common.js';
import {
  Entity,
  Property,
  Relationship,
  EntityMentionTypes,
  CreateEntityRequest,
  UpdateEntityRequest,
  CreatePropertyRequest,
  UpdatePropertyRequest,
  CreateRelationshipRequest,
  UpdateRelationshipRequest,
  GenerateOntologyRequest,
} from '../types/ontology.js';

/**
 * Client for managing ontology in the Infactory API
 */
export class GraphClient {
  /**
   * Creates a new GraphClient instance
   * @param httpClient - The HTTP client to use for API requests
   */
  constructor(private readonly httpClient: HttpClient) {}

  // ===== Entity Methods =====

  /**
   * Get all entities in the ontology
   * @returns A promise that resolves to an API response containing an array of entities
   */
  async getEntities(): Promise<ApiResponse<Entity[]>> {
    return this.httpClient.get<Entity[]>('/v1/ontologies/entity');
  }

  /**
   * Get entities with mention types for a specific project
   * @param projectId - The ID of the project to get entities for
   * @param includeGeneral - Whether to include general entities
   * @returns A promise that resolves to an API response containing entities with mention types
   */
  async getEntitiesWithMentionTypes(
    projectId: string,
    includeGeneral: boolean = true,
  ): Promise<ApiResponse<EntityMentionTypes[]>> {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    return this.httpClient.get<EntityMentionTypes[]>(
      '/v1/ontologies/all-entities',
      {
        projectId: projectId,
        includeGeneral: includeGeneral,
      },
    );
  }

  /**
   * Get a specific entity by ID
   * @param entityId - The ID of the entity to retrieve
   * @returns A promise that resolves to an API response containing the entity
   */
  async getEntity(entityId: string): Promise<ApiResponse<Entity>> {
    if (!entityId) {
      throw new Error('Entity ID is required');
    }
    return this.httpClient.get<Entity>(`/v1/ontologies/entity/${entityId}`);
  }

  /**
   * Create a new entity
   * @param params - The parameters for creating the entity
   * @returns A promise that resolves to an API response containing the created entity
   */
  async createEntity(
    params: CreateEntityRequest,
  ): Promise<ApiResponse<Entity>> {
    if (!params) {
      throw new Error('Entity creation parameters are required');
    }
    return this.httpClient.post<Entity>('/v1/ontologies/entity', params);
  }

  /**
   * Update an entity
   * @param entityId - The ID of the entity to update
   * @param params - The parameters for updating the entity
   * @returns A promise that resolves to an API response containing the updated entity
   */
  async updateEntity(
    entityId: string,
    params: UpdateEntityRequest,
  ): Promise<ApiResponse<Entity>> {
    if (!entityId) {
      throw new Error('Entity ID is required');
    }
    if (!params) {
      throw new Error('Entity update parameters are required');
    }
    return this.httpClient.patch<Entity>(
      `/v1/ontologies/entity/${entityId}`,
      params,
    );
  }

  /**
   * Delete an entity
   * @param entityId - The ID of the entity to delete
   * @returns A promise that resolves to an API response containing the deleted entity
   */
  async deleteEntity(entityId: string): Promise<ApiResponse<Entity>> {
    if (!entityId) {
      throw new Error('Entity ID is required');
    }
    return this.httpClient.delete<Entity>(`/v1/ontologies/entity/${entityId}`);
  }

  // ===== Property Methods =====

  /**
   * Get all properties, optionally filtered by entity ID
   * @param entityId - Optional entity ID to filter properties by
   * @returns A promise that resolves to an API response containing an array of properties
   */
  async getProperties(entityId?: string): Promise<ApiResponse<Property[]>> {
    const params: Record<string, any> = {};
    if (entityId) {
      params.entityId = entityId;
    }
    return this.httpClient.get<Property[]>('/v1/ontologies/property', params);
  }

  /**
   * Get a specific property by ID
   * @param propertyId - The ID of the property to retrieve
   * @returns A promise that resolves to an API response containing the property
   */
  async getProperty(propertyId: string): Promise<ApiResponse<Property>> {
    if (!propertyId) {
      throw new Error('Property ID is required');
    }
    return this.httpClient.get<Property>(
      `/v1/ontologies/property/${propertyId}`,
    );
  }

  /**
   * Create a new property
   * @param params - The parameters for creating the property
   * @returns A promise that resolves to an API response containing the created property
   */
  async createProperty(
    params: CreatePropertyRequest,
  ): Promise<ApiResponse<Property>> {
    if (!params) {
      throw new Error('Property creation parameters are required');
    }
    return this.httpClient.post<Property>('/v1/ontologies/property', params);
  }

  /**
   * Update a property
   * @param propertyId - The ID of the property to update
   * @param params - The parameters for updating the property
   * @returns A promise that resolves to an API response containing the updated property
   */
  async updateProperty(
    propertyId: string,
    params: UpdatePropertyRequest,
  ): Promise<ApiResponse<Property>> {
    if (!propertyId) {
      throw new Error('Property ID is required');
    }
    if (!params) {
      throw new Error('Property update parameters are required');
    }
    return this.httpClient.patch<Property>(
      `/v1/ontologies/property/${propertyId}`,
      params,
    );
  }

  /**
   * Delete a property
   * @param propertyId - The ID of the property to delete
   * @returns A promise that resolves to an API response containing the deleted property
   */
  async deleteProperty(propertyId: string): Promise<ApiResponse<Property>> {
    if (!propertyId) {
      throw new Error('Property ID is required');
    }
    return this.httpClient.delete<Property>(
      `/v1/ontologies/property/${propertyId}`,
    );
  }

  // ===== Relationship Methods =====

  /**
   * Get all relationships, optionally filtered by source and/or target entity
   * @param sourceEntity - Optional source entity ID to filter relationships by
   * @param targetEntity - Optional target entity ID to filter relationships by
   * @returns A promise that resolves to an API response containing an array of relationships
   */
  async getRelationships(
    sourceEntity?: string,
    targetEntity?: string,
  ): Promise<ApiResponse<Relationship[]>> {
    const params: Record<string, any> = {};
    if (sourceEntity) {
      params.sourceEntity = sourceEntity;
    }
    if (targetEntity) {
      params.targetEntity = targetEntity;
    }
    return this.httpClient.get<Relationship[]>(
      '/v1/ontologies/relationship',
      params,
    );
  }

  /**
   * Get a specific relationship by ID
   * @param relationshipId - The ID of the relationship to retrieve
   * @returns A promise that resolves to an API response containing the relationship
   */
  async getRelationship(
    relationshipId: string,
  ): Promise<ApiResponse<Relationship>> {
    if (!relationshipId) {
      throw new Error('Relationship ID is required');
    }
    return this.httpClient.get<Relationship>(
      `/v1/ontologies/relationship/${relationshipId}`,
    );
  }

  /**
   * Create a new relationship
   * @param params - The parameters for creating the relationship
   * @returns A promise that resolves to an API response containing the created relationship
   */
  async createRelationship(
    params: CreateRelationshipRequest,
  ): Promise<ApiResponse<Relationship>> {
    if (!params) {
      throw new Error('Relationship creation parameters are required');
    }
    return this.httpClient.post<Relationship>(
      '/v1/ontologies/relationship',
      params,
    );
  }

  /**
   * Update a relationship
   * @param relationshipId - The ID of the relationship to update
   * @param params - The parameters for updating the relationship
   * @returns A promise that resolves to an API response containing the updated relationship
   */
  async updateRelationship(
    relationshipId: string,
    params: UpdateRelationshipRequest,
  ): Promise<ApiResponse<Relationship>> {
    if (!relationshipId) {
      throw new Error('Relationship ID is required');
    }
    if (!params) {
      throw new Error('Relationship update parameters are required');
    }
    return this.httpClient.patch<Relationship>(
      `/v1/ontologies/relationship/${relationshipId}`,
      params,
    );
  }

  /**
   * Delete a relationship
   * @param relationshipId - The ID of the relationship to delete
   * @returns A promise that resolves to an API response containing the deleted relationship
   */
  async deleteRelationship(
    relationshipId: string,
  ): Promise<ApiResponse<Relationship>> {
    if (!relationshipId) {
      throw new Error('Relationship ID is required');
    }
    return this.httpClient.delete<Relationship>(
      `/v1/ontologies/relationship/${relationshipId}`,
    );
  }

  // ===== Full Ontology Methods =====

  /**
   * Get the full ontology
   * @returns A promise that resolves to an API response containing the full ontology
   */
  async getFullOntology(): Promise<ApiResponse<Record<string, any[]>>> {
    return this.httpClient.get<Record<string, any[]>>('/v1/ontologies/full');
  }

  /**
   * Search the ontology
   * @param query - The search query
   * @returns A promise that resolves to an API response containing search results
   */
  async searchOntology(
    query: string,
  ): Promise<ApiResponse<Record<string, any[]>>> {
    if (!query) {
      throw new Error('Search query is required');
    }
    return this.httpClient.get<Record<string, any[]>>('/v1/ontologies/search', {
      query,
    });
  }

  /**
   * Validate the ontology
   * @returns A promise that resolves to an API response containing validation results
   */
  async validateOntology(): Promise<ApiResponse<Record<string, string[]>>> {
    return this.httpClient.get<Record<string, string[]>>(
      '/v1/ontologies/validate',
    );
  }

  /**
   * Generate an ontology based on input
   * @param params - The parameters for generating the ontology
   * @returns A promise that resolves to an API response containing the generated ontology
   */
  async generateOntology(
    params: GenerateOntologyRequest,
  ): Promise<ApiResponse<any>> {
    if (!params) {
      throw new Error('Ontology generation parameters are required');
    }
    return this.httpClient.post<any>('/v1/actions/generate/ontology', params);
  }

  // ===== Knowledge Graph Methods =====

  /**
   * Get a knowledge graph by ID
   * @param id - The ID of the knowledge graph to retrieve
   * @returns A promise that resolves to an API response containing the knowledge graph
   */
  async getKnowledgeGraph(id: string): Promise<ApiResponse<any>> {
    if (!id) {
      throw new Error('Knowledge graph ID is required');
    }
    return this.httpClient.get<any>(`/v1/knowledge-graph/${id}`);
  }

  /**
   * List knowledge graphs, optionally filtered by project
   * @param params - Optional pagination and filtering parameters
   * @returns A promise that resolves to an API response containing an array of knowledge graphs
   */
  async listKnowledgeGraphs(
    params?: PaginationParams & { projectId?: string },
  ): Promise<ApiResponse<any[]>> {
    return this.httpClient.get<any[]>('/v1/knowledge-graph', params);
  }

  /**
   * Create a new knowledge graph
   * @param params - The parameters for creating the knowledge graph
   * @returns A promise that resolves to an API response containing the created knowledge graph
   */
  async createKnowledgeGraph(params: {
    name: string;
    projectId: string;
    description?: string;
    schema?: any;
    config?: Record<string, any>;
  }): Promise<ApiResponse<any>> {
    if (!params.name) {
      throw new Error('Knowledge graph name is required');
    }
    if (!params.projectId) {
      throw new Error('Project ID is required');
    }

    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value != null),
    );
    return this.httpClient.post<any>('/v1/knowledge-graph', filteredParams);
  }

  /**
   * Update a knowledge graph
   * @param id - The ID of the knowledge graph to update
   * @param params - The parameters for updating the knowledge graph
   * @returns A promise that resolves to an API response containing the updated knowledge graph
   */
  async updateKnowledgeGraph(
    id: string,
    params: {
      name?: string;
      description?: string;
      schema?: any;
      config?: Record<string, any>;
    },
  ): Promise<ApiResponse<any>> {
    if (!id) {
      throw new Error('Knowledge graph ID is required');
    }
    if (!params || Object.keys(params).length === 0) {
      throw new Error('At least one update parameter is required');
    }

    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value != null),
    );
    return this.httpClient.patch<any>(
      `/v1/knowledge-graph/${id}`,
      filteredParams,
    );
  }

  /**
   * Delete a knowledge graph
   * @param id - The ID of the knowledge graph to delete
   * @returns A promise that resolves to an API response
   */
  async deleteKnowledgeGraph(id: string): Promise<ApiResponse<void>> {
    if (!id) {
      throw new Error('Knowledge graph ID is required');
    }
    return this.httpClient.delete<void>(`/v1/knowledge-graph/${id}`);
  }

  /**
   * Get the schema for a knowledge graph
   * @param id - The ID of the knowledge graph
   * @returns A promise that resolves to an API response containing the schema
   */
  async getKnowledgeGraphSchema(id: string): Promise<ApiResponse<any>> {
    if (!id) {
      throw new Error('Knowledge graph ID is required');
    }
    return this.httpClient.get<any>(`/v1/knowledge-graph/${id}/schema`);
  }

  /**
   * Update the schema for a knowledge graph
   * @param id - The ID of the knowledge graph
   * @param schema - The new schema to apply
   * @returns A promise that resolves to an API response containing the updated schema
   */
  async updateKnowledgeGraphSchema(
    id: string,
    schema: any,
  ): Promise<ApiResponse<any>> {
    if (!id) {
      throw new Error('Knowledge graph ID is required');
    }
    if (!schema) {
      throw new Error('Schema is required');
    }
    return this.httpClient.patch<any>(
      `/v1/knowledge-graph/${id}/schema`,
      schema,
    );
  }

  /**
   * Query a knowledge graph
   * @param id - The ID of the knowledge graph to query
   * @param query - The query to execute
   * @returns A promise that resolves to an API response containing the query results
   */
  async queryKnowledgeGraph(id: string, query: any): Promise<ApiResponse<any>> {
    if (!id) {
      throw new Error('Knowledge graph ID is required');
    }
    if (!query) {
      throw new Error('Query is required');
    }
    return this.httpClient.post<any>(`/v1/knowledge-graph/${id}/query`, query);
  }

  // ===== Beta Versions =====

  /**
   * Beta versions of the ontology API for backward compatibility
   */
  beta = {
    /**
     * Get all entities in the ontology (beta version)
     * @returns A promise that resolves to an API response containing an array of entities
     */
    getEntities: async (): Promise<ApiResponse<Entity[]>> => {
      return this.httpClient.get<Entity[]>('/beta/v1/ontologies/entity');
    },

    /**
     * Get entities with mention types for a specific project (beta version)
     * @param projectId - The ID of the project to get entities for
     * @param includeGeneral - Whether to include general entities
     * @returns A promise that resolves to an API response containing entities with mention types
     */
    getEntitiesWithMentionTypes: async (
      projectId: string,
      includeGeneral: boolean = true,
    ): Promise<ApiResponse<EntityMentionTypes[]>> => {
      if (!projectId) {
        throw new Error('Project ID is required');
      }
      return this.httpClient.get<EntityMentionTypes[]>(
        '/beta/v1/ontologies/all-entities',
        {
          projectId,
          includeGeneral,
        },
      );
    },

    /**
     * Get a specific entity by ID (beta version)
     * @param entityId - The ID of the entity to retrieve
     * @returns A promise that resolves to an API response containing the entity
     */
    getEntity: async (entityId: string): Promise<ApiResponse<Entity>> => {
      if (!entityId) {
        throw new Error('Entity ID is required');
      }
      return this.httpClient.get<Entity>(
        `/beta/v1/ontologies/entity/${entityId}`,
      );
    },

    /**
     * Create a new entity (beta version)
     * @param params - The parameters for creating the entity
     * @returns A promise that resolves to an API response containing the created entity
     */
    createEntity: async (
      params: CreateEntityRequest,
    ): Promise<ApiResponse<Entity>> => {
      if (!params) {
        throw new Error('Entity creation parameters are required');
      }
      return this.httpClient.post<Entity>('/beta/v1/ontologies/entity', params);
    },

    /**
     * Update an entity (beta version)
     * @param entityId - The ID of the entity to update
     * @param params - The parameters for updating the entity
     * @returns A promise that resolves to an API response containing the updated entity
     */
    updateEntity: async (
      entityId: string,
      params: UpdateEntityRequest,
    ): Promise<ApiResponse<Entity>> => {
      if (!entityId) {
        throw new Error('Entity ID is required');
      }
      if (!params) {
        throw new Error('Entity update parameters are required');
      }
      return this.httpClient.patch<Entity>(
        `/beta/v1/ontologies/entity/${entityId}`,
        params,
      );
    },

    /**
     * Delete an entity (beta version)
     * @param entityId - The ID of the entity to delete
     * @returns A promise that resolves to an API response containing the deleted entity
     */
    deleteEntity: async (entityId: string): Promise<ApiResponse<Entity>> => {
      if (!entityId) {
        throw new Error('Entity ID is required');
      }
      return this.httpClient.delete<Entity>(
        `/beta/v1/ontologies/entity/${entityId}`,
      );
    },

    /**
     * Get all properties, optionally filtered by entity ID (beta version)
     * @param entityId - Optional entity ID to filter properties by
     * @returns A promise that resolves to an API response containing an array of properties
     */
    getProperties: async (
      entityId?: string,
    ): Promise<ApiResponse<Property[]>> => {
      const params: Record<string, any> = {};
      if (entityId) {
        params.entityId = entityId;
      }
      return this.httpClient.get<Property[]>(
        '/beta/v1/ontologies/property',
        params,
      );
    },

    /**
     * Get a specific property by ID (beta version)
     * @param propertyId - The ID of the property to retrieve
     * @returns A promise that resolves to an API response containing the property
     */
    getProperty: async (propertyId: string): Promise<ApiResponse<Property>> => {
      if (!propertyId) {
        throw new Error('Property ID is required');
      }
      return this.httpClient.get<Property>(
        `/beta/v1/ontologies/property/${propertyId}`,
      );
    },

    /**
     * Create a new property (beta version)
     * @param params - The parameters for creating the property
     * @returns A promise that resolves to an API response containing the created property
     */
    createProperty: async (
      params: CreatePropertyRequest,
    ): Promise<ApiResponse<Property>> => {
      if (!params) {
        throw new Error('Property creation parameters are required');
      }
      return this.httpClient.post<Property>(
        '/beta/v1/ontologies/property',
        params,
      );
    },

    /**
     * Update a property (beta version)
     * @param propertyId - The ID of the property to update
     * @param params - The parameters for updating the property
     * @returns A promise that resolves to an API response containing the updated property
     */
    updateProperty: async (
      propertyId: string,
      params: UpdatePropertyRequest,
    ): Promise<ApiResponse<Property>> => {
      if (!propertyId) {
        throw new Error('Property ID is required');
      }
      if (!params) {
        throw new Error('Property update parameters are required');
      }
      return this.httpClient.patch<Property>(
        `/beta/v1/ontologies/property/${propertyId}`,
        params,
      );
    },

    /**
     * Delete a property (beta version)
     * @param propertyId - The ID of the property to delete
     * @returns A promise that resolves to an API response containing the deleted property
     */
    deleteProperty: async (
      propertyId: string,
    ): Promise<ApiResponse<Property>> => {
      if (!propertyId) {
        throw new Error('Property ID is required');
      }
      return this.httpClient.delete<Property>(
        `/beta/v1/ontologies/property/${propertyId}`,
      );
    },

    /**
     * Get all relationships, optionally filtered by source and/or target entity (beta version)
     * @param sourceEntity - Optional source entity ID to filter relationships by
     * @param targetEntity - Optional target entity ID to filter relationships by
     * @returns A promise that resolves to an API response containing an array of relationships
     */
    getRelationships: async (
      sourceEntity?: string,
      targetEntity?: string,
    ): Promise<ApiResponse<Relationship[]>> => {
      const params: Record<string, any> = {};
      if (sourceEntity) {
        params.sourceEntity = sourceEntity;
      }
      if (targetEntity) {
        params.targetEntity = targetEntity;
      }
      return this.httpClient.get<Relationship[]>(
        '/beta/v1/ontologies/relationship',
        params,
      );
    },

    /**
     * Get a specific relationship by ID (beta version)
     * @param relationshipId - The ID of the relationship to retrieve
     * @returns A promise that resolves to an API response containing the relationship
     */
    getRelationship: async (
      relationshipId: string,
    ): Promise<ApiResponse<Relationship>> => {
      if (!relationshipId) {
        throw new Error('Relationship ID is required');
      }
      return this.httpClient.get<Relationship>(
        `/beta/v1/ontologies/relationship/${relationshipId}`,
      );
    },

    /**
     * Create a new relationship (beta version)
     * @param params - The parameters for creating the relationship
     * @returns A promise that resolves to an API response containing the created relationship
     */
    createRelationship: async (
      params: CreateRelationshipRequest,
    ): Promise<ApiResponse<Relationship>> => {
      if (!params) {
        throw new Error('Relationship creation parameters are required');
      }
      return this.httpClient.post<Relationship>(
        '/beta/v1/ontologies/relationship',
        params,
      );
    },

    /**
     * Update a relationship (beta version)
     * @param relationshipId - The ID of the relationship to update
     * @param params - The parameters for updating the relationship
     * @returns A promise that resolves to an API response containing the updated relationship
     */
    updateRelationship: async (
      relationshipId: string,
      params: UpdateRelationshipRequest,
    ): Promise<ApiResponse<Relationship>> => {
      if (!relationshipId) {
        throw new Error('Relationship ID is required');
      }
      if (!params) {
        throw new Error('Relationship update parameters are required');
      }
      return this.httpClient.patch<Relationship>(
        `/beta/v1/ontologies/relationship/${relationshipId}`,
        params,
      );
    },

    /**
     * Delete a relationship (beta version)
     * @param relationshipId - The ID of the relationship to delete
     * @returns A promise that resolves to an API response containing the deleted relationship
     */
    deleteRelationship: async (
      relationshipId: string,
    ): Promise<ApiResponse<Relationship>> => {
      if (!relationshipId) {
        throw new Error('Relationship ID is required');
      }
      return this.httpClient.delete<Relationship>(
        `/beta/v1/ontologies/relationship/${relationshipId}`,
      );
    },

    /**
     * Get the full ontology (beta version)
     * @returns A promise that resolves to an API response containing the full ontology
     */
    getFullOntology: async (): Promise<ApiResponse<Record<string, any[]>>> => {
      return this.httpClient.get<Record<string, any[]>>(
        '/beta/v1/ontologies/full',
      );
    },

    /**
     * Search the ontology (beta version)
     * @param query - The search query
     * @returns A promise that resolves to an API response containing search results
     */
    searchOntology: async (
      query: string,
    ): Promise<ApiResponse<Record<string, any[]>>> => {
      if (!query) {
        throw new Error('Search query is required');
      }
      return this.httpClient.get<Record<string, any[]>>(
        '/beta/v1/ontologies/search',
        { query },
      );
    },

    /**
     * Validate the ontology (beta version)
     * @returns A promise that resolves to an API response containing validation results
     */
    validateOntology: async (): Promise<
      ApiResponse<Record<string, string[]>>
    > => {
      return this.httpClient.get<Record<string, string[]>>(
        '/beta/v1/ontologies/validate',
      );
    },

    /**
     * Generate an ontology based on input (beta version)
     * @param params - The parameters for generating the ontology
     * @returns A promise that resolves to an API response containing the generated ontology
     */
    generateOntology: async (
      params: GenerateOntologyRequest,
    ): Promise<ApiResponse<any>> => {
      if (!params) {
        throw new Error('Ontology generation parameters are required');
      }
      return this.httpClient.post<any>(
        '/beta/v1/actions/generate/ontology',
        params,
      );
    },
  };
}
