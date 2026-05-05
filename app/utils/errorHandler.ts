/* eslint-disable no-console */
import type { IError } from 'oneentry/dist/base/utils';
import { toast } from 'react-toastify';

/**
 * Кастомный класс ошибки для ошибок API
 * @property {number}  statusCode    - HTTP-статус ошибки
 * @property {unknown} originalError - Исходный объект ошибки
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
 * Type guard для проверки, что объект имеет тип IError
 * @param   {unknown} error - Объект ошибки для проверки
 * @returns {boolean}       true, если объект — IError, иначе false
 */
export function isIError(error: unknown): error is IError {
  return typeof error === 'object' && error !== null && 'statusCode' in error && 'message' in error;
}

/**
 * Централизованная функция обработки ошибок
 * @param   {string}   handle - Функция обработки ошибки
 * @param   {unknown}  error  - Ошибка для обработки
 * @returns {ApiError}        ApiError со стандартизированным форматом
 */
export function handleApiError(handle: string, error: unknown): ApiError {
  if (isIError(error)) {
    /** Логируем ошибку для отладки */
    console.log('API Error:', {
      handle: handle,
      message: error.message,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString(),
    });

    return new ApiError(error.message || 'An error occurred', error.statusCode || 500, error);
  }

  if (error instanceof Error) {
    /** Логируем ошибку для отладки */
    console.log('Generic Error:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return new ApiError(error.message || 'An error occurred', 500, error);
  }

  /** Логируем неизвестные ошибки */
  console.log('Unknown Error:', {
    error,
    timestamp: new Date().toISOString(),
  });

  return new ApiError('An unknown error occurred', 500, error);
}

/**
 * Кастомный хук для обработки ошибок API в React-компонентах
 * @returns {unknown} Функция для обработки ошибок API с toast-уведомлениями
 */
export function useApiErrorHandler(): unknown {
  /* Обычно интегрируется с системой уведомлений типа toast */
  return function handleApiErrorWithNotification(error: unknown): ApiError {
    const apiError = handleApiError('useApiErrorHandler', error);
    toast.error(apiError.message);

    return apiError;
  };
}

/**
 * Форматирует сообщение об ошибке для отображения пользователю.
 * @param   {unknown} error          - Ошибка для форматирования
 * @param   {string}  defaultMessage - Сообщение по умолчанию, если ошибка не распознана
 * @returns {string}                 Отформатированное сообщение об ошибке
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
