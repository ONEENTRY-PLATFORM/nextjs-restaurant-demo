/* eslint-disable no-console */
import type { IError } from 'oneentry/dist/base/utils';
import { toast } from 'react-toastify';

/**
 * ApiError — стандартизированная ошибка API.
 *
 * @property {number}  statusCode    - HTTP-статус ошибки.
 * @property {unknown} originalError - Исходный объект ошибки.
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
 * isIError — type guard для `IError` SDK OneEntry.
 *
 * @param   {unknown} error - Объект для проверки.
 * @returns {boolean}       true, если объект — IError.
 */
export function isIError(error: unknown): error is IError {
  return typeof error === 'object' && error !== null && 'statusCode' in error && 'message' in error;
}

/**
 * handleApiError — централизованная обработка ошибок API.
 *
 * @param   {string}   handle - Имя вызывающего хендлера для лога.
 * @param   {unknown}  error  - Ошибка для обработки.
 * @returns {ApiError}        Стандартизированная `ApiError`.
 */
export function handleApiError(handle: string, error: unknown): ApiError {
  if (isIError(error)) {
    console.log('API Error:', {
      handle: handle,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
    });

    return new ApiError(error.message || 'An error occurred', error.statusCode || 500, error);
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
 * useApiErrorHandler — хук для обработки ошибок API с toast-уведомлениями.
 *
 * @returns {unknown} Функция-обработчик.
 */
export function useApiErrorHandler(): unknown {
  return function handleApiErrorWithNotification(error: unknown): ApiError {
    const apiError = handleApiError('useApiErrorHandler', error);
    toast.error(apiError.message);

    return apiError;
  };
}

/**
 * formatErrorMessage — форматирует сообщение об ошибке для пользователя.
 *
 * @param   {unknown} error          - Ошибка для форматирования.
 * @param   {string}  defaultMessage - Сообщение по умолчанию.
 * @returns {string}                 Отформатированное сообщение.
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
        return error.message || defaultMessage;
    }
  }

  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  return defaultMessage;
}
