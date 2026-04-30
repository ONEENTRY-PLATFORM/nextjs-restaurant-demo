import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';
import { memo, Suspense } from 'react';

import { getPageByUrl } from '@/app/api';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import type { MetadataParams, PageProps } from '@/app/types/global';
import ProductsGridLayout from '@/components/layout/products-grid';
import ProductsGridLoader from '@/components/layout/products-grid/components/ProductsGridLoader';

import { getImageUrl } from '../api/hooks/useAttributesData';
import { getDictionary } from '../dictionaries';
import { generatePageMetadata } from '../utils/generatePageMetadata';

/** Мемоизируем компонент-лоадер, чтобы избежать лишних ре-рендеров */
const MemoizedProductsGridLoader = memo(ProductsGridLoader);

export const dynamic = 'force-dynamic';

/**
 * Страница магазина
 * @param   {PageProps}            props - Пропсы страницы с params и searchParams
 * @returns {Promise<JSX.Element>}       JSX.Element layout-а страницы магазина
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/page Next.js docs}
 */
const ShopPageLayout = async (props: PageProps): Promise<JSX.Element> => {
  /** Извлекаем search-параметры из пропсов */
  const [searchParams, params] = await Promise.all([
    props.searchParams,
    props.params,
  ]);
  /** Получаем словарь из API и проставляем server provider. */
  const [dict] = ServerProvider('dict', await getDictionary());

  /** Получаем текущую страницу по URL из API */
  const { page } = await getPageByUrl('services');

  /** Устанавливаем количество товаров для отображения на странице */
  // TODO: Вынести лимит товаров на странице в global settings
  const pagesLimit = 10;

  /** Возвращаем 404, если страница магазина не найдена */
  if (!page) {
    return notFound();
  }

  /** Генерируем structured data для хлебных крошек для улучшения SEO */
  const breadcrumbStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.localizeInfos.title,
        item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/shop`,
      },
    ],
  };

  /** Рендерим страницу магазина со structured data и сеткой товаров */
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbStructuredData),
        }}
      />
      <section className="relative mx-auto box-border flex w-full md:max-w-175 lg:max-w-250 xl:max-w-323 shrink-0 grow flex-col self-stretch px-4">
        <div className="flex w-full flex-col items-center gap-5">
          <Suspense fallback={<MemoizedProductsGridLoader />}>
            <ProductsGridLayout
              pagesLimit={pagesLimit}
              dict={dict}
              params={params}
              searchParams={searchParams ?? {}}
            />
          </Suspense>
        </div>
      </section>
    </>
  );
};

export default ShopPageLayout;

/**
 * Генерирует метаданные страницы
 * @param   {MetadataParams}                           props        - Параметры метаданных
 * @param   {Promise<{handle: string; lang: string;}>} props.params - Параметры страницы
 * @returns {Promise<Metadata>}                                     Объект метаданных
 * @see {@link https://doc.oneentry.cloud/docs/pages OneEntry CMS docs}
 * @see {@link https://nextjs.org/docs/app/building-your-application/optimizing/metadata#dynamic-metadata Next.js docs}
 */
export async function generateMetadata({
  params,
}: MetadataParams): Promise<Metadata> {
  /** Извлекаем handle и язык из параметров маршрута */
  const { handle, lang } = await params;
  /** Загружаем страницу магазина по URL */
  const { isError, page } = await getPageByUrl('services');

  /** Возвращаем 404, если страница не найдена или произошла ошибка */
  if (isError || !page) {
    return notFound();
  }

  /** Извлекаем информацию страницы из объекта page */
  const { localizeInfos, isVisible, attributeValues } = page;

  /** Возвращаем объект метаданных */
  return generatePageMetadata({
    handle: handle,
    title: localizeInfos.title,
    description:
      (localizeInfos as { plainContent?: string }).plainContent ?? '',
    isVisible: isVisible,
    imageUrl: getImageUrl('opengraph_image', attributeValues),
    imageAlt: localizeInfos.title,
    lang: lang,
    baseUrl: '',
  });
}
