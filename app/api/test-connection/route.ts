import { NextResponse } from 'next/server';

import { getApi } from '@/app/api';
import { LanguageEnum } from '@/app/types/enum';
import { handleApiError } from '@/app/utils/errorHandler';

/**
 * GET — health-check OneEntry: тянет `home_web` и возвращает время ответа.
 * @returns {Promise<NextResponse>} JSON с success/responseTime/data.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const startTime = Date.now();

    const langCode = LanguageEnum.en;
    const data = await getApi().Pages.getPageByUrl('home_web', langCode);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return NextResponse.json({
      success: true,
      responseTime,
      data: data ? 'Data received' : 'No data',
    });
  } catch (error) {
    const apiError = handleApiError('function GET', error);
    return NextResponse.json({
      success: false,
      error: apiError.message,
    });
  }
}
