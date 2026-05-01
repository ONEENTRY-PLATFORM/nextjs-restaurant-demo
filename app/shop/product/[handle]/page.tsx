/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import { getProductById } from '@/app/api';
import { getDictionary } from '@/app/dictionaries';
import ProductSingle from '@/components/layout/product';

/**
 * Layout страницы товара
 * @param   {object}                                    props        - Пропсы страницы.
 * @param   {Promise<{ handle: string; lang: string }>} props.params - Параметры страницы с handle и lang.
 * @returns {Promise<JSX.Element>}                                   Promise<JSX.Element> — layout страницы товара.
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/page Next.js docs}
 */
const ProductPageLayout = async ({
  params,
}: {
  params: Promise<{ handle: string; lang: string }>;
}): Promise<JSX.Element> => {
  const { handle } = await params;
  /** Получаем словарь из API и проставляем server provider. */
  const dict = await getDictionary();

  /** Получаем товар по текущему Id */
  const { isError, product } = await getProductById(Number(handle));

  /** Возвращаем 404, если товар не найден или произошла ошибка */
  if (isError || !product) {
    return notFound();
  }

  /** Извлекаем данные из товара для генерации structured data */
  const { attributeValues, localizeInfos, additional, statusIdentifier } =
    product;

  /**
   * Structured data товара в формате JSON-LD для SEO
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
      <ProductSingle product={product as any} dict={dict} />
    </>
  );
};

export default ProductPageLayout;

/**
 * Генерирует метаданные страницы
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
