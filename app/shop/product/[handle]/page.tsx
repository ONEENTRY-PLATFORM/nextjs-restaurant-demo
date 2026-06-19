import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getProductById, getProductImageUrl } from '@/app/api';
import { PRODUCT_STATUSES } from '@/app/utils/constants';
import TrackProductView from '@/components/analytics/TrackProductView';
import ProductSingle from '@/components/layout/product';

/**
 * ProductPageLayout — product page layout (Product JSON-LD + `<ProductSingle />`).
 *
 * @param   {object}                                              props        - Component props.
 * @param   {Promise<{ handle: string; lang: string }>}           props.params - Async route params with the product id (`handle`) and locale.
 * @returns Promise resolving to JSX of the product page layout.
 */
const ProductPageLayout = async ({
  params,
}: {
  params: Promise<{ handle: string; lang: string }>;
}): Promise<JSX.Element> => {
  const { handle } = await params;

  const { isError, product } = await getProductById(Number(handle));

  if (isError || !product) {
    return notFound();
  }

  const { attributeValues, localizeInfos, additional, statusIdentifier } = product;

  // JSON-LD structured data for the product (https://json-ld.org/) for SEO.
  const descriptionValue = attributeValues.description?.value as
    | Array<{ plainValue?: string }>
    | undefined;
  const imageUrl = getProductImageUrl(attributeValues);
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: localizeInfos.title,
    description: descriptionValue?.[0]?.plainValue,
    image: imageUrl || undefined,
    offers: {
      '@type': 'AggregateOffer',
      availability:
        statusIdentifier === PRODUCT_STATUSES.outOfStock
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
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
      <TrackProductView productId={product.id} />
      <ProductSingle product={product as IProductsEntity} />
    </>
  );
};

export default ProductPageLayout;

/**
 * generateMetadata — product page metadata (title, description, OG image, robots).
 *
 * @param   {object}                                              props        - Component props.
 * @param   {Promise<{ handle: string; lang: string }>}           props.params - Async route params with the product id (`handle`) and locale.
 * @returns Promise resolving to the page metadata.
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

  const downloadLink = getProductImageUrl(product.attributeValues);
  const alt = product.localizeInfos?.title ?? 'alt';
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
