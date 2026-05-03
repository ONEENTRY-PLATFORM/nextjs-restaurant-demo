import { NextResponse } from 'next/server';

import { getApi } from '@/app/api';
import { LanguageEnum } from '@/app/types/enum';
import { handleApiError } from '@/app/utils/errorHandler';

/**
 * Тестовый маршрут для API-вызовов.
 * @returns {Promise<NextResponse>} - Promise-объект, представляющий результат GET-запроса.
 */
export async function GET(): Promise<NextResponse> {
  try {
    /** Записываем стартовое время для расчёта времени ответа */
    const startTime = Date.now();

    /** Тестируем простым API-вызовом — замени 'home_web' на известный URL страницы в твоей системе */
    const langCode = LanguageEnum.en;
    /** Получаем данные главной страницы, чтобы проверить связь с API */
    const data = await getApi().Pages.getPageByUrl('home_web', langCode);

    /** Записываем финальное время для расчёта времени ответа */
    const endTime = Date.now();
    /** Вычисляем общее время ответа в миллисекундах */
    const responseTime = endTime - startTime;

    /** Возвращаем успешный ответ с таймингами и статусом данных */
    return NextResponse.json({
      success: true,
      responseTime,
      data: data ? 'Data received' : 'No data',
    });
  } catch (error) {
    /** Обрабатываем ошибки соединения с API */
    const apiError = handleApiError('function GET', error);
    /** Возвращаем ответ с ошибкой и сообщением */
    return NextResponse.json({
      success: false,
      error: apiError.message,
    });
  }
}
