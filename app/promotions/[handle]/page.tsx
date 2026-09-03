import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';
import { memo, Suspense } from 'react';

import { getBlogBanners, getImageUrl, getPageByUrl } from '@/app/api';
import { getDictionary, t } from '@/app/dictionaries';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import type { MetadataParams, PageProps } from '@/app/types/global';
import { PAGES, SHOP_PAGE_LIMIT } from '@/app/utils/constants';
import { sanitizeHtml } from '@/app/utils/sanitizeHtml';
import ProductsGridLayout from '@/components/layout/products-grid';
import ProductsGridLoader from '@/components/layout/products-grid/components/ProductsGridLoader';
import { blogBannerFromPage } from '@/components/promo/blogBanner';
import RelatedPromosCarousel from '@/components/promo/RelatedPromosCarousel';
import { unwrapRichText } from '@/components/utils';

const MemoizedProductsGridLoader = memo(ProductsGridLoader);

// Force-dynamic: the promo products grid is driven by awaited `searchParams`
// (filters/pagination) — declared explicitly instead of relying on implicit dynamic detection.
export const dynamic = 'force-dynamic';

type ImageValue = { downloadLink?: string } | Array<{ downloadLink?: string }> | null | undefined;

/**
 * PromoDetailPage — promo detail page (`/promotions/<pageUrl>`).
 *
 * @param   {PageProps}              props - Dynamic route props (`params`, `searchParams`).
 * @returns Promise resolving to JSX of the promo detail page.
 */
const PromoDetailPage = async (props: PageProps): Promise<JSX.Element> => {
  const [searchParams, params] = await Promise.all([props.searchParams, props.params]);
  const { handle } = params;

  ServerProvider('dict', await getDictionary());

  const [{ page, isError }, bannersRes, parentResp] = await Promise.all([
    getPageByUrl(handle),
    getBlogBanners(),
    getPageByUrl(PAGES.promotions),
  ]);

  if (isError || !page) {
    return notFound();
  }

  const banners = (bannersRes.pages ?? []).map(blogBannerFromPage);

  const parentTitle = parentResp.page?.localizeInfos?.title ?? 'Promotions';
  const parentUrl = parentResp.page?.pageUrl ?? 'promotions';

  const productsLimit = SHOP_PAGE_LIMIT;
  const relatedPromos = banners.filter(b => b.pageUrl !== handle && b.mobileImage);

  const attrs = page.attributeValues ?? {};
  const image =
    getImageUrl(attrs.bg_image?.value as ImageValue) ||
    getImageUrl(attrs.banner?.value as ImageValue);
  const title = page.localizeInfos?.title ?? '';
  const description = unwrapRichText(attrs.description?.value);
  const subtitleHtml = sanitizeHtml(description?.htmlValue ?? description?.plainValue);
  const goToSelectionLabel = await t('promo_go_to_selection', 'Go to selection');
  const homeLabel = await t('home_label', 'Home');

  return (
    <section className="section_layout">
      <nav aria-label="Breadcrumbs" className="mb-5 text-base">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-text">
          <li>
            <Link href="/" className="transition-colors hover:text-brand">
              {homeLabel}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/${parentUrl}`} className="transition-colors hover:text-brand">
              {parentTitle}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-paper" aria-current="page">
            {title}
          </li>
        </ol>
      </nav>

      {image ? (
        <div className="overflow-hidden rounded-panel">
          <Image
            src={image}
            alt={title}
            width={1292}
            height={192}
            sizes="(max-width: 768px) 100vw, 1292px"
            priority
            className="h-auto w-full object-cover"
          />
        </div>
      ) : null}

      <div className="mt-11.25">
        <h1 className="text-xl font-bold text-brand uppercase">{title}</h1>
        {subtitleHtml ? (
          <div className="cms_prose mt-3.75" dangerouslySetInnerHTML={{ __html: subtitleHtml }} />
        ) : null}
      </div>

      <div className="mt-12.5">
        <Suspense fallback={<MemoizedProductsGridLoader productsLimit={productsLimit} />}>
          <ProductsGridLayout
            params={{ handle }}
            searchParams={searchParams ?? {}}
            productsLimit={productsLimit}
            isCategory={true}
            emptyFallback={
              <Link
                href="/shop"
                className="mx-auto flex h-12.5 w-full max-w-154 items-center justify-center rounded-panel bg-custom-gradient text-base font-bold text-white uppercase transition-all duration-200 hover:bg-gradient-to-r-hover active:bg-gradient-to-r-hover"
              >
                {goToSelectionLabel}
              </Link>
            }
          />
        </Suspense>
      </div>

      {relatedPromos.length > 0 ? (
        <div className="mt-20">
          {relatedPromos.length >= 3 ? (
            <RelatedPromosCarousel promos={relatedPromos} />
          ) : (
            <div className="flex flex-col justify-between gap-15 lg:flex-row">
              {relatedPromos.map(b => (
                <Link
                  key={b.id}
                  href={b.pageUrl ? `/promotions/${b.pageUrl}` : '#'}
                  title={b.title}
                  className="block min-w-0 flex-1 overflow-hidden rounded-panel transition-transform duration-500 hover:scale-102"
                >
                  <Image
                    src={b.mobileImage as string}
                    alt={b.title}
                    width={615}
                    height={278}
                    sizes="(min-width: 1024px) 615px, 100vw"
                    className="h-auto w-full"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
};

export default PromoDetailPage;

/**
 * generateMetadata — metadata for the promo detail page (CMS title/description, OG article).
 *
 * @param   {MetadataParams}                  props        - Component props.
 * @param   {MetadataParams['params']}        props.params - Async route params with the promo `pageUrl` handle.
 * @returns Promise resolving to the page metadata.
 */
export async function generateMetadata({ params }: MetadataParams): Promise<Metadata> {
  const { handle } = await params;
  const [{ page }, dict] = await Promise.all([getPageByUrl(handle), getDictionary()]);
  const defaultTitle = dict.promo_default_title?.value as string;
  if (!page) {
    return { title: defaultTitle };
  }
  const attrs = page.attributeValues ?? {};
  const title = page.localizeInfos?.title ?? defaultTitle;
  const descriptionText = unwrapRichText(attrs.description?.value)?.plainValue ?? '';
  return {
    title,
    description: descriptionText,
    openGraph: { type: 'article', title, description: descriptionText },
  };
}
