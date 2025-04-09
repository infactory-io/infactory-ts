/**
 * Error type definitions that align with the OpenAPI schema
 */

/**
 * Validation error from the API
 * Matches the ValidationError schema in the OpenAPI spec
 */
export interface ApiValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

/**
 * HTTP validation error response from the API
 * Matches the HTTPValidationError schema in the OpenAPI spec
 */
export interface ApiHttpValidationError {
  detail: ApiValidationError[];
}

/**
 * Generic API error response format
 */
export interface ApiErrorResponse {
  status: number;
  code: string;
  message: string;
  requestId?: string;
  details?: any;
}

/**
 * Checks if a response is an HTTP validation error
 */
export function isHttpValidationError(obj: any): obj is ApiHttpValidationError {
  if (!obj) return false;
  return Array.isArray((obj as ApiHttpValidationError).detail);
}

/**
 * Converts API validation errors to a user-friendly format
 */
export function formatValidationErrors(errors: ApiValidationError[]): string {
  if (!errors || errors.length === 0) {
    return 'Validation error';
  }

  return errors
    .map((err) => {
      const location = err.loc.join('.');
      return `${location}: ${err.msg}`;
    })
    .join('\n');
}
