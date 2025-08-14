export interface APIError {
    code: string;
    error: string;
    message: string;
  }
  // Type guard for API responses
  export function isApiError(response: unknown): response is APIError {
    return (
      response !== null && 
      typeof response === 'object' && 
      'error' in response
    );
  }
        