import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { IProductsEntity } from 'oneentry/types';
import { type JSX, Suspense } from 'react';

import { getOutOfStockMarker, getProductById, getProductImageUrl } from '@/app/api';
import { getSiteUrl } from '@/app/utils/getSiteUrl';
import { serializeJsonLd } from '@/app/utils/serializeJsonLd';
import TrackProductView from '@/components/analytics/TrackProductView';
import ProductSingle from '@/components/layout/product';
import ProductSingleSkeleton from '@/components/shared/skeletons/ProductSingleSkeleton';
import { unwrapRichText } from '@/components/utils';

// force-dynamic — product data is cached via `unstable_cache` in `getProductById`, so only the RSC
// render runs per request (no per-product prerender). Loading skeleton lives in the sibling
// `loading.tsx` (ProductSingleSkeleton). Trade-off: that loading boundary flushes a 200 shell before
// `getProductById` resolves, so an unknown id is a soft-404 (200), not a hard 404.
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
  const imageUrl = getProductImageUrl(attributeValues);
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: localizeInfos.title,
    description: unwrapRichText(attributeValues.description?.value)?.plainValue,
    image: imageUrl || undefined,
    /*
      Emitted only when the CMS actually has prices. Passing them through
      undefined left an `AggregateOffer` with neither `lowPrice` nor
      `highPrice` — an offer that claims to exist while naming no price, which
      rich results reject and which tells a crawler less than no offer at all.
    */
    ...(typeof additional.prices?.min === 'number' && typeof additional.prices?.max === 'number'
      ? {
          offers: {
            '@type': 'AggregateOffer',
            /** Rich results want the offer to name the page it is sold on. */
            url: `${getSiteUrl()}/shop/product/${handle}`,
            availability:
              statusIdentifier === outOfStockMarker
                ? 'https://schema.org/OutOfStock'
                : 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition',
            priceCurrency: attributeValues.currency?.value,
            highPrice: additional.prices.max,
            lowPrice: additional.prices.min,
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(productJsonLd),
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
