import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { IPagesEntity } from 'oneentry/dist/pages/pagesInterfaces';
import type { JSX } from 'react';

import { getPageByUrl } from '@/app/api';
import { getChildPagesByParentUrl } from '@/app/api';
import CategoriesGrid from '@/components/layout/categories';

/**
 * Category page
 * @returns {Promise<JSX.Element>} Category page layout JSX.Element
 * @see {@link https://doc.oneentry.cloud/docs/pages OneEntry CMS docs}
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/page Next.js docs}
 */
const CategoryPage = async (): Promise<JSX.Element> => {
  /** Get child pages by parent url */
  const { pages, isError } = await getChildPagesByParentUrl('category');

  /** Return 404 page if there's an error or no pages found */
  if (isError || !pages || !Array.isArray(pages)) {
    return notFound();
  }

  /** Extract categories data from pages for display in the grid */
  const categories = pages.map((page: IPagesEntity) => {
    return {
      title: page.localizeInfos.title,
      link: '/shop/category/' + page.pageUrl,
      imgSrc: page.attributeValues.opengraph_image?.value[0]?.downloadLink,
    };
  });

  /** Generate structured data for breadcrumbs to improve SEO */
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Categories',
        item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/shop/category`,
      },
    ],
  };

  /** Render the category page with structured data and categories grid */
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />
      <section className="relative mx-auto box-border flex w-full max-w-(--breakpoint-xl) shrink-0 grow flex-col self-stretch">
        <div className="flex w-full flex-col items-center gap-5">
          <CategoriesGrid categories={categories} />
        </div>
      </section>
    </>
  );
};

export default CategoryPage;

/**
 * Pre-generation of category pages for each locale
 * @returns {Promise<Array<{ handle: string }>>} Array of static parameters
 */
export async function generateStaticParams(): Promise<
  Array<{ handle: string }>
> {
  /** Initialize an empty array to store static parameters */
  const params: Array<{ handle: string }> = [];
  /** Fetch the category page by URL for the current language */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { page }: any = await getPageByUrl('category');
  /** Check if page exists */
  if (page) {
    const handle =
      'pageUrl' in page ? (page as { pageUrl: string }).pageUrl : '';
    params.push({
      handle,
    });
  }
  return params;
}

/**
 * Generate page metadata
 * @async
 * @param   {{params: Promise<{ handle: string; lang: string }>}} params - page params
 * @returns {Promise<Metadata>}                                          metadata
 * @see {@link https://doc.oneentry.cloud/docs/pages OneEntry CMS docs}
 * @see {@link https://nextjs.org/docs/app/building-your-application/optimizing/metadata#dynamic-metadata Next.js docs}
 */
export async function generateMetadata(): Promise<Metadata> {
  const { isError, page } = await getPageByUrl('category');

  if (isError || !page) {
    return notFound();
  }
  const { localizeInfos, isVisible, attributeValues } = page;

  const {
    url,
    width,
    height,
    altText: alt,
  } = {
    url: attributeValues.icon?.downloadLink,
    width: 300,
    height: 300,
    altText: localizeInfos.title,
  };

  return {
    title: localizeInfos.title,
    description: localizeInfos.plainContent,
    robots: {
      index: isVisible,
      follow: isVisible,
      googleBot: {
        index: isVisible,
        follow: isVisible,
      },
    },
    openGraph: url
      ? {
          images: [
            {
              url,
              width,
              height,
              alt,
            },
          ],
        }
      : null,
  };
}
