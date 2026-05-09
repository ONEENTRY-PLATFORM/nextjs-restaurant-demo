import type { Metadata } from 'next';

/**
 * PageMetadataOptions — опции генерации метаданных страницы.
 *
 * @property {string}  handle        - Handle страницы.
 * @property {string}  title         - Заголовок страницы.
 * @property {string}  description   - Описание страницы.
 * @property {boolean} isVisible     - Видима ли страница.
 * @property {string}  [imageUrl]    - URL изображения.
 * @property {number}  [imageWidth]  - Ширина изображения (по умолчанию 300).
 * @property {number}  [imageHeight] - Высота изображения (по умолчанию 300).
 * @property {string}  [imageAlt]    - Alt-текст изображения (по умолчанию — title).
 * @property {string}  lang          - Код языка.
 * @property {string}  baseUrl       - Базовый URL.
 */
interface PageMetadataOptions {
  handle: string;
  title: string;
  description: string;
  isVisible: boolean;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
  lang: string;
  baseUrl: string;
}

/**
 * generatePageMetadata — генерирует стандартизированные метаданные страницы Next.js.
 *
 * @param   {PageMetadataOptions} props - Опции генерации метаданных.
 * @returns {Metadata}                  Объект `Metadata` для Next.js.
 */
export const generatePageMetadata = ({
  handle = '',
  title,
  description,
  isVisible,
  imageUrl,
  imageWidth = 300,
  imageHeight = 300,
  imageAlt,
  baseUrl = '',
}: PageMetadataOptions): Metadata => {
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${baseUrl && baseUrl + '/'}${handle && '/' + handle}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        en: canonicalUrl,
      },
    },
    robots: {
      index: isVisible,
      follow: isVisible,
      googleBot: {
        index: isVisible,
        follow: isVisible,
      },
    },
    openGraph: imageUrl
      ? {
          images: [
            {
              url: imageUrl,
              width: imageWidth,
              height: imageHeight,
              alt: imageAlt || title,
            },
          ],
        }
      : null,
  };
};
