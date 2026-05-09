import https from 'https';
import { imageSize } from 'image-size';
import url from 'url';

/**
 * getImageSize — определяет размеры удалённого изображения по URL без полной загрузки.
 *
 * Парсит заголовок через image-size по мере поступления чанков и обрывает соединение, как только
 * width/height становятся известны.
 * @param   {string}                                     imgUrl - URL изображения.
 * @returns {Promise<{ width: number; height: number }>}        Размеры.
 * @throws {Error} Если изображение не удалось получить или определить размеры.
 */
const getImageSize = async (imgUrl: string): Promise<{ width: number; height: number }> => {
  const options = url.parse(imgUrl);

  return new Promise((resolve, reject) => {
    https
      .get(options, response => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to fetch image. Status code: ${response.statusCode}`));
          response.resume();
          return;
        }
        const chunks: Uint8Array[] = [];
        let dimensions: { width?: number; height?: number } | null = null;

        response
          .on('data', chunk => {
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
                }
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
              } catch (error) {
                // image-size бросает при нехватке данных — продолжаем приём.
              }
            }
          })
          .on('end', () => {
            if (!dimensions) {
              reject(new Error('Could not determine image dimensions'));
            }
          })
          .on('error', err => {
            reject(err);
          });
      })
      .on('error', err => {
        reject(err);
      });
  });
};

export default getImageSize;
