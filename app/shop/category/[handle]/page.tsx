import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type JSX, memo, Suspense } from 'react';

import { getImageUrl, getPageByUrl } from '@/app/api';
import { getDictionary } from '@/app/dictionaries';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import type { MetadataParams, PageProps } from '@/app/types/global';
import { SHOP_PAGE_LIMIT } from '@/app/utils/constants';
import { shopCrawlMeta, type ShopSearchParams } from '@/app/utils/shopCrawlMeta';
import ProductsGridLayout from '@/components/layout/products-grid';
import ProductsGridLoader from '@/components/layout/products-grid/components/ProductsGridLoader';

const MemoizedProductsGridLoader = memo(ProductsGridLoader);

/**
 * ShopCategoryLayout — shop category page layout under `/shop/category/<handle>`.
 *
 * @param   {PageProps}              props - Page props with `params` and `searchParams`.
 * @returns Promise resolving to JSX of the page layout (breadcrumb JSON-LD + suspended products grid).
 */
const ShopCategoryLayout = async (props: PageProps): Promise<JSX.Element> => {
  const [searchParams, params] = await Promise.all([props.searchParams, props.params]);
  const { handle } = params;
  ServerProvider('dict', await getDictionary());

  const { page } = await getPageByUrl(handle);
  const productsLimit = SHOP_PAGE_LIMIT;

  if (!page) {
    return notFound();
  }

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
        name: 'Shop',
        item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/shop`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: page.localizeInfos.title,
        item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/shop/category/${handle}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />
      <section className="shop_section">
        <div className="flex w-full flex-col items-center gap-5">
          <Suspense fallback={<MemoizedProductsGridLoader productsLimit={productsLimit} />}>
            <ProductsGridLayout
              searchParams={searchParams ?? {}}
              productsLimit={productsLimit}
              params={params}
              isCategory={true}
            />
          </Suspense>
        </div>
      </section>
    </>
  );
};

export default ShopCategoryLayout;

/**
 * generateMetadata — category page metadata derived from the CMS page by `handle`.
 *
 * @param   {MetadataParams}                  props        - Component props.
 * @param   {MetadataParams['params']}        props.params - Async route params with the category handle.
 * @returns Promise resolving to the page metadata.
 */
export async function generateMetadata({
  params,
  searchParams,
}: MetadataParams & { searchParams?: Promise<ShopSearchParams> }): Promise<Metadata> {
  const { handle } = await params;
  const sp = await searchParams;
  const { isError, page } = await getPageByUrl(handle);

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
    // Page `image` attribute value is an ARRAY (unlike Products, which is an object);
    // getImageUrl normalises both shapes.
    url: getImageUrl(
      (attributeValues.icon as { value?: unknown } | undefined)?.value as
        { downloadLink?: string } | Array<{ downloadLink?: string }> | null | undefined
    ),
    width: 300,
    height: 300,
    altText: localizeInfos.title,
  };

  return {
    title: localizeInfos.title,
    description: (localizeInfos as { plainContent?: string }).plainContent,
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
    ...shopCrawlMeta({ searchParams: sp, canonicalPath: `/shop/category/${handle}`, isVisible }),
  };
}
