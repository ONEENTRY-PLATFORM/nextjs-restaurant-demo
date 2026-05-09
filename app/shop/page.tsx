import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';
import { memo, Suspense } from 'react';

import { getPageByUrl } from '@/app/api';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import type { MetadataParams, PageProps } from '@/app/types/global';
import { SHOP_PAGE_LIMIT } from '@/app/utils/constants';
import ProductsGridLayout from '@/components/layout/products-grid';
import ProductsGridLoader from '@/components/layout/products-grid/components/ProductsGridLoader';

import { getImageUrl } from '../api/hooks/useAttributesData';
import { getDictionary } from '../dictionaries';
import { generatePageMetadata } from '../utils/generatePageMetadata';

const MemoizedProductsGridLoader = memo(ProductsGridLoader);

export const dynamic = 'force-dynamic';

/**
 * ShopPageLayout — shop page.
 * @param   {PageProps} props - Page props with params and searchParams.
 * @returns {Promise<JSX.Element>} JSX of the shop page layout.
 */
const ShopPageLayout = async (props: PageProps): Promise<JSX.Element> => {
  const [searchParams, params] = await Promise.all([props.searchParams, props.params]);
  ServerProvider('dict', await getDictionary());

  const { page } = await getPageByUrl('services');
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
        name: page.localizeInfos?.title || '',
        item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/shop`,
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
              productsLimit={productsLimit}
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

/** generateMetadata — shop page metadata. */
export async function generateMetadata({ params }: MetadataParams): Promise<Metadata> {
  const { handle, lang } = await params;
  const { isError, page } = await getPageByUrl('services');

  if (isError || !page) {
    return notFound();
  }

  const { localizeInfos, isVisible, attributeValues } = page;

  return generatePageMetadata({
    handle: handle,
    title: localizeInfos.title,
    description: (localizeInfos as { plainContent?: string }).plainContent ?? '',
    isVisible: isVisible,
    imageUrl: getImageUrl('opengraph_image', attributeValues),
    imageAlt: localizeInfos.title,
    lang: lang,
    baseUrl: '',
  });
}
