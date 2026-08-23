/* eslint-disable no-console */
import type { IError } from 'oneentry/types';
import { toast } from 'react-toastify';

/**
 * ApiError — standardized API error.
 *
 * @property {number}  statusCode    - HTTP error status.
 * @property {unknown} originalError - Original error object.
 */
export class ApiError extends Error {
  statusCode: number;
  originalError?: unknown;

  constructor(message: string, statusCode: number, originalError?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

/**
 * isIError — type guard for the OneEntry SDK `IError`.
 *
 * @param   {unknown}           error - Object to check.
 * @returns `true` when the object has both `statusCode` and `message` (matching `IError`).
 */
export function isIError(error: unknown): error is IError {
  return typeof error === 'object' && error !== null && 'statusCode' in error && 'message' in error;
}

/**
 * normalizeErrorMessage — flattens the polymorphic `IError.message` into a display string.
 *
 * `postFormsData` validators deliver `message` as a `string[]` — joins array entries with `'; '`;
 * plain strings pass through; everything else falls back to `defaultMessage`.
 *
 * @param   {unknown}    message        - Raw `message` from an SDK `IError`.
 * @param   {string}     defaultMessage - Fallback when the message is missing or empty.
 * @returns User-facing error string.
 */
export function normalizeErrorMessage(
  message: unknown,
  defaultMessage: string = 'An error occurred'
): string {
  if (Array.isArray(message)) {
    const joined = message.map(String).join('; ');
    return joined || defaultMessage;
  }
  if (typeof message === 'string' && message) {
    return message;
  }
  return defaultMessage;
}

/**
 * handleApiError — centralized API error handler.
 *
 * @param   {string}     handle - Name of the calling handler for logging.
 * @param   {unknown}    error  - Error to normalise.
 * @returns Standardized `ApiError` instance with HTTP `statusCode`.
 */
export function handleApiError(handle: string, error: unknown): ApiError {
  if (isIError(error)) {
    console.log('API Error:', {
      handle: handle,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
    });

    return new ApiError(normalizeErrorMessage(error.message), error.statusCode || 500, error);
  }

  if (error instanceof Error) {
    console.log('Generic Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return new ApiError(error.message || 'An error occurred', 500, error);
  }

  console.log('Unknown Error:', {
    error,
    timestamp: new Date().toISOString(),
  });

  return new ApiError('An unknown error occurred', 500, error);
}

/**
 * useApiErrorHandler — hook for handling API errors with toast notifications.
 *
 * @returns Handler function `(error) => ApiError` that also surfaces the message via `react-toastify`.
 */
export function useApiErrorHandler(): unknown {
  return function handleApiErrorWithNotification(error: unknown): ApiError {
    const apiError = handleApiError('useApiErrorHandler', error);
    toast.error(apiError.message);

    return apiError;
  };
}

/**
 * formatErrorMessage — formats an error message for the user (status-code aware).
 *
 * @param   {unknown}    error          - Error to format.
 * @param   {string}     defaultMessage - Fallback message when no specific text is available.
 * @returns User-facing error string mapped from common HTTP status codes.
 */
export function formatErrorMessage(
  error: unknown,
  defaultMessage: string = 'An error occurred'
): string {
  if (isIError(error)) {
    switch (error.statusCode) {
      case 400:
        return 'Bad Request: Please check your input';
      case 401:
        return 'Unauthorized: Please log in';
      case 403:
        return 'Forbidden: You do not have permission';
      case 404:
        return 'Not Found: The requested resource was not found';
      case 500:
        return 'Internal Server Error: Please try again later';
      default:
        return normalizeErrorMessage(error.message, defaultMessage);
    }
  }

  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  return defaultMessage;
}
