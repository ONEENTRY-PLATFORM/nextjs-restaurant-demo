import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';
import { Suspense } from 'react';

import { getPageByUrl } from '@/app/api';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import type { MetadataParams, PageProps } from '@/app/types/global';
import ProductsGridLayout from '@/components/layout/products-grid';
import ProductsGridLoader from '@/components/layout/products-grid/components/ProductsGridLoader';

import { getDictionary } from '../../dictionaries';

/**
 * Shop catalog page
 */
const ShopCatalogPage = async (props: PageProps): Promise<JSX.Element> => {
  const [searchParams, params] = await Promise.all([
    props.searchParams,
    props.params,
  ]);
  const { handle } = params;

  // Get the dictionary from the API and set the server provider.
  const [dict] = ServerProvider('dict', await getDictionary());

  // get page by url from the API
  const { page, isError } = await getPageByUrl(handle);

  // !!!extract products per page limit from global settings
  const pagesLimit = 10;

  if (!page || isError) {
    return notFound();
  }

  return (
    <section className="relative mx-auto box-border flex w-full max-w-(--breakpoint-xl) shrink-0 grow flex-col self-stretch">
      <div className="flex w-full flex-col items-center gap-5">
        <Suspense fallback={<ProductsGridLoader />}>
          <ProductsGridLayout
            params={{ handle }}
            searchParams={searchParams ?? {}}
            pagesLimit={pagesLimit}
            dict={dict}
          />
        </Suspense>
      </div>
    </section>
  );
};

export default ShopCatalogPage;

/**
 * Generate page metadata
 */
export async function generateMetadata({
  params,
}: MetadataParams): Promise<Metadata> {
  const { handle } = await params;
  const { isError, page } = await getPageByUrl(handle);

  if (isError || !page) {
    return notFound();
  }

  // extract data from page
  const { localizeInfos, isVisible, attributeValues } = page;

  const {
    url,
    width,
    height,
    altText: alt,
  } = {
    url: attributeValues?.icon?.downloadLink,
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
  };
}
