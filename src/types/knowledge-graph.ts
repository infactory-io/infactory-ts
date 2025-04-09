/**
 * Type definitions for the Knowledge Graph API
 */
import { BaseEntity } from './common.js';

/**
 * Knowledge Graph entity representing a graph structure
 */
export interface KnowledgeGraph extends BaseEntity {
  name: string;
  description: string | null;
  project_id: string;
  schema: Record<string, any> | null;
  metadata: Record<string, any> | null;
  status: 'active' | 'inactive' | 'building' | 'error';
  node_count: number;
  edge_count: number;
  last_updated: string | null;
}

/**
 * Knowledge Graph node entity
 */
export interface KnowledgeGraphNode extends BaseEntity {
  graph_id: string;
  label: string;
  properties: Record<string, any>;
  metadata: Record<string, any> | null;
  embedding: number[] | null;
}

/**
 * Knowledge Graph edge entity
 */
export interface KnowledgeGraphEdge extends BaseEntity {
  graph_id: string;
  source_id: string;
  target_id: string;
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
  top_k?: number;
  include_metadata?: boolean;
  include_embeddings?: boolean;
}

/**
 * Knowledge Graph search result
 */
export interface KnowledgeGraphSearchResult {
  nodes: KnowledgeGraphNode[];
  similarity_scores: Record<string, number>;
  query_embedding?: number[];
}

/**
 * Knowledge Graph import request
 */
export interface KnowledgeGraphImportRequest {
  source_type: 'file' | 'datasource' | 'api';
  source_id?: string;
  source_url?: string;
  config?: Record<string, any>;
}

/**
 * Knowledge Graph import status
 */
export interface KnowledgeGraphImportStatus extends BaseEntity {
  graph_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  progress: number;
  total_items: number;
  processed_items: number;
  error_message: string | null;
  metadata: Record<string, any> | null;
}
