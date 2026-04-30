import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { type JSX, memo, Suspense } from 'react';

import { getPageByUrl } from '@/app/api';
import { getDictionary } from '@/app/dictionaries';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import type { MetadataParams, PageProps } from '@/app/types/global';
import { SHOP_PAGE_LIMIT } from '@/app/utils/constants';
import ProductsGridLayout from '@/components/layout/products-grid';
import ProductsGridLoader from '@/components/layout/products-grid/components/ProductsGridLoader';

/** Мемоизируем компонент-лоадер, чтобы избежать лишних ре-рендеров */
const MemoizedProductsGridLoader = memo(ProductsGridLoader);

/**
 * Layout страницы категории магазина
 * @param   {object}               props              - Пропсы страницы
 * @param   {object}               props.params       - параметры страницы
 * @param   {object}               props.searchParams - динамические search-параметры
 * @returns {Promise<JSX.Element>}                    JSX.Element layout-а страницы магазина
 * @see {@link https://doc.oneentry.cloud/docs/pages OneEntry CMS docs}
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/page Next.js docs}
 */
const ShopCategoryLayout = async (props: PageProps): Promise<JSX.Element> => {
  /** Извлекаем параметры маршрута из пропсов */
  const [searchParams, params] = await Promise.all([
    props.searchParams,
    props.params,
  ]);
  /** Деструктурируем handle из параметров */
  const { handle } = params;
  /** Получаем словарь из API и проставляем server provider. */
  const [dict] = ServerProvider('dict', await getDictionary());

  /** Загружаем данные страницы категории из CMS */
  const { page } = await getPageByUrl(handle);

  /** Лимит карточек товаров на одну страницу каталога (см. `NEXT_PUBLIC_SHOP_PAGE_LIMIT`). */
  const productsLimit = SHOP_PAGE_LIMIT;

  /** Показываем 404, если страница категории не найдена */
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
        name: 'Shop',
        item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/shop`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: page.localizeInfos.title,
        item: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/shop/category/${handle}`,
      },
    ],
  };

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
              searchParams={searchParams ?? {}}
              productsLimit={productsLimit}
              params={params}
              dict={dict}
              isCategory={true}
            />
          </Suspense>
        </div>
      </section>
    </>
  );
};

export default ShopCategoryLayout;

/**
 * Генерирует метаданные страницы
 */
export async function generateMetadata({
  params,
}: MetadataParams): Promise<Metadata> {
  const { handle } = await params;
  const { isError, page } = await getPageByUrl(handle);

  if (isError || !page) {
    return notFound();
  }
  const { localizeInfos, isVisible, attributeValues } = page;

  const {
    url,
    width,
    height,
    altText: alt,
  } = {
    url: (attributeValues.icon as { downloadLink?: string } | undefined)
      ?.downloadLink,
    width: 300,
    height: 300,
    altText: localizeInfos.title,
  };

  return {
    title: localizeInfos.title,
    description: (localizeInfos as { plainContent?: string }).plainContent,
    robots: {
      index: isVisible,
      follow: isVisible,
      googleBot: {
        index: isVisible,
        follow: isVisible,
      },
    },
    openGraph: url
      ? {
          images: [
            {
              url,
              width,
              height,
              alt,
            },
          ],
        }
      : null,
  };
}
