/**
 * Type definitions for data-related models according to the OpenAPI schema
 */
import { BaseEntity } from './common.js';

/**
 * Model for DataObject matching the OpenAPI schema
 */
export interface DataObjectModel extends BaseEntity {
  bucket: string;
  key: string;
  file_type: string;
  file_size: number;
  etag: string;
  mime_type: string;
  metadata: Record<string, any> | null;
  datasource_id: string;
  downstream_lineage: LineageModel[] | null;
  upstream_lineage: Record<string, any> | null;
}

/**
 * Model for Lineage matching the OpenAPI schema
 */
export interface LineageModel extends BaseEntity {
  upstream_id: string | null;
  downstream_id: string;
  transformation: string;
  metadata: Record<string, any> | null;
  downstream: Record<string, any> | null;
  upstream: Record<string, any> | null;
}

/**
 * Model for DatasourceWithDataLines matching the OpenAPI schema
 */
export interface DatasourceWithDataLinesModel extends BaseEntity {
  name: string | null;
  type: string | null;
  uri: string | null;
  project_id: string;
  credentials: Record<string, any> | null;
  status:
    | 'created'
    | 'sync_waiting'
    | 'sync_started'
    | 'sync_completed'
    | 'sync_error'
    | 'transformation_started'
    | null;
  dataobjects: DataObjectModel[];
  projects: Record<string, any> | null;
}

/**
 * Model for FivetranWebhookPayload matching the OpenAPI schema
 */
export interface FivetranWebhookPayload {
  event_type: string;
  created_at: string;
  connector_id: string;
  group_id: string;
  connector_type: string;
  destination_id: string;
  service: string;
  data: Record<string, any>;
}

/**
 * Schema for a field in a data model
 */
export interface DataModelFieldSchema {
  name: string;
  type: string;
  description?: string;
  format?: string;
  nullable?: boolean;
  enum?: string[];
  properties?: Record<string, DataModelFieldSchema>;
  items?: DataModelFieldSchema;
  required?: string[];
  additionalProperties?: boolean | DataModelFieldSchema;
}

/**
 * Schema for a data model
 */
export interface DataModelSchema {
  title: string;
  description?: string;
  type: string;
  properties: Record<string, DataModelFieldSchema>;
  required?: string[];
  additionalProperties?: boolean | DataModelFieldSchema;
}

/**
 * Response containing data transformation information
 */
export interface TransformationResponse {
  id: string;
  status: string;
  metadata: Record<string, any> | null;
  result: Record<string, any> | null;
  error: string | null;
}
