export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message
  };
}

export function errorResponse(message: string, error?: any): ApiResponse {
  return {
    success: false,
    error: message,
    message: error?.message || message
  };
}