/**
 * Type definitions for the Knowledge Graph API
 */
import { BaseEntity, DatasourceStatusType } from './common.js';

/**
 * Knowledge Graph entity representing a graph structure
 */
export interface KnowledgeGraph extends BaseEntity {
  name: string;
  description: string | null;
  projectId: string;
  schema: Record<string, any> | null;
  metadata: Record<string, any> | null;
  status: 'active' | 'inactive' | 'building' | 'error';
  nodeCount: number;
  edgeCount: number;
  lastUpdated: string | null;
}

/**
 * Knowledge Graph node entity
 */
export interface KnowledgeGraphNode extends BaseEntity {
  graphId: string;
  label: string;
  properties: Record<string, any>;
  metadata: Record<string, any> | null;
  embedding: number[] | null;
}

/**
 * Knowledge Graph edge entity
 */
export interface KnowledgeGraphEdge extends BaseEntity {
  graphId: string;
  sourceId: string;
  targetId: string;
  label: string;
  properties: Record<string, any> | null;
  weight: number | null;
}

/**
 * Knowledge Graph search request
 */
export interface KnowledgeGraphSearchRequest {
  query: string;
  filters?: Record<string, any>;
  topK?: number;
  includeMetadata?: boolean;
  includeEmbeddings?: boolean;
}

/**
 * Knowledge Graph search result
 */
export interface KnowledgeGraphSearchResult {
  nodes: KnowledgeGraphNode[];
  similarityScores: Record<string, number>;
  queryEmbedding?: number[];
}

/**
 * Knowledge Graph import request
 */
export interface KnowledgeGraphImportRequest {
  sourceType: 'file' | 'datasource' | 'api';
  sourceId?: string;
  sourceUrl?: string;
  config?: Record<string, any>;
}

/**
 * Knowledge Graph import status
 */
export interface KnowledgeGraphImportStatus extends BaseEntity {
  graphId: string;
  status: DatasourceStatusType;
  progress: number;
  totalItems: number;
  processedItems: number;
  errorMessage: string | null;
  metadata: Record<string, any> | null;
}
