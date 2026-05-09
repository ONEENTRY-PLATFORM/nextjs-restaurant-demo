import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type JSX, memo, Suspense } from 'react';

import { getPageByUrl } from '@/app/api';
import { getDictionary } from '@/app/dictionaries';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import type { MetadataParams, PageProps } from '@/app/types/global';
import { SHOP_PAGE_LIMIT } from '@/app/utils/constants';
import ProductsGridLayout from '@/components/layout/products-grid';
import ProductsGridLoader from '@/components/layout/products-grid/components/ProductsGridLoader';

const MemoizedProductsGridLoader = memo(ProductsGridLoader);

/**
 * ShopCategoryLayout — layout страницы категории магазина.
 * @param   {PageProps} props - Пропсы страницы.
 * @returns {Promise<JSX.Element>} JSX layout-а страницы.
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

/** generateMetadata — метаданные страницы категории. */
export async function generateMetadata({ params }: MetadataParams): Promise<Metadata> {
  const { handle } = await params;
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
    url: (attributeValues.icon as { downloadLink?: string } | undefined)?.downloadLink,
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
  };
}
