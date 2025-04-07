import { InfactoryAPIError } from '@/errors/index.js';

/**
 * Standard API response format
 * Either contains data on success or an error on failure
 */
export interface ApiResponse<T> {
  data?: T;
  error?: InfactoryAPIError;
}

// Base types
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

// Platform types
export interface Platform extends BaseEntity {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreatePlatformParams {
  name: string;
  description?: string;
  metadata?: Record<string, any>;
}

// Organization types
export interface Organization extends BaseEntity {
  name: string;
  description?: string;
  platform_id: string;
  clerk_org_id?: string;
  teams: Team[];
}

export interface CreateOrganizationParams {
  name: string;
  description?: string;
  platform_id?: string;
  clerk_org_id?: string;
}

// Team types
export interface Team extends BaseEntity {
  name: string;
  organization_id: string;
}

export interface CreateTeamParams {
  name: string;
  organization_id: string;
}

// Project types
export interface Project extends BaseEntity {
  name: string;
  description?: string;
  team_id?: string;
}

export interface CreateProjectParams {
  name: string;
  description?: string;
  team_id: string;
}

// Infrastructure types
export interface Infrastructure extends BaseEntity {
  name: string;
  organization_id: string;
  type: string;
  config: Record<string, any>;
}

export interface CreateInfrastructureParams {
  name: string;
  organization_id: string;
  type: string;
  config: Record<string, any>;
}

// Dataline types
export interface Dataline extends BaseEntity {
  name: string;
  project_id: string;
  dataobject_id?: string;
  schema_code?: string;
  data_model?: Record<string, any>;
  dataobjects?: any;
  projects?: any;
  queryprograms?: any;
}

export interface DatasourceWithDatalines extends BaseEntity {
  name: string | null;
  type: string | null;
  uri: string | null;
  project_id: string;
  credentials: any;
  status:
    | 'created'
    | 'sync_waiting'
    | 'sync_started'
    | 'sync_completed'
    | 'sync_error'
    | 'transformation_started';
  dataobjects: DataObject[];
  projects: any;
}

export interface DataObject {
  id: string;
  bucket: string;
  key: string;
  file_type: string;
  file_size: number;
  etag: string;
  mime_type: string;
  metadata: any;
  datasource_id: string;
  downstream_lineage: Lineage[] | null;
  upstream_lineage: any;
  datalines: Dataline[];
  datasources: any;
  queryprograms: any;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Lineage extends BaseEntity {
  upstream_id: string | null;
  downstream_id: string;
  transformation: string;
  metadata: any;
  downstream: any;
  upstream: any;
}

export interface CreateDatalineParams {
  name: string;
  project_id: string;
  dataobject_id?: string;
  schema_code?: string;
  data_model?: Record<string, any>;
}

// Datasource types
export interface Datasource extends BaseEntity {
  name: string;
  project_id: string;
  type: string;
  uri?: string;
  status?:
    | 'created'
    | 'sync_waiting'
    | 'sync_started'
    | 'sync_completed'
    | 'sync_error'
    | 'transformation_started';
  deleted_at?: string | null;
}

export interface CreateDatasourceParams {
  name: string;
  project_id: string;
  type: string;
  uri?: string;
  status?:
    | 'created'
    | 'sync_waiting'
    | 'sync_started'
    | 'sync_completed'
    | 'sync_error'
    | 'transformation_started';
  deleted_at?: string | null;
}

// Credential types
export interface Credential extends BaseEntity {
  name: string;
  type: string;
  organization_id: string;
  config: Record<string, any>;
}

export interface CreateCredentialParams {
  name: string;
  type: string;
  description?: string;
  metadata?: Record<string, any>;
  datasource_id?: string;
  team_id?: string;
  organization_id: string;
  infrastructure_id?: string;
  config: Record<string, any>;
}

// Secret types
export interface Secret extends BaseEntity {
  name: string;
  team_id: string;
  type?: string;
  value: string;
  credentials_id?: string;
}

export interface CreateSecretParams {
  name: string;
  team_id: string;
  type?: string;
  value: string;
  credentials_id?: string;
}
// Query Program types
export interface QueryProgram extends BaseEntity {
  name?: string;
  query?: string;
  query_program?: string;
  steps?: string;
  slots?: string;
  stores?: string;
  published?: boolean;
  reason?: string;
  prev_id?: string;
  project_id: string;
}

export interface CreateQueryProgramParams {
  name?: string;
  query?: string;
  query_program?: string;
  steps?: string;
  slots?: string;
  stores?: string;
  published?: boolean;
  reason?: string;
  prev_id?: string;
  project_id: string;
}

export interface QueryResponse {
  result: any;
  metadata?: Record<string, any>;
}

// User and Role types
export interface User extends BaseEntity {
  email: string;
  name?: string;
  clerk_user_id: string;
}

export interface RBACRole extends BaseEntity {
  name: string;
  description?: string;
  permissions: string[];
}

// Task types
export interface Task extends BaseEntity {
  name: string;
  status: string;
  project_id: string;
  type: string;
  metadata?: Record<string, any>;
}

export interface CreateTaskParams {
  name: string;
  project_id: string;
  type: string;
  metadata?: Record<string, any>;
}

// Event types
export interface Event extends BaseEntity {
  name: string;
  project_id: string;
  type: string;
  status: string;
  metadata?: Record<string, any>;
}

export interface CreateEventParams {
  name: string;
  project_id: string;
  type: string;
  status: string;
  metadata?: Record<string, any>;
}

// Team Membership types
export interface TeamMembership extends BaseEntity {
  team_id: string;
  user_id: string;
  role: string;
}

export interface CreateTeamMembershipParams {
  team_id: string;
  user_id: string;
  role: string;
}

// API types
export interface API extends BaseEntity {
  name: string;
  description?: string;
  project_id: string;
  base_path: string;
  version: string;
  tags?: string[];
  status: 'draft' | 'published' | 'deprecated';
  specification?: Record<string, any>;
}
export interface CreateAPIParams {
  name: string;
  project_id: string;
  base_path: string;
  version: string;
  description?: string;
  servers?: string;
  security?: string;
  tags?: string;
}

export interface EndpointTypes {
  GET: 'GET';
  POST: 'POST';
  PUT: 'PUT';
  DELETE: 'DELETE';
  PATCH: 'PATCH';
}

export interface APIEndpoint extends BaseEntity {
  name: string;
  description?: string;
  api_id: string;
  path: string;
  tags?: string;
  http_method: EndpointTypes[keyof EndpointTypes];
  request_schema?: Record<string, any>;
  response_schema?: Record<string, any>;
  implementation?: string;
  queryprogram_id?: string;
}

export interface CreateAPIEndpointParams {
  api_id: string;
  endpoint_name: string;
  http_method: EndpointTypes[keyof EndpointTypes];
  path: string;
  queryprogram_id: string;
  description?: string;
  operation_id?: string;
  tags?: string;
  parameters?: string;
  request_body?: string;
  responses?: string;
  security?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export enum ConversationMode {
  build = 'build',
  explore = 'explore',
}

export interface ParameterSchema {
  type: string;
  description: string;
  format?: string;
  default?: any;
  enum?: string[];
}

export interface ListParameterSchema {
  type: 'array';
  description: string;
  items: ParameterSchema;
}

export interface FunctionParameters {
  type: 'object';
  properties: Record<string, ParameterSchema | ListParameterSchema>;
  required: string[];
  additionalProperties: boolean;
}

export interface FunctionDefinition {
  name: string;
  description: string;
  strict: boolean;
  parameters: FunctionParameters;
}

export interface ToolNameSpace {
  name: string;
  functions: FunctionDefinition[];
  fn_mapping: Record<string, string>;
}

export interface ContextInfo {
  location?: string;
  date?: string;
}

export interface FunctionMessageReference {
  request_id: string;
  conversation_id: string;
  author_user_id?: string;
  project_id?: string;
  node_id?: string;
  channel?: string;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
}

interface Node {
  id: string;
  type: string;
  data: {
    label: string;
    nodeType: string;
    [key: string]: any;
  };
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  data?: any;
}
