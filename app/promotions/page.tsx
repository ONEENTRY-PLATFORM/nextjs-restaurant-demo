import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import { getBlogBanners, getPageByUrl } from '@/app/api';
import { t } from '@/app/dictionaries';
import { PAGES } from '@/app/utils/constants';
import { sanitizeHtml } from '@/app/utils/sanitizeHtml';
import { blogBannerFromPage } from '@/components/promo/blogBanner';
import { unwrapRichText } from '@/components/utils';

export const dynamic = 'force-static';
export const revalidate = 300;

/**
 * PromotionsListPage — root promo page listing child pages of `promotions`.
 *
 * @returns Promise resolving to JSX of the root promo page (intro + vertical list of promo banners).
 */
const PromotionsListPage = async (): Promise<JSX.Element> => {
  const [{ page, isError }, bannersRes] = await Promise.all([
    getPageByUrl(PAGES.promotions),
    getBlogBanners(),
  ]);

  if (isError || !page) {
    return notFound();
  }

  const banners = (bannersRes.pages ?? []).map(blogBannerFromPage);

  const title = page.localizeInfos?.title ?? (await t('promotions_title', 'Promotions'));
  const homeLabel = await t('home_label', 'Home');
  const description = unwrapRichText(page.attributeValues?.description?.value);
  const subtitleHtml = sanitizeHtml(description?.htmlValue ?? description?.plainValue);

  const visibleBanners = banners.filter(b => b.desktopImage || b.mobileImage);

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
          <li className="text-paper" aria-current="page">
            {title}
          </li>
        </ol>
      </nav>

      <div>
        <h1 className="text-xl font-bold text-brand uppercase">{title}</h1>
        {subtitleHtml ? (
          <div
            className="mt-3.75 text-base font-normal text-white"
            dangerouslySetInnerHTML={{ __html: subtitleHtml }}
          />
        ) : null}
      </div>

      {visibleBanners.length > 0 ? (
        <div className="mt-12.5 flex flex-col gap-15">
          {visibleBanners.map((b, i) => {
            const hasBoth = !!b.desktopImage && !!b.mobileImage;
            return (
              <Link
                key={b.id}
                href={b.pageUrl ? `/promotions/${b.pageUrl}` : '#'}
                title={b.title}
                className="block overflow-hidden rounded-panel transition-transform duration-500 hover:scale-101"
              >
                {b.desktopImage ? (
                  <Image
                    src={b.desktopImage}
                    alt={b.title}
                    width={1292}
                    height={192}
                    sizes={hasBoth ? '(min-width: 768px) 1292px, 100vw' : '100vw'}
                    priority={i === 0}
                    className={
                      hasBoth
                        ? 'hidden h-auto w-full object-cover md:block'
                        : 'h-auto w-full object-cover'
                    }
                  />
                ) : null}
                {b.mobileImage ? (
                  <Image
                    src={b.mobileImage}
                    alt={b.title}
                    width={615}
                    height={278}
                    sizes="100vw"
                    priority={i === 0 && !b.desktopImage}
                    className={hasBoth ? 'h-auto w-full md:hidden' : 'h-auto w-full'}
                  />
                ) : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </section>
  );
};

export default PromotionsListPage;

/**
 * generateMetadata — metadata for the root promo page from the CMS `promotions` page title/description.
 *
 * @returns Promise resolving to the page metadata.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getPageByUrl(PAGES.promotions);
  const title = page?.localizeInfos?.title ?? 'Promotions';
  const descriptionText =
    unwrapRichText(page?.attributeValues?.description?.value)?.plainValue ?? '';
  return {
    title,
    description: descriptionText,
    openGraph: { type: 'website', title, description: descriptionText },
  };
}
