/**
 * Ensure this aligns with the schema components of openapi schema and infactory database schemas 
 */
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
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}


// This could extent BaseEntity, but going to avoid this for clarity at the moment
export interface Platform {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  metadata?: Record<string, any>;
}


// Organization types
export interface Organization {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  name: string;
  description?: string;
  platformId: string;
  clerkOrgId?: string;
  teams: Team[];
}

// Team types
export interface Team extends BaseEntity {
  name: string;
  organizationId: string;
}

export interface CreateTeamParams {
  name: string;
  organizationId: string;
}

// Project types
export interface Project extends BaseEntity {
  name: string;
  description?: string;
  teamId?: string;
  datasources?: any;
  events?: any;
  teams?: any;
  datalines?: any;
  api?: any;
  jobs?: any;
  conversations?: any;
  queryprograms?: any;
  ontologies?: any;
  apiLogs?: any;
}

export interface CreateProjectParams {
  name: string;
  description?: string;
  teamId: string;
}

// Infrastructure types
export interface Infrastructure extends BaseEntity {
  name: string;
  organizationId: string;
  type: string;
  config: Record<string, any>;
}

export interface CreateInfrastructureParams {
  name: string;
  organizationId: string;
  type: string;
  config: Record<string, any>;
}

// Dataline types
export interface Dataline extends BaseEntity {
  name: string;
  projectId: string;
  dataobjectId?: string;
  schemaCode?: string;
  dataModel?: Record<string, any>;
  dataobjects?: any;
  projects?: any;
  queryprograms?: any;
}

export interface DatasourceWithDatalines extends BaseEntity {
  name: string | null;
  type: string | null;
  uri: string | null;
  projectId: string;
  credentials: any;
  status:
    | 'created'
    | 'sync_waiting'
    | 'sync_started'
    | 'sync_completed'
    | 'sync_error'
    | 'transformation_started'
    | null;
  dataobjects: DataObject[];
  projects: any;
}

export interface DataObject {
  id: string;
  bucket: string;
  key: string;
  fileType: string;
  fileSize: number;
  etag: string;
  mimeType: string;
  metadata: any;
  datasourceId: string;
  downstreamLineage: Lineage[] | null;
  upstreamLineage: any;
  datalines: Dataline[];
  datasources: any;
  queryprograms: any;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Lineage extends BaseEntity {
  upstreamId: string | null;
  downstreamId: string;
  transformation: string;
  metadata: any;
  downstream: any;
  upstream: any;
}

export interface CreateDatalineParams {
  name: string;
  projectId: string;
  dataobjectId?: string;
  schemaCode?: string;
  dataModel?: Record<string, any>;
}

// Datasource types
export interface Datasource extends BaseEntity {
  name: string;
  projectId: string;
  type: string;
  uri?: string;
  status?:
    | 'created'
    | 'sync_waiting'
    | 'sync_started'
    | 'sync_completed'
    | 'sync_error'
    | 'transformation_started';
  deletedAt?: string | null;
}

export interface CreateDatasourceParams {
  name: string;
  projectId: string;
  type: string;
  uri?: string;
  status?:
    | 'created'
    | 'sync_waiting'
    | 'sync_started'
    | 'sync_completed'
    | 'sync_error'
    | 'transformation_started';
  deletedAt?: string | null;
}

// Credential types
export interface Credential extends BaseEntity {
  name: string;
  type: string;
  organizationId: string;
  config: Record<string, any>;
}

export interface CreateCredentialParams {
  name: string;
  type: string;
  description?: string;
  metadata?: Record<string, any>;
  datasourceId?: string;
  teamId?: string;
  organizationId: string;
  infrastructureId?: string;
  config: Record<string, any>;
}

// Secret types
export interface Secret extends BaseEntity {
  name: string;
  teamId: string;
  type?: string;
  value: string;
  credentialsId?: string;
}

export interface CreateSecretParams {
  name: string;
  teamId: string;
  type?: string;
  value: string;
  credentialsId?: string;
}
// Query Program types
export interface QueryProgram extends BaseEntity {
  name?: string | null;
  query?: string | null;
  queryProgram?: string | null;
  steps?: string | null;
  slots?: string | null;
  stores?: string | null;
  published?: boolean | null;
  reason?: string | null;
  prevId?: string | null;
  projectId: string;
  ontologyId?: string | null;
}

export interface CreateQueryProgramParams {
  name?: string;
  query?: string;
  queryProgram?: string;
  steps?: string;
  slots?: string;
  stores?: string;
  published?: boolean;
  reason?: string;
  prevId?: string;
  projectId: string;
}

/**
 * Response from executing a query program
 * Aligns with the OpenAPI schema definition
 */
export interface QueryResponse {
  result: any;
  metadata?: Record<string, any>;
  success?: boolean;
  error?: string;
  status?: string;
  executionTime?: number;
}

// User and Role types
export interface User extends BaseEntity {
  email: string;
  name?: string;
  clerkUserId: string;
  organizationId?: string;
}

export interface UserTeam {
  userId: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UserWithTeamsAndOrganization extends User {
  userTeams: UserTeam[];
  organization: Organization;
  apiKeys: any;
  apiLogs: any;
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
  projectId: string;
  type: string;
  metadata?: Record<string, any>;
}

export interface CreateTaskParams {
  name: string;
  projectId: string;
  type: string;
  metadata?: Record<string, any>;
}

// Event types
export interface Event extends BaseEntity {
  name: string;
  projectId: string;
  type: string;
  status: string;
  metadata?: Record<string, any>;
}

export interface CreateEventParams {
  name: string;
  projectId: string;
  type: string;
  status: string;
  metadata?: Record<string, any>;
}

// Team Membership types
export interface TeamMembership extends BaseEntity {
  teamId: string;
  userId: string;
  role: string;
}

export interface CreateTeamMembershipParams {
  teamId: string;
  userId: string;
  role: string;
}

// API types
export interface API extends BaseEntity {
  name: string;
  description?: string;
  projectId: string;
  basePath: string;
  version: string;
  tags?: string[];
  status: 'draft' | 'published' | 'deprecated';
  specification?: Record<string, any>;
}
export interface CreateAPIParams {
  name: string;
  projectId: string;
  basePath: string;
  version: string;
  description?: string;
  servers?: string[];
  security?: SecurityRequirement[];
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
  apiId: string;
  path: string;
  tags?: string;
  httpMethod: EndpointTypes[keyof EndpointTypes];
  requestSchema?: Record<string, any>;
  responseSchema?: Record<string, any>;
  implementation?: string;
  queryprogramId?: string;
}

export interface CreateAPIEndpointParams {
  apiId: string;
  endpointName: string;
  httpMethod: EndpointTypes[keyof EndpointTypes];
  path: string;
  queryprogramId: string;
  description?: string;
  operationId?: string;
  tags?: string;
  parameters?: string;
  requestBody?: string;
  responses?: string;
  security?: SecurityRequirement[];
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
  fnMapping: Record<string, string>;
}

export interface ContextInfo {
  location?: string;
  date?: string;
}

export interface FunctionMessageReference {
  requestId: string;
  conversationId: string;
  authorUserId?: string;
  projectId?: string;
  nodeId?: string;
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

/** Security requirement in OpenAPI spec */
export interface SecurityRequirement {
  [scheme: string]: string[];
}

/** Security scheme object in OpenAPI components */
export interface SecurityScheme {
  type: 'http' | 'apiKey' | 'oauth2' | 'openIdConnect';
  description?: string;
  name?: string;
  in?: 'query' | 'header' | 'cookie';
  scheme?: string;
  bearerFormat?: string;
  flows?: Record<string, any>;
  openIdConnectUrl?: string;
}
