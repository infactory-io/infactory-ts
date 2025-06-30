/**
 * Ensure this aligns with the schema components of openapi schema and infactory database schemas
 */

import {
  TestHttpConnectionResponse,
  HttpMethod,
  AuthType,
} from '@/clients/integrations-client.js';
import { InfactoryAPIError } from '@/errors/index.js';

/**
 * Standard API response format
 * Either contains data on success or an error on failure
 */
export interface ApiResponse<T> {
  data?: T;
  error?: InfactoryAPIError;
}

export interface ApiKeyResponse<TData = any> {
  success: boolean;
  data?: TData;
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

/**
 * Team object as returned by the API
 */
export interface Team {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  credentials?: any;
  projects?: any;
  rbac?: any;
  secrets?: any;
  organizations?: any;
  userTeams?: any;
}

/**
 * Team Membership object as returned by the API
 */
export interface TeamMembership {
  userId: string;
  teamId: string;
  role: TeamMembershipRole;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/**
 * Valid roles for team memberships
 */
export enum TeamMembershipRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

/**
 * Project object as returned by the API
 */
export interface Project {
  id: string;
  name: string;
  description?: string;
  teamId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  datasources?: any[];
  events?: any[];
  teams?: any[];
  datalines?: any[];
  api?: any[];
  jobs?: any[];
  conversations?: any[];
  queryprograms?: any[];
  ontologies?: any[];
  apiLogs?: any[];
}

export interface CreateProjectParams {
  name: string;
  description?: string;
  teamId: string;
}

// Make sure the User interface is properly defined
export interface User extends BaseEntity {
  email: string;
  name?: string;
  clerkUserId: string;
  organizationId?: string;
}

// Make sure the RBACRole interface is properly defined
export interface RBACRole extends BaseEntity {
  name: string;
  description?: string;
  permissions: string[];
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

// Status enum
export enum DatasourceStatus {
  WORKING = 'working',
  READY = 'ready',
  FAILED = 'failed',
  /**
   * Newly created datasource that has not started any processing yet
   */
  CREATED = 'created',
}

// Phase enum
export enum DatasourcePhase {
  // Upload phases
  UPLOAD_STARTED = 'upload_started',
  UPLOAD_IN_PROGRESS = 'upload_in_progress',
  UPLOAD_COMPLETED = 'upload_completed',

  // Sync phases
  SYNC_STARTED = 'sync_started',
  SYNC_IN_PROGRESS = 'sync_in_progress',
  SYNC_COMPLETED = 'sync_completed',

  // Convert phases
  CONVERT_STARTED = 'convert_started',
  CONVERT_IN_PROGRESS = 'convert_in_progress',
  CONVERT_COMPLETED = 'convert_completed',

  // Schema generation phases
  SCHEMA_GENERATION_STARTED = 'generate_schema_started',
  SCHEMA_GENERATION_IN_PROGRESS = 'generate_schema_in_progress',
  SCHEMA_GENERATION_COMPLETED = 'generate_schema_completed',

  // Transformation phases
  TRANSFORMATION_STARTED = 'transformation_started',
  TRANSFORMATION_IN_PROGRESS = 'transformation_in_progress',
  TRANSFORMATION_COMPLETED = 'transformation_completed',

  // Generic phases
  STARTED = 'started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

// Type aliases
export type DatasourceStatusType = 'working' | 'ready' | 'failed';
export type DatasourcePhaseType =
  | 'upload_started'
  | 'upload_in_progress'
  | 'upload_completed'
  | 'sync_started'
  | 'sync_in_progress'
  | 'sync_completed'
  | 'convert_started'
  | 'convert_in_progress'
  | 'convert_completed'
  | 'generate_schema_started'
  | 'generate_schema_in_progress'
  | 'generate_schema_completed'
  | 'transformation_started'
  | 'transformation_in_progress'
  | 'transformation_completed'
  | 'started'
  | 'in_progress'
  | 'completed';

export interface DatasourceWithDatalines extends BaseEntity {
  name: string | null;
  type: string | null;
  uri: string | null;
  projectId: string;
  credentials: any;
  status: DatasourceStatus | null;
  phase: DatasourcePhase | null;
  /** Optional JSON schema for the datasource */
  schema?: Record<string, any>;
  /** Array of datalines (rows preview / sample) */
  datalines?: Dataline[];
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
  /** Parent project ID */
  projectId: string;
  /** Human-friendly datasource name */
  name?: string;
  /** Type, e.g. `csv`, `http`, `database`, … */
  type?: string;
  /** Optional source URI */
  uri?: string;
  /** Processing status */
  status?: DatasourceStatus;
  /** Processing phase */
  phase?: DatasourcePhase;
  /** Optional status / error message */
  message?: string;
  /** Optional detailed description */
  description?: string;
  /**
   * Rich configuration object used by HTTP / database sources in the UI.
   * This is intentionally loose-typed because each connector stores different keys.
   */
  dataSourceConfig?: Record<string, any>;
}

// Credential types
export interface Credential extends BaseEntity {
  name: string;
  type: string;
  organizationId: string;
  config: Record<string, any>;
}

export interface CreateCredentialParams {
  name: string | ((id: string) => string);
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
  name: string | ((id: string) => string);
  teamId: string;
  type?: string;
  value: string;
  credentialsId?: string;
}
// Query Program types
export interface QueryProgram extends BaseEntity {
  name?: string | null;
  cue?: string | null;
  code?: string | null;
  steps?: string | null;
  slots?: string | null;
  stores?: string | null;
  published?: boolean | null;
  reason?: string | null;
  projectId: string;
  ontologyId?: string | null;
}

export interface CreateQueryProgramParams {
  cue?: string;
  code?: string;
  steps?: string;
  slots?: string;
  stores?: string;
  published?: boolean;
  reason?: string;
  projectId: string;
  /** Allow additional dynamic properties */
  [key: string]: any;
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

// API types
export interface API extends BaseEntity {
  name: string;
  description?: string;
  projectId: string;
  slug: string;
  version: string;
  tags?: string[];
  status: 'draft' | 'published' | 'deprecated';
  specification?: Record<string, any>;
}
export interface CreateAPIParams {
  /** API friendly display name */
  name?: string;
  projectId: string;
  slug: string;
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
  requestId?: string;
  conversationId: string;
  /** Original function message ID (optional – back-compat) */
  messageId?: string;
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

/**
 * Coverage status for query programs
 */
export interface CoverageStatus {
  slots_count: number;
  columns_count: number;
  columns: string[];
}

/**
 * Coverage by publish status
 */
export interface CoverageByStatus {
  published: CoverageStatus;
  unpublished: CoverageStatus;
}

/**
 * Response for the coverage endpoint
 */
export interface GetCoverageResponse {
  total_columns: number;
  used_columns_count: number;
  coverage_percentage: number;
  all_columns: string[];
  used_columns: string[];
  coverage_by_status: CoverageByStatus;
}

/**
 * HTTP API Authentication Configuration
 */
export interface HttpAPIAuthConfig {
  apiKey?: Record<string, any>;
  bearerToken?: string;
  basicAuth?: Record<string, any>;
}

/**
 * Parameter Configuration
 */
export interface ParameterConfig {
  value: string;
  required?: boolean;
}

/**
 * Parameter Group
 */
export interface ParameterGroup {
  required?: boolean;
  parameters: Array<Record<string, string>>;
}

/**
 * HTTP Body Configuration
 */
export interface HttpBodyConfig {
  type: string; // 'raw', 'form-data', 'x-www-form-urlencoded'
  contentType?: string;
  content?: string;
  parameters?: Record<string, string>;
}

/**
 * Test HTTP API Request
 */
export interface TestHttpAPIRequest {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  parameters?: Record<string, ParameterConfig>;
  parameterGroups?: ParameterGroup[];
  authType?: string;
  auth?: HttpAPIAuthConfig;
  body?: HttpBodyConfig;
  responsePathExtractor?: string;
}

/**
 * Database connection test request
 */
export interface TestConnectionRequest {
  connectionString: string;
}

/**
 * Sample tables request
 */
export interface SampleTablesRequest {
  connectionString: string;
  tableNames: string[];
  projectId: string;
  datasourceId: string;
  name: string;
}

/**
 * Execute custom SQL request
 */
export interface ExecuteCustomSqlRequest {
  connectionString: string;
  sqlQuery: string;
  samplingSqlQuery: string;
  projectId: string;
  datasourceId: string;
  name: string;
}

/**
 * Validate SQL syntax request
 */
export interface ValidateSqlSyntaxRequest {
  connectionString: string;
  sqlQuery: string;
}

/**
 * Validate SQL query request
 */
export interface ValidateSqlQueryRequest {
  connectionString: string;
  sqlQuery: string;
  maxRows?: number;
}

/**
 * Extract SQL parameters request
 */
export interface ExtractSqlParametersRequest {
  sqlQuery: string;
}

export interface TableInfo {
  name: string;
  estimatedRows: number;
  estimatedSize: string;
  columnCount: number;
}

export interface TestConnectionResponse {
  success: boolean;
  tables: TableInfo[];
}

export interface SampleTablesRequest {
  connectionString: string;
  tableNames: string[];
  projectId: string;
  datasourceId: string;
  name: string;
}

export interface I7YPendingJob {
  jobType: string;
  projectId: string;
  userId: string | null;
  parentJobId: string | null;
  metadata: any;
  payload: Record<string, any>;
}

export interface SampleTablesResponse {
  dataObjects: Record<string, string>;
  jobs: I7YPendingJob[];
}

export interface ExecuteCustomSqlRequest {
  connectionString: string;
  sqlQuery: string;
  samplingSqlQuery: string;
  projectId: string;
  datasourceId: string;
  name: string;
}

export interface ExecuteCustomSqlResponse {
  jobs: I7YPendingJob[];
}

export interface ValidateSqlQueryRequest {
  connectionString: string;
  sqlQuery: string;
}

export interface ValidateSqlQueryResponse {
  rowCount: number;
  valid: boolean;
  message?: string;
}

export interface SqlParameter {
  type: string;
  field: string;
  operator: string;
  value: string;
  displayName: string;
}

export interface ExtractSqlParametersRequest {
  sqlQuery: string;
}

export interface ExtractSqlParametersResponse {
  parameters: SqlParameter[];
  parsedQuery: string;
}

export interface DatabaseCapabilitiesListResponse {
  capabilities: string[];
}

export interface DatabaseConnectionParams {
  connectionString: string;
}

export interface ValidateQueryRequest {
  connectionString: string;
  query: string;
}

/**
 * Options for connecting to an HTTP API
 */
export interface ConnectOptions {
  url: string;
  method: HttpMethod;
  projectId: string;
  connectionName: string;
  organizationId?: string;
  teamId?: string;
  headers?: Record<string, string>;
  parameters?: Record<string, any>;
  responsePathExtractor?: string;
  authType?: AuthType;
  authConfig?: Record<string, any>;
}

/**
 * Result of an HTTP connection operation
 */
export interface HttpConnectionResult {
  success: boolean;
  stepsCompleted: string[];
  datasourceId?: string;
  dataObjectId?: string;
  jobIds: string[];
  errors: Array<{ step: string; error: string }>;
  testResult?: TestConnectionResponse | TestHttpConnectionResponse;
  datasource?: Datasource;
  credentials?: any;
  jobs?: any[];
}

/**
 * Parameters for the unified 'connect' method in DatasourcesClient
 */
export interface ConnectDatasourceParams {
  projectId: string;
  name: string;
  type: string;
  uri?: string;
  status?: string;
  config?: {
    url?: string;
    method?: string;
    headers?: Record<string, string>;
    parameters?: Record<string, any>;
    parameterGroups?: any[];
    authType?: string;
    auth?: Record<string, any>;
    body?: any;
    responsePathExtractor?: string;
    teamId?: string;
    organizationId?: string;
  };
  credentialsId?: string;
  filePath?: string;
  sampleTables?: string[]; // Used in connectDB method
}
