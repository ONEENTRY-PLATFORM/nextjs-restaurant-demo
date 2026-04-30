import { NextResponse } from 'next/server';

/**
 * Простой in-memory кэш файлов шрифтов для повышения производительности.
 * Сопоставляет имена файлов шрифтов с их буферами и Content-Type.
 */
const fontCache = new Map();

/**
 * Расширения файлов шрифтов, сопоставленные с соответствующими MIME-типами.
 * Это обеспечивает корректные заголовки Content-Type при отдаче шрифтов.
 */
const FONT_TYPES: Record<string, string> = {
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',
};

/**
 * GET-эндпоинт для отдачи файлов шрифтов с поддержкой кэширования.
 * @param   {Request}               request - Входящий HTTP-запрос.
 * @returns {Promise<NextResponse>}         NextResponse с данными файла шрифта или ошибкой.
 */
export async function GET(request: Request): Promise<NextResponse> {
  /** Извлекает имя файла шрифта из пути URL */
  const { pathname } = new URL(request.url);
  const fontFile = pathname.split('/').pop();

  /** Проверяет, закэширован ли уже шрифт, чтобы избежать лишней обработки */
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
    /**
     * Здесь должна быть логика получения шрифта — из файловой системы или CDN.
     * Сейчас используется placeholder-реализация для демонстрации.
     */

    /** Определяет MIME-тип шрифта по расширению файла */
    const ext = fontFile?.split('.').pop() || '';
    const contentType = FONT_TYPES[ext] || 'font/woff2';

    /** Создаёт пустой буфер в качестве placeholder — реальная реализация загружала бы фактические данные шрифта */
    const buffer = Buffer.from('');

    /** Сохраняет шрифт в кэш для будущих запросов */
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
    /** Возвращает ошибку 404, если шрифт не удалось получить */
    return new NextResponse('Font not found', { status: 404 });
  }
}

/**
 * OPTIONS-эндпоинт для обработки CORS preflight-запросов.
 * @returns {Promise<NextResponse>} NextResponse с CORS-заголовками.
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
