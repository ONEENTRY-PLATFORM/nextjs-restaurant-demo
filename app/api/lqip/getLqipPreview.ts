import lqipModern from 'lqip-modern';

// Этот файл был перемещён в app/api/utils/getLqipPreview.ts, потому что использует пакет lqip-modern,
// который зависит от sharp — Node.js-библиотеки, использующей встроенные модули вроде child_process и fs,
// недоступные в браузерной среде.
//
// Если эта функциональность нужна в клиентском коде, следует либо:
// 1. Создать API-эндпоинт, использующий эту серверную функцию.
// 2. Использовать браузер-совместимую альтернативу.

// Простой in-memory кэш LQIP-превью
const lqipCache = new Map<string, { dataURI: string; timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 минут

/**
 * Асинхронно генерирует низкокачественный плейсхолдер изображения (LQIP) по URL изображения.
 *
 * Функция получает изображение по указанному URL и генерирует низкокачественное
 * base64-закодированное превью, которое можно использовать как плейсхолдер во время
 * загрузки полноразмерного изображения. Это улучшает воспринимаемую производительность и UX.
 * @param   {string}          imageUrl - URL изображения, для которого генерируется плейсхолдер.
 * @returns {Promise<string>}          Promise, резолвящийся в base64-закодированный data URI низкокачественного плейсхолдера.
 * @example
 * ```typescript
 * const preview = await getLqipPreview('https://example.com/image.jpg');
 * // Returns a base64 data URI like "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/..."
 * ```
 */
const getLqipPreview = async (imageUrl: string): Promise<string> => {
  /** Сначала проверяем кэш */
  const cached = lqipCache.get(imageUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.dataURI;
  }

  /** Пытаемся сгенерировать LQIP-превью для изображения */
  try {
    /** Получаем изображение по указанному URL */
    const image = await fetch(imageUrl);
    /** Валидируем ответ */
    if (!image.ok) {
      throw new Error(`Failed to fetch image: ${image.status} ${image.statusText}`);
    }

    /** Конвертируем ответ изображения в буфер */
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    /** Генерируем LQIP-превью через lqip-modern */
    const previewImage = await lqipModern(imageBuffer);
    /** Извлекаем base64 data URI из превью */
    const dataURI = previewImage.metadata.dataURIBase64;

    /** Кэшируем результат */
    lqipCache.set(imageUrl, { dataURI, timestamp: Date.now() });

    /** Возвращаем сгенерированный data URI */
    return dataURI;
  } catch (error) {
    /** Возвращаем дефолтный плейсхолдер, если генерация LQIP не удалась */
    // eslint-disable-next-line no-console
    console.warn(`Failed to generate LQIP for ${imageUrl}:`, error);
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2ZXJzaW9uPSIxLjEiLz4=';
  }
};

export default getLqipPreview;
