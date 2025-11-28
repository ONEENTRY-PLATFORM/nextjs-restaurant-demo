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
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: localizeInfos.title,
    description: attributeValues.description?.value[0]?.plainValue,
    image: attributeValues.pic?.value?.downloadLink,
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
      <div className="mx-auto flex w-full max-w-(--breakpoint-xl) flex-col bg-white">
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

  const { downloadLink, alt = 'alt' } =
    product.attributeValues.pic?.value || {};
  const indexable = product.isVisible;

  return {
    title: product?.localizeInfos.title,
    description: product?.attributeValues.description?.value[0]?.plainValue,
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
