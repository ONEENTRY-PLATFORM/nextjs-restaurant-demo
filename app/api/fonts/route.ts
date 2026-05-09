import { NextResponse } from 'next/server';

/** In-memory кэш файлов шрифтов: filename → { buffer, contentType }. */
const fontCache = new Map();

/** Расширения файлов шрифтов → MIME-типы для Content-Type. */
const FONT_TYPES: Record<string, string> = {
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',
};

/**
 * GET — отдача файлов шрифтов с in-memory кэшированием.
 * @param   {Request}               request - Входящий HTTP-запрос.
 * @returns {Promise<NextResponse>}         Файл шрифта или 404.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { pathname } = new URL(request.url);
  const fontFile = pathname.split('/').pop();

  if (fontCache.has(fontFile)) {
    const cached = fontCache.get(fontFile);
    const response = new NextResponse(cached.buffer, {
      headers: {
        'Content-Type': cached.contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Encoding': 'gzip',
      },
    });
    return response;
  }

  try {
    // TODO: подгружать реальные данные шрифта (FS/CDN) — сейчас заглушка с пустым буфером.
    const ext = fontFile?.split('.').pop() || '';
    const contentType = FONT_TYPES[ext] || 'font/woff2';

    const buffer = Buffer.from('');

    fontCache.set(fontFile, { buffer, contentType });

    const response = new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Encoding': 'gzip',
      },
    });

    return response;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return new NextResponse('Font not found', { status: 404 });
  }
}

/**
 * OPTIONS — CORS preflight для шрифтов.
 * @returns {Promise<NextResponse>} CORS-заголовки.
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
