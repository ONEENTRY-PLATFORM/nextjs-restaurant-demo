import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';
import { memo, Suspense } from 'react';

import { getPageByUrl } from '@/app/api';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import type { MetadataParams, PageProps } from '@/app/types/global';
import { SHOP_PAGE_LIMIT } from '@/app/utils/constants';
import { shopCrawlMeta, type ShopSearchParams } from '@/app/utils/shopCrawlMeta';
import ProductsGridLayout from '@/components/layout/products-grid';
import ProductsGridLoader from '@/components/layout/products-grid/components/ProductsGridLoader';

import { getDictionary } from '../../dictionaries';

const MemoizedProductsGridLoader = memo(ProductsGridLoader);

// Force-dynamic: the grid is driven by awaited `searchParams` (filters/pagination) —
// declared explicitly instead of relying on implicit dynamic detection.
export const dynamic = 'force-dynamic';

/**
 * ShopCatalogPage — shop catalog page rendered as a single category by `handle`.
 *
 * @param   {PageProps}              props - Page props with `params` and `searchParams`.
 * @returns Promise resolving to JSX of the page layout (suspended products grid).
 */
const ShopCatalogPage = async (props: PageProps): Promise<JSX.Element> => {
  const [searchParams, params] = await Promise.all([props.searchParams, props.params]);
  const { handle } = params;

  ServerProvider('dict', await getDictionary());

  const { page, isError } = await getPageByUrl(handle);
  const productsLimit = SHOP_PAGE_LIMIT;

  if (!page || isError) {
    return notFound();
  }

  return (
    <section className="shop_section">
      <div className="flex w-full flex-col items-center gap-5">
        <Suspense fallback={<MemoizedProductsGridLoader productsLimit={productsLimit} />}>
          <ProductsGridLayout
            params={{ handle }}
            searchParams={searchParams ?? {}}
            productsLimit={productsLimit}
            isCategory={true}
          />
        </Suspense>
      </div>
    </section>
  );
};

export default ShopCatalogPage;

/**
 * generateMetadata — catalog page metadata derived from the CMS page by `handle`.
 *
 * @param   {MetadataParams}                  props        - Component props.
 * @param   {MetadataParams['params']}        props.params - Async route params with the page handle.
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

  // `menu_icon` (image) is normalized by the SDK into a `{type, value: Array<{downloadLink}>}` shape
  // on Pages — unwrap the first element for the OG image.
  const menuIconAttr = attributeValues?.menu_icon as
    { value?: { downloadLink?: string } | Array<{ downloadLink?: string }> | null } | undefined;
  const menuIconValue = menuIconAttr?.value;
  const {
    url,
    width,
    height,
    altText: alt,
  } = {
    url: Array.isArray(menuIconValue)
      ? menuIconValue[0]?.downloadLink
      : menuIconValue?.downloadLink,
    width: 300,
    height: 300,
    altText: localizeInfos?.title,
  };

  return {
    title: localizeInfos?.title,
    description: localizeInfos?.plainContent,
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
    ...shopCrawlMeta({ searchParams: sp, canonicalPath: `/shop/${handle}`, isVisible }),
  };
}
