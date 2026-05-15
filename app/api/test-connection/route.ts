import { NextResponse } from 'next/server';

import { getApi } from '@/app/api';
import { LanguageEnum } from '@/app/types/enum';
import { handleApiError } from '@/app/utils/errorHandler';

/**
 * GET — OneEntry health-check: fetches `home_web` and returns the response time.
 *
 * @returns Promise resolving to JSON `{ success, responseTime, data }`, or `{ success: false, error }` on failure.
 */
export async function GET(): Promise<NextResponse> {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not Found', { status: 404 });
  }
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
