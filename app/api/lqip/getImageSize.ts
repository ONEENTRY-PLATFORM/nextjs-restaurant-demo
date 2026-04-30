import https from 'https';
import { imageSize } from 'image-size';
import url from 'url';

/**
 * Асинхронно получает размеры (ширину и высоту) изображения по URL.
 *
 * Функция получает изображение по указанному URL и определяет его размеры
 * без скачивания всего изображения. Использует библиотеку image-size для парсинга
 * заголовка изображения и извлечения информации о ширине и высоте.
 * @param   {string}                                     imgUrl - URL изображения для анализа.
 * @returns {Promise<{ width: number; height: number }>}        Promise, резолвящийся в объект со свойствами width и height.
 * @throws {Error} если изображение не удалось получить или определить размеры.
 * @example
 * ```typescript
 * const { width, height } = await getImageSize('https://example.com/image.jpg');
 * console.log(`Image dimensions: ${width}x${height}`);
 * ```
 */
const getImageSize = async (
  imgUrl: string,
): Promise<{ width: number; height: number }> => {
  /** Парсим URL изображения в опции для HTTPS-запроса */
  const options = url.parse(imgUrl);

  /** Возвращаем promise, резолвящийся с размерами изображения */
  return new Promise((resolve, reject) => {
    https
      .get(options, (response) => {
        if (response.statusCode !== 200) {
          reject(
            new Error(
              `Failed to fetch image. Status code: ${response.statusCode}`,
            ),
          );
          response.resume(); // Поглощаем данные ответа, чтобы освободить память
          return;
        }
        const chunks: Uint8Array[] = [];
        let dimensions: { width?: number; height?: number } | null = null;

        /** Обрабатываем входящие чанки данных и пытаемся определить размеры изображения */
        response
          .on('data', (chunk) => {
            if (!dimensions) {
              chunks.push(chunk);
              try {
                dimensions = imageSize(Buffer.concat(chunks));

                if (dimensions.width && dimensions.height) {
                  resolve({
                    width: dimensions.width,
                    height: dimensions.height,
                  });
                  response.destroy();
                  /** Останавливаем дальнейший приём данных */
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
              } catch (error) {
                /** Если image-size бросает ошибку из-за нехватки данных — продолжаем приём */
              }
            }
          })
          .on('end', () => {
            if (!dimensions) {
              reject(new Error('Could not determine image dimensions'));
            }
          })
          .on('error', (err) => {
            reject(err);
          });
      })
      .on('error', (err) => {
        reject(err);
      });
  });
};

export default getImageSize;
