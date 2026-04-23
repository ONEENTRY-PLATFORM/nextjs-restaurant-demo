import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';
import { memo, Suspense } from 'react';

import { getPageByUrl } from '@/app/api';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import type { MetadataParams, PageProps } from '@/app/types/global';
import ProductsGridLayout from '@/components/layout/products-grid';
import ProductsGridLoader from '@/components/layout/products-grid/components/ProductsGridLoader';

import { getImageUrl } from '../api/hooks/useAttributesData';
import { getDictionary } from '../dictionaries';
import { generatePageMetadata } from '../utils/generatePageMetadata';

/** Memoize the loader component to prevent unnecessary re-renders */
const MemoizedProductsGridLoader = memo(ProductsGridLoader);

export const dynamic = 'force-dynamic';

/**
 * Shop page
 * @param   {PageProps}            props - Page props containing params and searchParams
 * @returns {Promise<JSX.Element>}       Shop page layout JSX.Element
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/page Next.js docs}
 */
const ShopPageLayout = async (props: PageProps): Promise<JSX.Element> => {
  /** Extract search parameters from props */
  const [searchParams, params] = await Promise.all([
    props.searchParams,
    props.params,
  ]);
  /** Get the dictionary from the API and set the server provider. */
  const [dict] = ServerProvider('dict', await getDictionary());

  /** Get current Page ByUrl from api */
  const { page } = await getPageByUrl('shop');

  /** Set the number of products to display per page */
  // TODO: Extract products per page limit from global settings
  const pagesLimit = 10;

  /** Return 404 page if shop page not found */
  if (!page) {
    return notFound();
  }

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
        name: page.localizeInfos.title,
        item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/shop`,
      },
    ],
  };

  /** Render the shop page with structured data and product grid */
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />
      <section className="relative mx-auto box-border flex w-full md:max-w-175 lg:max-w-250 xl:max-w-323 shrink-0 grow flex-col self-stretch">
        <div className="flex w-full flex-col items-center gap-5">
          <Suspense fallback={<MemoizedProductsGridLoader />}>
            <ProductsGridLayout
              pagesLimit={pagesLimit}
              dict={dict}
              params={params}
              searchParams={searchParams ?? {}}
            />
          </Suspense>
        </div>
      </section>
    </>
  );
};

export default ShopPageLayout;

/**
 * Generate page metadata
 * @param   {MetadataParams}                           props        - Metadata params
 * @param   {Promise<{handle: string; lang: string;}>} props.params - Page params
 * @returns {Promise<Metadata>}                                     Metadata object
 * @see {@link https://doc.oneentry.cloud/docs/pages OneEntry CMS docs}
 * @see {@link https://nextjs.org/docs/app/building-your-application/optimizing/metadata#dynamic-metadata Next.js docs}
 */
export async function generateMetadata({
  params,
}: MetadataParams): Promise<Metadata> {
  /** Extract handle and language from route parameters */
  const { handle, lang } = await params;
  /** Fetch the shop page by URL */
  const { isError, page } = await getPageByUrl('shop');

  /** Return 404 page if page not found or an error occurred */
  if (isError || !page) {
    return notFound();
  }

  /** Extract page information from the page object */
  const { localizeInfos, isVisible, attributeValues } = page;

  /** Return metadata object */
  return generatePageMetadata({
    handle: handle,
    title: localizeInfos.title,
    description:
      (localizeInfos as { plainContent?: string }).plainContent ?? '',
    isVisible: isVisible,
    imageUrl: getImageUrl('opengraph_image', attributeValues),
    imageAlt: localizeInfos.title,
    lang: lang,
    baseUrl: '',
  });
}
