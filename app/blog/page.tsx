import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import { getBlogBanners, getPageByUrl } from '@/app/api';

type DescriptionValue = Array<{
  plainValue?: string;
  htmlValue?: string;
  mdValue?: string;
}>;

export const dynamic = 'force-dynamic';

const BLOG_HANDLE = 'blog';

/**
 * Корневая промо-страница — рендерит список всех дочерних страниц `blog` в виде
 * вертикального списка баннеров на всю ширину контейнера. На больших экранах
 * (md+) показывается десктопное изображение (`bg_image`), на мобильных —
 * портретное (`banner`); если у страницы заполнено только одно из двух — оно
 * используется в обоих вариантах.
 *
 * Этот файл специально перекрывает дефолтный generic-рендер `app/[handle]/page.tsx`
 * для слага `/blog`, поскольку Next.js приоритизирует статические сегменты над
 * динамическими `[handle]`.
 * @returns {Promise<JSX.Element>} JSX корневой промо-страницы.
 */
const BlogPromoListPage = async (): Promise<JSX.Element> => {
  const [{ page, isError }, banners] = await Promise.all([
    getPageByUrl(BLOG_HANDLE),
    getBlogBanners(),
  ]);

  if (isError || !page) {
    return notFound();
  }

  const title = page.localizeInfos?.title ?? 'Promotions';
  const description = page.attributeValues?.description?.value as DescriptionValue | undefined;
  const subtitleHtml = description?.[0]?.htmlValue ?? description?.[0]?.plainValue ?? '';

  const visibleBanners = banners.filter(b => b.desktopImage || b.mobileImage);

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
          <li className="text-paper" aria-current="page">
            {title}
          </li>
        </ol>
      </nav>

      <div>
        <h1 className="font-bold text-xl uppercase text-brand">{title}</h1>
        {subtitleHtml ? (
          <div
            className="mt-3.75 font-normal text-base text-white"
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
                href={b.pageUrl ? `/promo/${b.pageUrl}` : '#'}
                title={b.title}
                className="block overflow-hidden rounded-[10px] transition-transform duration-500 hover:scale-[1.01]"
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

export default BlogPromoListPage;

/**
 * Метаданные корневой промо-страницы.
 * @returns {Promise<Metadata>} Объект метаданных.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { page } = await getPageByUrl(BLOG_HANDLE);
  const title = page?.localizeInfos?.title ?? 'Promotions';
  const description = page?.attributeValues?.description?.value as DescriptionValue | undefined;
  const descriptionText = description?.[0]?.plainValue ?? '';
  return {
    title,
    description: descriptionText,
    openGraph: { type: 'website', title, description: descriptionText },
  };
}
