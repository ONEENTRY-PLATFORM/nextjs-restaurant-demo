import { NextResponse } from 'next/server';

/** In-memory cache of font files: filename → { buffer, contentType }. */
const fontCache = new Map();

/** Font file extensions → MIME types for Content-Type. */
const FONT_TYPES: Record<string, string> = {
  woff: 'font/woff',
  woff2: 'font/woff2',
  ttf: 'font/ttf',
  otf: 'font/otf',
  eot: 'application/vnd.ms-fontobject',
};

/**
 * GET — serves font files with in-memory caching.
 *
 * @param   {Request}               request - Incoming HTTP request (the font file is the last segment of the URL).
 * @returns {Promise<NextResponse>}            Promise resolving to the font response (with immutable cache headers) or 404.
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
    // TODO: load real font data (FS/CDN) — currently a stub with an empty buffer.
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
 * OPTIONS — CORS preflight for fonts.
 *
 * @returns {Promise<NextResponse>} Promise resolving to a 204-style response with permissive CORS headers.
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
