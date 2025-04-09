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
  fileType: string;
  fileSize: number;
  etag: string;
  mimeType: string;
  metadata: Record<string, any> | null;
  datasourceId: string;
  downstreamLineage: LineageModel[] | null;
  upstreamLineage: Record<string, any> | null;
}

/**
 * Model for Lineage matching the OpenAPI schema
 */
export interface LineageModel extends BaseEntity {
  upstreamId: string | null;
  downstreamId: string;
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
  projectId: string;
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
  eventType: string;
  createdAt: string;
  connectorId: string;
  groupId: string;
  connectorType: string;
  destinationId: string;
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
