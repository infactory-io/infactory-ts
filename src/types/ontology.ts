import { BaseEntity } from './common.js';

/**
 * Entity type definition
 */
export interface Entity extends BaseEntity {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  project_id?: string;
  is_general?: boolean;
}

/**
 * Property type definition
 */
export interface Property extends BaseEntity {
  name: string;
  description?: string;
  entity_id: string;
  type: string;
  is_required?: boolean;
  is_unique?: boolean;
  default_value?: any;
}

/**
 * Relationship type definition
 */
export interface Relationship extends BaseEntity {
  name: string;
  description?: string;
  source_entity_id: string;
  target_entity_id: string;
  cardinality?: string;
}

/**
 * Entity with mention types
 */
export interface EntityMentionTypes extends Entity {
  mention_types: string[];
}

/**
 * Request to create an entity
 */
export interface CreateEntityRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  project_id?: string;
  is_general?: boolean;
}

/**
 * Request to update an entity
 */
export interface UpdateEntityRequest {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  project_id?: string;
  is_general?: boolean;
}

/**
 * Request to create a property
 */
export interface CreatePropertyRequest {
  name: string;
  description?: string;
  entity_id: string;
  type: string;
  is_required?: boolean;
  is_unique?: boolean;
  default_value?: any;
}

/**
 * Request to update a property
 */
export interface UpdatePropertyRequest {
  name?: string;
  description?: string;
  type?: string;
  is_required?: boolean;
  is_unique?: boolean;
  default_value?: any;
}

/**
 * Request to create a relationship
 */
export interface CreateRelationshipRequest {
  name: string;
  description?: string;
  source_entity_id: string;
  target_entity_id: string;
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
  project_id: string;
}
