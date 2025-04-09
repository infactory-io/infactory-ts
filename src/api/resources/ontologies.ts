import { sharedClient, ApiResponse } from '@/core/shared-client.js';
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
} from '@/types/ontology.js';

/**
 * Ontology-related API endpoints for managing entities, properties, and relationships
 */
export const ontologyApi = {
  // Entity endpoints
  getEntities: async (): Promise<ApiResponse<Entity[]>> => {
    return await sharedClient.get<Entity[]>(`/v1/ontologies/entity`);
  },

  getEntitiesWithMentionTypes: async (
    projectId: string,
    includeGeneral: boolean = true,
  ): Promise<ApiResponse<EntityMentionTypes[]>> => {
    return await sharedClient.get<EntityMentionTypes[]>(
      `/v1/ontologies/all-entities`,
      {
        params: {
          projectId: projectId,
          includeGeneral: includeGeneral,
        },
      },
    );
  },

  getEntity: async (entityId: string): Promise<ApiResponse<Entity>> => {
    return await sharedClient.get<Entity>(`/v1/ontologies/entity/${entityId}`);
  },

  createEntity: async (
    params: CreateEntityRequest,
  ): Promise<ApiResponse<Entity>> => {
    return await sharedClient.post<Entity>(`/v1/ontologies/entity`, {
      body: params,
    });
  },

  updateEntity: async (
    entityId: string,
    params: UpdateEntityRequest,
  ): Promise<ApiResponse<Entity>> => {
    return await sharedClient.patch<Entity>(
      `/v1/ontologies/entity/${entityId}`,
      { body: params },
    );
  },

  deleteEntity: async (entityId: string): Promise<ApiResponse<Entity>> => {
    return await sharedClient.delete<Entity>(
      `/v1/ontologies/entity/${entityId}`,
    );
  },

  // Property endpoints
  getProperties: async (
    entityId?: string,
  ): Promise<ApiResponse<Property[]>> => {
    return await sharedClient.get<Property[]>(`/v1/ontologies/property`, {
      params: {
        entityId: entityId,
      },
    });
  },

  getProperty: async (propertyId: string): Promise<ApiResponse<Property>> => {
    return await sharedClient.get<Property>(
      `/v1/ontologies/property/${propertyId}`,
    );
  },

  createProperty: async (
    params: CreatePropertyRequest,
  ): Promise<ApiResponse<Property>> => {
    return await sharedClient.post<Property>(`/v1/ontologies/property`, {
      body: params,
    });
  },

  updateProperty: async (
    propertyId: string,
    params: UpdatePropertyRequest,
  ): Promise<ApiResponse<Property>> => {
    return await sharedClient.patch<Property>(
      `/v1/ontologies/property/${propertyId}`,
      { body: params },
    );
  },

  deleteProperty: async (
    propertyId: string,
  ): Promise<ApiResponse<Property>> => {
    return await sharedClient.delete<Property>(
      `/v1/ontologies/property/${propertyId}`,
    );
  },

  // Relationship endpoints
  getRelationships: async (
    sourceEntity?: string,
    targetEntity?: string,
  ): Promise<ApiResponse<Relationship[]>> => {
    return await sharedClient.get<Relationship[]>(
      `/v1/ontologies/relationship`,
      {
        params: {
          sourceEntity: sourceEntity,
          targetEntity: targetEntity,
        },
      },
    );
  },

  getRelationship: async (
    relationshipId: string,
  ): Promise<ApiResponse<Relationship>> => {
    return await sharedClient.get<Relationship>(
      `/v1/ontologies/relationship/${relationshipId}`,
    );
  },

  createRelationship: async (
    params: CreateRelationshipRequest,
  ): Promise<ApiResponse<Relationship>> => {
    return await sharedClient.post<Relationship>(
      `/v1/ontologies/relationship`,
      { body: params },
    );
  },

  updateRelationship: async (
    relationshipId: string,
    params: UpdateRelationshipRequest,
  ): Promise<ApiResponse<Relationship>> => {
    return await sharedClient.patch<Relationship>(
      `/v1/ontologies/relationship/${relationshipId}`,
      { body: params },
    );
  },

  deleteRelationship: async (
    relationshipId: string,
  ): Promise<ApiResponse<Relationship>> => {
    return await sharedClient.delete<Relationship>(
      `/v1/ontologies/relationship/${relationshipId}`,
    );
  },

  // Full ontology endpoints
  getFullOntology: async (): Promise<ApiResponse<Record<string, any[]>>> => {
    return await sharedClient.get<Record<string, any[]>>(`/v1/ontologies/full`);
  },

  searchOntology: async (
    query: string,
  ): Promise<ApiResponse<Record<string, any[]>>> => {
    return await sharedClient.get<Record<string, any[]>>(
      `/v1/ontologies/search`,
      {
        params: { query },
      },
    );
  },

  validateOntology: async (): Promise<
    ApiResponse<Record<string, string[]>>
  > => {
    return await sharedClient.get<Record<string, string[]>>(
      `/v1/ontologies/validate`,
    );
  },

  // Generate ontology
  generateOntology: async (
    params: GenerateOntologyRequest,
  ): Promise<ApiResponse<any>> => {
    return await sharedClient.post<any>(`/v1/actions/generate/ontology`, {
      body: params,
    });
  },

  // Beta variants (keeping both for backward compatibility)
  beta: {
    getEntities: async (): Promise<ApiResponse<Entity[]>> => {
      return await sharedClient.get<Entity[]>(`/beta/v1/ontologies/entity`);
    },

    getEntitiesWithMentionTypes: async (
      projectId: string,
      includeGeneral: boolean = true,
    ): Promise<ApiResponse<EntityMentionTypes[]>> => {
      return await sharedClient.get<EntityMentionTypes[]>(
        `/beta/v1/ontologies/all-entities`,
        {
          params: {
            projectId: projectId,
            includeGeneral: includeGeneral,
          },
        },
      );
    },

    getEntity: async (entityId: string): Promise<ApiResponse<Entity>> => {
      return await sharedClient.get<Entity>(
        `/beta/v1/ontologies/entity/${entityId}`,
      );
    },

    createEntity: async (
      params: CreateEntityRequest,
    ): Promise<ApiResponse<Entity>> => {
      return await sharedClient.post<Entity>(`/beta/v1/ontologies/entity`, {
        body: params,
      });
    },

    updateEntity: async (
      entityId: string,
      params: UpdateEntityRequest,
    ): Promise<ApiResponse<Entity>> => {
      return await sharedClient.patch<Entity>(
        `/beta/v1/ontologies/entity/${entityId}`,
        { body: params },
      );
    },

    deleteEntity: async (entityId: string): Promise<ApiResponse<Entity>> => {
      return await sharedClient.delete<Entity>(
        `/beta/v1/ontologies/entity/${entityId}`,
      );
    },

    getProperties: async (
      entityId?: string,
    ): Promise<ApiResponse<Property[]>> => {
      return await sharedClient.get<Property[]>(
        `/beta/v1/ontologies/property`,
        {
          params: {
            entityId: entityId,
          },
        },
      );
    },

    getProperty: async (propertyId: string): Promise<ApiResponse<Property>> => {
      return await sharedClient.get<Property>(
        `/beta/v1/ontologies/property/${propertyId}`,
      );
    },

    createProperty: async (
      params: CreatePropertyRequest,
    ): Promise<ApiResponse<Property>> => {
      return await sharedClient.post<Property>(`/beta/v1/ontologies/property`, {
        body: params,
      });
    },

    updateProperty: async (
      propertyId: string,
      params: UpdatePropertyRequest,
    ): Promise<ApiResponse<Property>> => {
      return await sharedClient.patch<Property>(
        `/beta/v1/ontologies/property/${propertyId}`,
        { body: params },
      );
    },

    deleteProperty: async (
      propertyId: string,
    ): Promise<ApiResponse<Property>> => {
      return await sharedClient.delete<Property>(
        `/beta/v1/ontologies/property/${propertyId}`,
      );
    },

    getRelationships: async (
      sourceEntity?: string,
      targetEntity?: string,
    ): Promise<ApiResponse<Relationship[]>> => {
      return await sharedClient.get<Relationship[]>(
        `/beta/v1/ontologies/relationship`,
        {
          params: {
            sourceEntity: sourceEntity,
            targetEntity: targetEntity,
          },
        },
      );
    },

    getRelationship: async (
      relationshipId: string,
    ): Promise<ApiResponse<Relationship>> => {
      return await sharedClient.get<Relationship>(
        `/beta/v1/ontologies/relationship/${relationshipId}`,
      );
    },

    createRelationship: async (
      params: CreateRelationshipRequest,
    ): Promise<ApiResponse<Relationship>> => {
      return await sharedClient.post<Relationship>(
        `/beta/v1/ontologies/relationship`,
        { body: params },
      );
    },

    updateRelationship: async (
      relationshipId: string,
      params: UpdateRelationshipRequest,
    ): Promise<ApiResponse<Relationship>> => {
      return await sharedClient.patch<Relationship>(
        `/beta/v1/ontologies/relationship/${relationshipId}`,
        { body: params },
      );
    },

    deleteRelationship: async (
      relationshipId: string,
    ): Promise<ApiResponse<Relationship>> => {
      return await sharedClient.delete<Relationship>(
        `/beta/v1/ontologies/relationship/${relationshipId}`,
      );
    },

    getFullOntology: async (): Promise<ApiResponse<Record<string, any[]>>> => {
      return await sharedClient.get<Record<string, any[]>>(
        `/beta/v1/ontologies/full`,
      );
    },

    searchOntology: async (
      query: string,
    ): Promise<ApiResponse<Record<string, any[]>>> => {
      return await sharedClient.get<Record<string, any[]>>(
        `/beta/v1/ontologies/search`,
        {
          params: { query },
        },
      );
    },

    validateOntology: async (): Promise<
      ApiResponse<Record<string, string[]>>
    > => {
      return await sharedClient.get<Record<string, string[]>>(
        `/beta/v1/ontologies/validate`,
      );
    },

    generateOntology: async (
      params: GenerateOntologyRequest,
    ): Promise<ApiResponse<any>> => {
      return await sharedClient.post<any>(
        `/beta/v1/actions/generate/ontology`,
        { body: params },
      );
    },
  },
};
