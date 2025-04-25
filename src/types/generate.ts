/**
 * Type definitions for the generate endpoints in the Infactory API
 */

/**
 * Base parameters for all generation requests
 */
export interface BaseGenerateParams {
  /** Optional context to provide for generation */
  context?: string;
}

/**
 * Parameters for generating a new API
 * Corresponds to POST /v1/actions/generate/new-api
 */
export interface GenerateApiParams extends BaseGenerateParams {
  /** The ID of the project to generate the API for */
  projectId: string;
  /** Description of the API to generate */
  description?: string;
}

/**
 * Parameters for generating a new API endpoint
 * Corresponds to POST /v1/actions/generate/new-api-endpoint
 */
export interface GenerateApiEndpointParams extends BaseGenerateParams {
  /** The ID of the API to generate the endpoint for */
  apiId: string;
  /** Description of the endpoint to generate */
  description?: string;
}

/**
 * Parameters for generating a data model
 * Corresponds to POST /v1/actions/generate/datamodel
 */
export interface GenerateDataModelParams extends BaseGenerateParams {
  /** The ID of the project to generate the data model for */
  projectId: string;
  /** Description of the data model to generate */
  description?: string;
  /** Optional sample data to use for generation */
  sampleData?: string;
}

/**
 * Parameters for generating a function call
 * Corresponds to POST /v1/actions/generate/functioncall
 */
export interface GenerateFunctionCallParams extends BaseGenerateParams {
  /** The ID of the project */
  projectId: string;
  /** The function schema in JSON format */
  functionSchema: string;
  /** The input to use for generating the function call */
  input: string;
}

/**
 * Parameters for generating knowledge entity links
 * Corresponds to POST /v1/actions/generate/knowledge/entity-link
 */
export interface GenerateKnowledgeEntityLinkParams extends BaseGenerateParams {
  /** The ID of the project */
  projectId: string;
  /** The text to generate entity links for */
  text: string;
}

/**
 * Parameters for generating a query program from natural language
 * Corresponds to POST /v1/actions/generate/queryprogram (for new programs)
 */
export interface GenerateQueryProgramRequest extends BaseGenerateParams {
  /** The ID of the project */
  projectId: string;
  /** The natural language query to generate a program for */
  naturalLanguageQuery: string;
}

/**
 * Parameters for fixing an existing query program
 * Corresponds to POST /v1/actions/generate/queryprogram (for fixing programs)
 */
export interface FixQueryProgramRequest extends BaseGenerateParams {
  /** The ID of the query program to fix */
  queryProgramId: string;
  /** Description of the error to fix */
  errorDescription: string;
}

/**
 * Union type for generate or fix query program parameters
 */
export type GenerateOrFixQueryProgramParams =
  | GenerateQueryProgramRequest
  | FixQueryProgramRequest;

/**
 * Parameters for generating questions
 * Corresponds to POST /v1/actions/generate/questions
 */
export interface GenerateQuestionsParams {
  /** The ID of the project */
  projectId: string;
  /** Previous questions to generate new questions based on */
  previousQuestions?: string[];
  /** Number of questions to generate */
  count?: number;
}

/**
 * Parameters for generating a readable answer
 * Corresponds to POST /v1/actions/generate/readableanswer-to-*
 */
export interface GenerateReadableAnswerParams extends BaseGenerateParams {
  /** Target audience for the answer */
  targetAudience?: string;
  /** Format of the answer */
  format?: 'text' | 'markdown';
}

/**
 * Parameters for generating an ontology
 * Corresponds to POST /v1/actions/generate/ontology
 */
export interface GenerateOntologyParams extends BaseGenerateParams {
  /** The ID of the project */
  projectId: string;
  /** Description of the ontology to generate */
  description?: string;
}

/**
 * Response for knowledge entity link generation
 */
export interface GenerateKnowledgeEntityLinkResponse {
  /** The text with entity links */
  text: string;
  /** The entities found in the text */
  entities: Array<{
    /** The entity name */
    name: string;
    /** The entity type */
    type: string;
    /** The entity ID */
    id: string;
  }>;
}

/**
 * Response for question generation
 */
export interface GenerateQuestionsResponse {
  /** The generated questions */
  questions: string[];
}

/**
 * Response for readable answer generation
 */
export interface GenerateReadableAnswerResponse {
  /** The generated answer */
  answer: string;
}
