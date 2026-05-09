import lqipModern from 'lqip-modern';

// lqip-modern зависит от sharp (Node-only: child_process, fs) — использовать только серверно.
// Для клиента — обернуть в API-эндпоинт или взять браузер-совместимую альтернативу.

const lqipCache = new Map<string, { dataURI: string; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000;

/**
 * getLqipPreview — генерирует низкокачественный base64 placeholder (LQIP) для URL изображения.
 * @param   {string}          imageUrl - URL изображения.
 * @returns {Promise<string>}          base64 data URI плейсхолдера (или дефолтный SVG при ошибке).
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
