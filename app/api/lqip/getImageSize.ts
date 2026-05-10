import https from 'https';
import { imageSize } from 'image-size';
import url from 'url';

/**
 * getImageSize — determines the dimensions of a remote image by URL without downloading it fully.
 *
 * Parses the header via image-size as chunks arrive and aborts the connection as soon as
 * width/height are known.
 *
 * @param   {string} imgUrl - Image URL.
 * @returns Promise resolving to `{ width, height }` in pixels.
 * @throws  {Error}         If the image cannot be fetched or its dimensions cannot be determined.
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
                // image-size throws when there is not enough data — keep receiving.
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
