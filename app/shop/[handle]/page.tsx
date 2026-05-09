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

import { getDictionary } from '../../dictionaries';

const MemoizedProductsGridLoader = memo(ProductsGridLoader);

/**
 * ShopCatalogPage — страница каталога магазина.
 * @param   {PageProps} props - Пропсы страницы.
 * @returns {Promise<JSX.Element>} JSX layout-а страницы.
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

/** generateMetadata — метаданные страницы каталога. */
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
    url: (attributeValues?.icon as { downloadLink?: string } | undefined)?.downloadLink,
    width: 300,
    height: 300,
    altText: localizeInfos?.title,
  };

  return {
    title: localizeInfos?.title,
    description: (localizeInfos as { plainContent?: string } | undefined)?.plainContent,
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
