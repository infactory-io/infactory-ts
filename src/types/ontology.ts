import { BaseEntity } from './common.js';

/**
 * Entity type definition
 */
export interface Entity extends BaseEntity {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  projectId?: string;
  isGeneral?: boolean;
}

/**
 * Property type definition
 */
export interface Property extends BaseEntity {
  name: string;
  description?: string;
  entityId: string;
  type: string;
  isRequired?: boolean;
  isUnique?: boolean;
  defaultValue?: any;
}

/**
 * Relationship type definition
 */
export interface Relationship extends BaseEntity {
  name: string;
  description?: string;
  sourceEntityId: string;
  targetEntityId: string;
  cardinality?: string;
}

/**
 * Entity with mention types
 */
export interface EntityMentionTypes extends Entity {
  mentionTypes: string[];
}

/**
 * Request to create an entity
 */
export interface CreateEntityRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  projectId?: string;
  isGeneral?: boolean;
}

/**
 * Request to update an entity
 */
export interface UpdateEntityRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  projectId?: string;
  isGeneral?: boolean;
}

/**
 * Request to create a property
 */
export interface CreatePropertyRequest {
  name: string;
  description?: string;
  entityId: string;
  type: string;
  isRequired?: boolean;
  isUnique?: boolean;
  defaultValue?: any;
}

/**
 * Request to update a property
 */
export interface UpdatePropertyRequest {
  name?: string;
  description?: string;
  type?: string;
  isRequired?: boolean;
  isUnique?: boolean;
  defaultValue?: any;
}

/**
 * Request to create a relationship
 */
export interface CreateRelationshipRequest {
  name: string;
  description?: string;
  sourceEntityId: string;
  targetEntityId: string;
  cardinality?: string;
}

/**
 * Request to update a relationship
 */
export interface UpdateRelationshipRequest {
  name?: string;
  description?: string;
  cardinality?: string;
}

/**
 * Request to generate an ontology
 */
export interface GenerateOntologyRequest {
  projectId: string;
}
