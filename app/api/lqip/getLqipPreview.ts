import 'server-only';

import lqipModern from 'lqip-modern';

// lqip-modern depends on sharp (Node-only: child_process, fs) — server-side use only.
// `'server-only'` makes the build fail with a clear error if this file is ever
// imported from a client-bundled module (e.g. through the `@/app/api` barrel,
// which `app/store/store.ts` pulls into the browser bundle). For client-side
// blur previews, hit the `/api/lqip` route handler instead.

const lqipCache = new Map<string, { dataURI: string; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000;

/**
 * getLqipPreview — generates a low-quality base64 image placeholder (LQIP) for the given image URL.
 *
 * @param   {string}          imageUrl - Image URL.
 * @returns Promise resolving to a base64 data URI for the placeholder (or a default SVG on error).
 */
const getLqipPreview = async (imageUrl: string): Promise<string> => {
  const cached = lqipCache.get(imageUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.dataURI;
  }

  try {
    const image = await fetch(imageUrl);
    if (!image.ok) {
      throw new Error(`Failed to fetch image: ${image.status} ${image.statusText}`);
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const previewImage = await lqipModern(imageBuffer);
    const dataURI = previewImage.metadata.dataURIBase64;

    lqipCache.set(imageUrl, { dataURI, timestamp: Date.now() });

    return dataURI;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn(`Failed to generate LQIP for ${imageUrl}:`, error);
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4=';
  }
};

export default getLqipPreview;
