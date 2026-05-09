import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { IProductsEntity } from 'oneentry/dist/products/productsInterfaces';
import type { JSX } from 'react';

import { getProductById } from '@/app/api';
import ProductSingle from '@/components/layout/product';

/**
 * ProductPageLayout — layout страницы товара.
 * @param   {object} props - Пропсы страницы.
 * @returns {Promise<JSX.Element>} JSX layout-а страницы товара.
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

  // JSON-LD structured data товара (https://json-ld.org/) для SEO.
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
      availability:
        statusIdentifier === 'out_of_stock'
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
      <ProductSingle product={product as IProductsEntity} />
    </>
  );
};

export default ProductPageLayout;

/** generateMetadata — метаданные страницы товара. */
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
