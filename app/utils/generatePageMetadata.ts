// app/utils/metadataUtils.ts
import type { Metadata } from 'next';

/**
 * Опции для генерации метаданных страницы.
 * @interface PageMetadataOptions
 * @property {string}  handle        - Handle страницы.
 * @property {string}  title         - Заголовок страницы.
 * @property {string}  description   - Описание страницы.
 * @property {boolean} isVisible     - Видима ли страница.
 * @property {string}  [imageUrl]    - URL изображения, связанного со страницей.
 * @property {number}  [imageWidth]  - Ширина изображения страницы. По умолчанию 300.
 * @property {number}  [imageHeight] - Высота изображения страницы. По умолчанию 300.
 * @property {string}  [imageAlt]    - Alt-текст изображения. По умолчанию — заголовок страницы.
 * @property {string}  lang          - Код языка страницы.
 * @property {string}  baseUrl       - Базовый URL страницы.
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
 * Генерирует стандартизированные метаданные страницы.
 * @param   {object}   props             - Опции генерации метаданных
 * @param   {string}   props.handle      - Handle страницы
 * @param   {string}   props.title       - Заголовок страницы
 * @param   {string}   props.description - Описание страницы
 * @param   {boolean}  props.isVisible   - Видима ли страница
 * @param   {string}   props.imageUrl    - URL изображения, связанного со страницей
 * @param   {number}   props.imageWidth  - Ширина изображения. По умолчанию 300
 * @param   {number}   props.imageHeight - Высота изображения. По умолчанию 300
 * @param   {string}   props.imageAlt    - Alt-текст изображения. По умолчанию — заголовок страницы
 * @param   {string}   props.lang        - Код языка страницы
 * @param   {string}   props.baseUrl     - Базовый URL страницы. По умолчанию пустая строка
 * @returns {Metadata}                   Объект метаданных
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
