import type { Metadata } from 'next';

/**
 * PageMetadataOptions — options for generating page metadata.
 *
 * @property {string}  handle        - Page handle.
 * @property {string}  title         - Page title.
 * @property {string}  description   - Page description.
 * @property {boolean} isVisible     - Whether the page is visible.
 * @property {string}  [imageUrl]    - Image URL.
 * @property {number}  [imageWidth]  - Image width (defaults to 300).
 * @property {number}  [imageHeight] - Image height (defaults to 300).
 * @property {string}  [imageAlt]    - Image alt text (defaults to title).
 * @property {string}  lang          - Language code.
 * @property {string}  baseUrl       - Base URL.
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
 * generatePageMetadata — generates standardized Next.js page metadata.
 *
 * @param   {PageMetadataOptions} props - Metadata generation options.
 * @returns {Metadata}                  `Metadata` object for Next.js.
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
