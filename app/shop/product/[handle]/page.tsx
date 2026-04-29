/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import { getProductById } from '@/app/api';
import { getDictionary } from '@/app/dictionaries';
import ProductSingle from '@/components/layout/product';

/**
 * Product page layout for product page
 * @param   {object}                                    props        - Page props.
 * @param   {Promise<{ handle: string; lang: string }>} props.params - Page params with handle and lang.
 * @returns {Promise<JSX.Element>}                                   Promise<JSX.Element> - Product page layout.
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/page Next.js docs}
 */
const ProductPageLayout = async ({
  params,
}: {
  params: Promise<{ handle: string; lang: string }>;
}): Promise<JSX.Element> => {
  const { handle } = await params;
  /** Get the dictionary from the API and set the server provider. */
  const dict = await getDictionary();

  /** Get product by current Id */
  const { isError, product } = await getProductById(Number(handle));

  /** Return 404 page if product not found or an error occurred */
  if (isError || !product) {
    return notFound();
  }

  /** Extract data from product for structured data generation */
  const { attributeValues, localizeInfos, additional, statusIdentifier } =
    product;

  /**
   * Product JSON-LD structured data for SEO
   * https://json-ld.org/
   */
  const descriptionValue = attributeValues.description?.value as
    | Array<{ plainValue?: string }>
    | undefined;
  const picValue = attributeValues.cover?.value as
    | { downloadLink?: string; alt?: string }
    | undefined;
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: localizeInfos.title,
    description: descriptionValue?.[0]?.plainValue,
    image: picValue?.downloadLink,
    offers: {
      '@type': 'AggregateOffer',
      availability: statusIdentifier
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      priceCurrency: attributeValues.currency?.value,
      highPrice: additional.prices?.max,
      lowPrice: additional.prices?.min,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productJsonLd),
        }}
      />
      <div className="mx-auto flex w-full md:max-w-175 lg:max-w-250 xl:max-w-323 flex-col">
        <ProductSingle product={product as any} dict={dict} />
      </div>
    </>
  );
};

export default ProductPageLayout;

/**
 * Generate page metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string; lang: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const { isError, product } = await getProductById(Number(handle));

  if (isError || !product) {
    return notFound();
  }

  const picValue = product.attributeValues.cover?.value as
    | { downloadLink?: string; alt?: string }
    | undefined;
  const { downloadLink, alt = 'alt' } = picValue || {};
  const descValue = product.attributeValues.description?.value as
    | Array<{ plainValue?: string }>
    | undefined;
  const indexable = product.isVisible;

  return {
    title: product?.localizeInfos.title,
    description: descValue?.[0]?.plainValue,
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable,
      },
    },
    openGraph: downloadLink
      ? {
          images: [
            {
              url: downloadLink,
              width: 300,
              height: 300,
              alt,
            },
          ],
        }
      : null,
  };
}
