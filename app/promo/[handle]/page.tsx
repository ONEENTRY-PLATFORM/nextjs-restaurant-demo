import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';
import { memo, Suspense } from 'react';

import { getBlogBanners, getImageUrl, getPageByUrl } from '@/app/api';
import { getDictionary } from '@/app/dictionaries';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import type { MetadataParams, PageProps } from '@/app/types/global';
import { SHOP_PAGE_LIMIT } from '@/app/utils/constants';
import ProductsGridLayout from '@/components/layout/products-grid';
import ProductsGridLoader from '@/components/layout/products-grid/components/ProductsGridLoader';
import RelatedPromosCarousel from '@/components/promo/RelatedPromosCarousel';

const MemoizedProductsGridLoader = memo(ProductsGridLoader);

type ImageValue = { downloadLink?: string } | Array<{ downloadLink?: string }> | null | undefined;

type DescriptionValue = Array<{
  plainValue?: string;
  htmlValue?: string;
  mdValue?: string;
}>;

/**
 * PromoDetailPage - promo detail page (`/promo/<pageUrl>`).
 * Attributes of a `blog` child page (set `blog_page`): `bg_image` (hero desktop),
 * `banner` (mobile fallback), `description` (md/html). Products are fetched like in a regular category.
 * @param   {PageProps} props - Dynamic route props.
 * @returns {Promise<JSX.Element>} JSX of the promo detail page.
 */
const PromoDetailPage = async (props: PageProps): Promise<JSX.Element> => {
  const [searchParams, params] = await Promise.all([props.searchParams, props.params]);
  const { handle } = params;

  ServerProvider('dict', await getDictionary());

  const [{ page, isError }, banners, parentResp] = await Promise.all([
    getPageByUrl(handle),
    getBlogBanners(),
    getPageByUrl('blog'),
  ]);

  if (isError || !page) {
    return notFound();
  }

  const parentTitle = parentResp.page?.localizeInfos?.title ?? 'Promotions';
  const parentUrl = parentResp.page?.pageUrl ?? 'blog';

  const productsLimit = SHOP_PAGE_LIMIT;
  const relatedPromos = banners.filter(b => b.pageUrl !== handle && b.mobileImage);

  const attrs = page.attributeValues ?? {};
  const image =
    getImageUrl(attrs.bg_image?.value as ImageValue) ||
    getImageUrl(attrs.banner?.value as ImageValue);
  const title = page.localizeInfos?.title ?? '';
  const description = attrs.description?.value as DescriptionValue | undefined;
  const subtitleHtml = description?.[0]?.htmlValue ?? description?.[0]?.plainValue ?? '';

  return (
    <section className="section_layout">
      <nav aria-label="Breadcrumbs" className="mb-5 text-base">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-text">
          <li>
            <Link href="/" className="transition-colors hover:text-brand">
              Home
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
        <h1 className="font-bold text-xl uppercase text-brand">{title}</h1>
        {subtitleHtml ? (
          <div
            className="mt-3.75 font-normal text-base text-white"
            dangerouslySetInnerHTML={{ __html: subtitleHtml }}
          />
        ) : null}
      </div>

      <div className="mt-12.5">
        <Suspense fallback={<MemoizedProductsGridLoader productsLimit={productsLimit} />}>
          <ProductsGridLayout
            params={{ handle }}
            searchParams={searchParams ?? {}}
            productsLimit={productsLimit}
            isCategory={true}
          />
        </Suspense>
      </div>

      {relatedPromos.length > 0 ? (
        <div className="mt-20">
          {relatedPromos.length >= 3 ? (
            <RelatedPromosCarousel promos={relatedPromos} />
          ) : (
            <div className="flex flex-col lg:flex-row justify-between gap-15">
              {relatedPromos.map(b => (
                <Link
                  key={b.id}
                  href={b.pageUrl ? `/promo/${b.pageUrl}` : '#'}
                  title={b.title}
                  className="block flex-1 min-w-0 overflow-hidden rounded-panel transition-transform duration-500 hover:scale-[1.02]"
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

/** generateMetadata - metadata for the promo detail page. */
export async function generateMetadata({ params }: MetadataParams): Promise<Metadata> {
  const { handle } = await params;
  const [{ page }, dict] = await Promise.all([getPageByUrl(handle), getDictionary()]);
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
