import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import { type JSX, Suspense } from 'react';

import { getOutOfStockMarker, getProductById, getProductImageUrl } from '@/app/api';
import TrackProductView from '@/components/analytics/TrackProductView';
import ProductSingle from '@/components/layout/product';
import ProductSingleSkeleton from '@/components/shared/skeletons/ProductSingleSkeleton';

// force-dynamic — product data is cached via `unstable_cache` in `getProductById`, so only the RSC
// render runs per request (no per-product prerender). Loading skeleton lives in the sibling
// `loading.tsx` (ProductSingleSkeleton). Trade-off: that loading boundary flushes a 200 shell before
// `getProductById` resolves, so an unknown id is a soft-404 (200), not a hard 404 — see MISMATCH-LOG E.1.
export const dynamic = 'force-dynamic';

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
  const outOfStockMarker = await getOutOfStockMarker();

  // JSON-LD structured data for the product (https://json-ld.org/) for SEO.
  const descriptionValue = attributeValues.description?.value as
    Array<{ plainValue?: string }> | undefined;
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
        statusIdentifier === outOfStockMarker
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
      <Suspense fallback={<ProductSingleSkeleton />}>
        <ProductSingle product={product as IProductsEntity} />
      </Suspense>
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
    Array<{ plainValue?: string }> | undefined;
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
