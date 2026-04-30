import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { JSX } from 'react';
import { memo, Suspense } from 'react';

import { getPageByUrl } from '@/app/api';
import { ServerProvider } from '@/app/store/providers/ServerProvider';
import type { MetadataParams, PageProps } from '@/app/types/global';
import ProductsGridLayout from '@/components/layout/products-grid';
import ProductsGridLoader from '@/components/layout/products-grid/components/ProductsGridLoader';

import { getDictionary } from '../../dictionaries';

/** Мемоизируем компонент-лоадер, чтобы избежать лишних ре-рендеров */
const MemoizedProductsGridLoader = memo(ProductsGridLoader);

/**
 * Страница каталога магазина
 * @async
 * @param   {object}                                                    props              - пропсы страницы
 * @param   {Promise<{ handle: string; lang: string }>}                 props.params       - параметры страницы
 * @param   {Promise<{ [key: string]: string | string[] | undefined }>} props.searchParams - search-параметры
 * @see {@link https://nextjs.org/docs/app/api-reference/file-conventions/page Next.js docs}
 * @returns {Promise<JSX.Element>}                                                         JSX.Element layout-а страницы магазина
 */
const ShopCatalogPage = async (props: PageProps): Promise<JSX.Element> => {
  /** Извлекаем search-параметры из запроса */
  const [searchParams, params] = await Promise.all([
    props.searchParams,
    props.params,
  ]);
  /** Извлекаем параметры маршрута из запроса */
  const { handle } = params;

  /** Получаем словарь из API и проставляем server provider. */
  const [dict] = ServerProvider('dict', await getDictionary());

  // получаем страницу по url из API
  const { page, isError } = await getPageByUrl(handle);

  /** Устанавливаем количество товаров для отображения на странице */
  // TODO: Вынести лимит товаров на странице в global settings
  const pagesLimit = 10;

  if (!page || isError) {
    return notFound();
  }

  /** Рендерим layout страницы каталога магазина */
  return (
    <section className="relative mx-auto box-border flex w-full md:max-w-175 lg:max-w-250 xl:max-w-323 shrink-0 grow flex-col self-stretch px-4">
      <div className="flex w-full flex-col items-center gap-5">
        <Suspense fallback={<MemoizedProductsGridLoader />}>
          <ProductsGridLayout
            params={{ handle }}
            searchParams={searchParams ?? {}}
            pagesLimit={pagesLimit}
            dict={dict}
            isCategory={true}
          />
        </Suspense>
      </div>
    </section>
  );
};

export default ShopCatalogPage;

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

  // извлекаем данные из page
  const { localizeInfos, isVisible, attributeValues } = page;

  const {
    url,
    width,
    height,
    altText: alt,
  } = {
    url: (attributeValues?.icon as { downloadLink?: string } | undefined)
      ?.downloadLink,
    width: 300,
    height: 300,
    altText: localizeInfos?.title,
  };

  return {
    title: localizeInfos?.title,
    description: (localizeInfos as { plainContent?: string } | undefined)
      ?.plainContent,
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
