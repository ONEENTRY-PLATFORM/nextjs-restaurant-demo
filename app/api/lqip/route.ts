import { NextResponse } from 'next/server';

import getLqipPreview from '@/app/api/lqip/getLqipPreview';

/**
 * API-эндпоинт для генерации низкокачественных плейсхолдеров изображений (LQIP).
 *
 * Этот эндпоинт генерирует низкокачественное base64-закодированное превью,
 * которое можно использовать как плейсхолдер во время загрузки полноразмерного изображения.
 * @param   {Request}               request - Входящий запрос с URL изображения в query-параметрах.
 * @returns {Promise<NextResponse>}         JSON-ответ с base64-закодированным data URI LQIP.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'Missing image URL parameter' },
      { status: 400 },
    );
  }

  try {
    const preview = await getLqipPreview(imageUrl);
    return NextResponse.json({ preview });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error generating LQIP:', error);
    return NextResponse.json(
      { error: 'Failed to generate LQIP' },
      { status: 500 },
    );
  }
}
