import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import { getImageUrl, getPageByUrl, getProductsByPageUrl } from '@/app/api';
import { getDictionary } from '@/app/dictionaries';
import ProductsGrid from '@/components/layout/products-grid/components/ProductsGrid';

type PromoPageProps = {
  params: Promise<{ handle: string }>;
};

type ImageValue =
  | { downloadLink?: string }
  | Array<{ downloadLink?: string }>
  | null
  | undefined;

type DescriptionValue = Array<{
  plainValue?: string;
  htmlValue?: string;
  mdValue?: string;
}>;

/**
 * Страница деталей промо-акции — рендерит одну промо-кампанию по маркеру `pageUrl`
 * (например, `/promo/birthday_offer`, `/promo/business_lunch`).
 *
 * Управляется атрибутами дочерних страниц `blog` в OneEntry (набор `blog_page`).
 * Реальные атрибуты:
 *   - `bg_image`    (image) — hero для десктопа;
 *   - `banner`      (image) — мобильный fallback, если `bg_image` пуст;
 *   - `description` (text)  — тело в markdown/html;
 *   - `action_type` (list)  — `[{ title }]` для подписи CTA.
 * @param   {PromoPageProps}       props - Пропсы динамического маршрута Next.js.
 * @returns {Promise<JSX.Element>}       JSX страницы деталей промо.
 * @see {@link https://doc.oneentry.cloud/docs/pages OneEntry CMS docs}
 */
const PromoDetailPage = async ({
  params,
}: PromoPageProps): Promise<JSX.Element> => {
  const { handle } = await params;
  const [{ page, isError }, dict] = await Promise.all([
    getPageByUrl(handle),
    getDictionary(),
  ]);

  if (isError || !page) {
    return notFound();
  }

  const promoProducts = await getProductsByPageUrl({
    offset: 0,
    limit: 50,
    params: { handle },
  });
  const products = promoProducts.isError ? [] : (promoProducts.products ?? []);

  const attrs = page.attributeValues ?? {};
  const image =
    getImageUrl(attrs.bg_image?.value as ImageValue) ||
    getImageUrl(attrs.banner?.value as ImageValue);
  const title = page.localizeInfos?.title ?? '';
  const description = attrs.description?.value as DescriptionValue | undefined;
  const subtitleHtml =
    description?.[0]?.htmlValue ?? description?.[0]?.plainValue ?? '';
  const actionType = attrs.action_type?.value as
    | Array<{ title?: string }>
    | undefined;
  const cta =
    actionType?.[0]?.title ?? (dict.promo_default_cta?.value as string);

  return (
    <section className="section_layout">
      {/* main promo info */}
      <div className="relative overflow-hidden rounded-[20px] bg-ink">
        {image ? (
          <Image
            src={image}
            alt={title}
            width={1292}
            height={500}
            sizes="(max-width: 768px) 100vw, 1292px"
            className="h-auto w-full object-cover"
          />
        ) : null}
        <div className="p-6 md:p-10">
          <h1 className="mb-5 font-bold text-[20px] md:text-[32px] uppercase tracking-[0.02em] text-brand">
            {title}
          </h1>
          {subtitleHtml ? (
            <div
              className="text-base text-paper/90"
              dangerouslySetInnerHTML={{ __html: subtitleHtml }}
            />
          ) : null}
          <button
            type="button"
            className="mx-auto mt-12.5 block h-12.5 w-full max-w-153.75 rounded-[10px] bg-custom-gradient text-base font-bold uppercase text-white hover:bg-gradient-to-r-hover"
          >
            {cta}
          </button>
        </div>
      </div>
      {/* Promo Products Grid */}
      {products.length > 0 ? (
        <div className="mt-10">
          <ProductsGrid
            dict={attrs}
            products={products}
            productsLimit={products.length}
          />
        </div>
      ) : null}
    </section>
  );
};

export default PromoDetailPage;

/**
 * Генерирует метаданные страницы для маршрута деталей промо.
 * @param   {PromoPageProps}    props - Пропсы Next.js.
 * @returns {Promise<Metadata>}       Объект метаданных.
 */
export async function generateMetadata({
  params,
}: PromoPageProps): Promise<Metadata> {
  const { handle } = await params;
  const [{ page }, dict] = await Promise.all([
    getPageByUrl(handle),
    getDictionary(),
  ]);
  const defaultTitle = dict.promo_default_title?.value as string;
  if (!page) {
    return { title: defaultTitle };
  }
  const attrs = page.attributeValues ?? {};
  const title = page.localizeInfos?.title ?? defaultTitle;
  const description = attrs.description?.value as DescriptionValue | undefined;
  const descriptionText = description?.[0]?.plainValue ?? '';
  return {
    title,
    description: descriptionText,
    openGraph: { type: 'article', title, description: descriptionText },
  };
}
