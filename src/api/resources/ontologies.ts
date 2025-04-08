import { get, post, del, patch } from '@/core/client.js';
import { ApiResponse } from '@/types/common.js';
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
    return await get<Entity[]>(`/v1/ontologies/entity`);
  },

  getEntitiesWithMentionTypes: async (
    projectId: string,
    includeGeneral: boolean = true,
  ): Promise<ApiResponse<EntityMentionTypes[]>> => {
    return await get<EntityMentionTypes[]>(`/v1/ontologies/all-entities`, {
      params: {
        project_id: projectId,
        include_general: includeGeneral,
      },
    });
  },

  getEntity: async (entityId: string): Promise<ApiResponse<Entity>> => {
    return await get<Entity>(`/v1/ontologies/entity/${entityId}`);
  },

  createEntity: async (
    params: CreateEntityRequest,
  ): Promise<ApiResponse<Entity>> => {
    return await post<Entity, CreateEntityRequest>(`/v1/ontologies/entity`, {
      body: params,
    });
  },

  updateEntity: async (
    entityId: string,
    params: UpdateEntityRequest,
  ): Promise<ApiResponse<Entity>> => {
    return await patch<Entity, UpdateEntityRequest>(
      `/v1/ontologies/entity/${entityId}`,
      { body: params },
    );
  },

  deleteEntity: async (entityId: string): Promise<ApiResponse<Entity>> => {
    return await del<Entity>(`/v1/ontologies/entity/${entityId}`);
  },

  // Property endpoints
  getProperties: async (
    entityId?: string,
  ): Promise<ApiResponse<Property[]>> => {
    return await get<Property[]>(`/v1/ontologies/property`, {
      params: {
        entity_id: entityId,
      },
    });
  },

  getProperty: async (propertyId: string): Promise<ApiResponse<Property>> => {
    return await get<Property>(`/v1/ontologies/property/${propertyId}`);
  },

  createProperty: async (
    params: CreatePropertyRequest,
  ): Promise<ApiResponse<Property>> => {
    return await post<Property, CreatePropertyRequest>(
      `/v1/ontologies/property`,
      { body: params },
    );
  },

  updateProperty: async (
    propertyId: string,
    params: UpdatePropertyRequest,
  ): Promise<ApiResponse<Property>> => {
    return await patch<Property, UpdatePropertyRequest>(
      `/v1/ontologies/property/${propertyId}`,
      { body: params },
    );
  },

  deleteProperty: async (
    propertyId: string,
  ): Promise<ApiResponse<Property>> => {
    return await del<Property>(`/v1/ontologies/property/${propertyId}`);
  },

  // Relationship endpoints
  getRelationships: async (
    sourceEntity?: string,
    targetEntity?: string,
  ): Promise<ApiResponse<Relationship[]>> => {
    return await get<Relationship[]>(`/v1/ontologies/relationship`, {
      params: {
        source_entity: sourceEntity,
        target_entity: targetEntity,
      },
    });
  },

  getRelationship: async (
    relationshipId: string,
  ): Promise<ApiResponse<Relationship>> => {
    return await get<Relationship>(
      `/v1/ontologies/relationship/${relationshipId}`,
    );
  },

  createRelationship: async (
    params: CreateRelationshipRequest,
  ): Promise<ApiResponse<Relationship>> => {
    return await post<Relationship, CreateRelationshipRequest>(
      `/v1/ontologies/relationship`,
      { body: params },
    );
  },

  updateRelationship: async (
    relationshipId: string,
    params: UpdateRelationshipRequest,
  ): Promise<ApiResponse<Relationship>> => {
    return await patch<Relationship, UpdateRelationshipRequest>(
      `/v1/ontologies/relationship/${relationshipId}`,
      { body: params },
    );
  },

  deleteRelationship: async (
    relationshipId: string,
  ): Promise<ApiResponse<Relationship>> => {
    return await del<Relationship>(
      `/v1/ontologies/relationship/${relationshipId}`,
    );
  },

  // Full ontology endpoints
  getFullOntology: async (): Promise<ApiResponse<Record<string, any[]>>> => {
    return await get<Record<string, any[]>>(`/v1/ontologies/full`);
  },

  searchOntology: async (
    query: string,
  ): Promise<ApiResponse<Record<string, any[]>>> => {
    return await get<Record<string, any[]>>(`/v1/ontologies/search`, {
      params: { query },
    });
  },

  validateOntology: async (): Promise<
    ApiResponse<Record<string, string[]>>
  > => {
    return await get<Record<string, string[]>>(`/v1/ontologies/validate`);
  },

  // Generate ontology
  generateOntology: async (
    params: GenerateOntologyRequest,
  ): Promise<ApiResponse<any>> => {
    return await post<any, GenerateOntologyRequest>(
      `/v1/actions/generate/ontology`,
      { body: params },
    );
  },

  // Beta variants (keeping both for backward compatibility)
  beta: {
    getEntities: async (): Promise<ApiResponse<Entity[]>> => {
      return await get<Entity[]>(`/beta/v1/ontologies/entity`);
    },

    getEntitiesWithMentionTypes: async (
      projectId: string,
      includeGeneral: boolean = true,
    ): Promise<ApiResponse<EntityMentionTypes[]>> => {
      return await get<EntityMentionTypes[]>(
        `/beta/v1/ontologies/all-entities`,
        {
          params: {
            project_id: projectId,
            include_general: includeGeneral,
          },
        },
      );
    },

    getEntity: async (entityId: string): Promise<ApiResponse<Entity>> => {
      return await get<Entity>(`/beta/v1/ontologies/entity/${entityId}`);
    },

    createEntity: async (
      params: CreateEntityRequest,
    ): Promise<ApiResponse<Entity>> => {
      return await post<Entity, CreateEntityRequest>(
        `/beta/v1/ontologies/entity`,
        { body: params },
      );
    },

    updateEntity: async (
      entityId: string,
      params: UpdateEntityRequest,
    ): Promise<ApiResponse<Entity>> => {
      return await patch<Entity, UpdateEntityRequest>(
        `/beta/v1/ontologies/entity/${entityId}`,
        { body: params },
      );
    },

    deleteEntity: async (entityId: string): Promise<ApiResponse<Entity>> => {
      return await del<Entity>(`/beta/v1/ontologies/entity/${entityId}`);
    },

    getProperties: async (
      entityId?: string,
    ): Promise<ApiResponse<Property[]>> => {
      return await get<Property[]>(`/beta/v1/ontologies/property`, {
        params: {
          entity_id: entityId,
        },
      });
    },

    getProperty: async (propertyId: string): Promise<ApiResponse<Property>> => {
      return await get<Property>(`/beta/v1/ontologies/property/${propertyId}`);
    },

    createProperty: async (
      params: CreatePropertyRequest,
    ): Promise<ApiResponse<Property>> => {
      return await post<Property, CreatePropertyRequest>(
        `/beta/v1/ontologies/property`,
        { body: params },
      );
    },

    updateProperty: async (
      propertyId: string,
      params: UpdatePropertyRequest,
    ): Promise<ApiResponse<Property>> => {
      return await patch<Property, UpdatePropertyRequest>(
        `/beta/v1/ontologies/property/${propertyId}`,
        { body: params },
      );
    },

    deleteProperty: async (
      propertyId: string,
    ): Promise<ApiResponse<Property>> => {
      return await del<Property>(`/beta/v1/ontologies/property/${propertyId}`);
    },

    getRelationships: async (
      sourceEntity?: string,
      targetEntity?: string,
    ): Promise<ApiResponse<Relationship[]>> => {
      return await get<Relationship[]>(`/beta/v1/ontologies/relationship`, {
        params: {
          source_entity: sourceEntity,
          target_entity: targetEntity,
        },
      });
    },

    getRelationship: async (
      relationshipId: string,
    ): Promise<ApiResponse<Relationship>> => {
      return await get<Relationship>(
        `/beta/v1/ontologies/relationship/${relationshipId}`,
      );
    },

    createRelationship: async (
      params: CreateRelationshipRequest,
    ): Promise<ApiResponse<Relationship>> => {
      return await post<Relationship, CreateRelationshipRequest>(
        `/beta/v1/ontologies/relationship`,
        { body: params },
      );
    },

    updateRelationship: async (
      relationshipId: string,
      params: UpdateRelationshipRequest,
    ): Promise<ApiResponse<Relationship>> => {
      return await patch<Relationship, UpdateRelationshipRequest>(
        `/beta/v1/ontologies/relationship/${relationshipId}`,
        { body: params },
      );
    },

    deleteRelationship: async (
      relationshipId: string,
    ): Promise<ApiResponse<Relationship>> => {
      return await del<Relationship>(
        `/beta/v1/ontologies/relationship/${relationshipId}`,
      );
    },

    getFullOntology: async (): Promise<ApiResponse<Record<string, any[]>>> => {
      return await get<Record<string, any[]>>(`/beta/v1/ontologies/full`);
    },

    searchOntology: async (
      query: string,
    ): Promise<ApiResponse<Record<string, any[]>>> => {
      return await get<Record<string, any[]>>(`/beta/v1/ontologies/search`, {
        params: { query },
      });
    },

    validateOntology: async (): Promise<
      ApiResponse<Record<string, string[]>>
    > => {
      return await get<Record<string, string[]>>(
        `/beta/v1/ontologies/validate`,
      );
    },

    generateOntology: async (
      params: GenerateOntologyRequest,
    ): Promise<ApiResponse<any>> => {
      return await post<any, GenerateOntologyRequest>(
        `/beta/v1/actions/generate/ontology`,
        { body: params },
      );
    },
  },
};
