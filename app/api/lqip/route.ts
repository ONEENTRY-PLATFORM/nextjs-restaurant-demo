import { NextResponse } from 'next/server';

import getLqipPreview from '@/app/api/lqip/getLqipPreview';

/**
 * GET — API endpoint that generates an LQIP placeholder for the given image URL.
 * @param   {Request}               request - Request with `?url=...` in the query.
 * @returns {Promise<NextResponse>}         JSON `{ preview }` containing a base64 data URI.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing image URL parameter' }, { status: 400 });
  }

  try {
    const preview = await getLqipPreview(imageUrl);
    return NextResponse.json({ preview });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error generating LQIP:', error);
    return NextResponse.json({ error: 'Failed to generate LQIP' }, { status: 500 });
  }
}
