import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';
import { memo, Suspense } from 'react';

import { getPageByUrl } from '@/app/api';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import type { MetadataParams, PageProps } from '@/app/types/global';
import ProductsGridLayout from '@/components/layout/products-grid';
import ProductsGridLoader from '@/components/layout/products-grid/components/ProductsGridLoader';

import { getDictionary } from '../../dictionaries';

/** Memoize the loader component to prevent unnecessary re-renders */
const MemoizedProductsGridLoader = memo(ProductsGridLoader);

/**
 * Shop catalog page
 * @async
 * @param   {object}                                                    props              - page props
 * @param   {Promise<{ handle: string; lang: string }>}                 props.params       - page params
 * @param   {Promise<{ [key: string]: string | string[] | undefined }>} props.searchParams - search params
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/page Next.js docs}
 * @returns {Promise<JSX.Element>}                                                         Shop page layout JSX.Element
 */
const ShopCatalogPage = async (props: PageProps): Promise<JSX.Element> => {
  /** Extract search parameters from the request */
  const [searchParams, params] = await Promise.all([
    props.searchParams,
    props.params,
  ]);
  /** Extract route parameters from the request */
  const { handle } = params;

  /** Get the dictionary from the API and set the server provider. */
  const [dict] = ServerProvider('dict', await getDictionary());

  // get page by url from the API
  const { page, isError } = await getPageByUrl(handle);

  /** Set the number of products to display per page */
  // TODO: Extract products per page limit from global settings
  const pagesLimit = 10;

  if (!page || isError) {
    return notFound();
  }

  /** Render the shop catalog page layout */
  return (
    <section className="relative mx-auto box-border flex w-full md:max-w-175 lg:max-w-250 xl:max-w-323 shrink-0 grow flex-col self-stretch">
      <div className="flex w-full flex-col items-center gap-5">
        <Suspense fallback={<MemoizedProductsGridLoader />}>
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
    url: (attributeValues?.icon as { downloadLink?: string } | undefined)
      ?.downloadLink,
    width: 300,
    height: 300,
    altText: localizeInfos?.title,
  };

  return {
    title: localizeInfos?.title,
    description: (localizeInfos as { plainContent?: string } | undefined)
      ?.plainContent,
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
