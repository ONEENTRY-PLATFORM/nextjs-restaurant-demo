import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import {
  getAllOrdersByMarker,
  getBlocksByPageUrl,
  getPageByUrl,
} from '@/app/api';
import { formatDate } from '@/app/utils/formatDate';
import HomeBlockServer from '@/components/home/HomeBlockServer';
import HomeCategoriesSection from '@/components/home/HomeCategoriesSection';
import HomePromo from '@/components/home/HomePromo';
import type {
  OrderReviewLineMock,
  OrderReviewMock,
} from '@/components/reviews/mockOrderReviewData';
import OrderReviewsPanel from '@/components/reviews/OrderReviewsPanel';

// Отключаем static prerender — общая цепочка layout-ов включает клиентские
// компоненты, читающие `useSearchParams()` (search bar, filter bottom sheet),
// которые Next.js требует оборачивать в Suspense для static-генерации.
// Рендер dynamic обходит prerender-time bailout.
export const dynamic = 'force-dynamic';

/**
 * Block identifier → тип секции. Каждый блок, прикреплённый к странице
 * `home_web`, выступает позиционным маркером одного из этих компонентов
 * секций, поэтому переупорядочивание блоков в админке OneEntry (`block.position`)
 * меняет порядок секций на странице без изменений в коде.
 *
 * Идентификаторы, которых нет в этом списке, тихо пропускаются — редактор
 * может ставить новые блоки, не ломая билд, а мы добавляем рендерер
 * под них, когда визуал готов.
 */
const HOME_BLOCK_IDENTIFIERS = new Set([
  'home_promo',
  'recommended',
  'home_categories',
]);

/**
 * Резолвит проекцию заказа для review-панели по `?review_order=<id|orderId>`.
 * Возвращает `null`, когда параметр отсутствует (панель не рендерится); откатывается
 * на встроенный мок в {@link OrderReviewsPanel}, когда заказ не получается
 * загрузить (нет авторизации, ошибка fetch, нет совпадения), чтобы drawer всё равно
 * показывал дизайн из static-html — см. CLAUDE.md правило 2 (моки должны держать
 * layout непустым, пока пайплайн CMS не готов).
 * @param   {string} reviewOrderParam - Сырое значение `?review_order`.
 * @returns {Promise<OrderReviewMock | null | undefined>} Проекция заказа, mock-fallback (`undefined`) или `null`.
 */
const resolveReviewOrder = async (
  reviewOrderParam: string,
): Promise<OrderReviewMock | null | undefined> => {
  // Специальные токены / unauth flow → используем встроенный мок панели.
  if (!reviewOrderParam || reviewOrderParam === 'demo') return undefined;

  const res = await getAllOrdersByMarker({
    marker: 'delivery_order',
    offset: 0,
    limit: 50,
  });
  if (res.isError || !res.orders) return undefined;

  const match = res.orders.find(
    (o) =>
      String(o.id) === reviewOrderParam ||
      (o as unknown as { orderId?: string }).orderId === reviewOrderParam,
  );
  if (!match) return undefined;

  const lines: OrderReviewLineMock[] = match.products.map((p, idx) => ({
    id: `${match.id}-${p.id}-${idx}`,
    productId: typeof p.id === 'number' ? p.id : Number(p.id) || null,
    title: p.title,
    imageSrc: p.previewImage?.previewLink ?? '/images/picture/favorites1.png',
  }));
  lines.push({
    id: `${match.id}-delivery`,
    productId: null,
    title: 'Delivery',
    imageSrc: '/images/icons/delivery.svg',
    isDelivery: true,
  });

  const orderId = (match as unknown as { orderId?: string }).orderId;
  const created = (match as unknown as { createdDate?: string }).createdDate;
  const localized = (
    match.statusLocalizeInfos as { title?: string } | undefined
  )?.title;

  return {
    orderNumber: orderId ?? String(match.id),
    status: localized ?? match.statusIdentifier ?? '',
    date: formatDate(created),
    lines,
  };
};

/**
 * Главная страница — полностью управляется OneEntry CMS:
 *   1. Загружает сущность страницы `home_web`, чтобы убедиться, что она существует
 *      (и оставить хук под будущие метаданные / hero-атрибуты уровня страницы).
 *   2. Загружает прикреплённые к ней блоки через `getBlocksByPageUrl`,
 *      отсортированные по `block.position`.
 *   3. Для каждого блока делает диспетч по `block.identifier`:
 *        - `home_promo`      → статичный баннер {@link HomePromo} (DEAL OF
 *                              THE DAY -50%). Блок CMS используется только
 *                              как позиционный якорь; контент баннера
 *                              захардкожен, пока у блока не появятся
 *                              атрибуты title/product/image.
 *        - `recommended`     → курируемая сетка через {@link HomeBlockServer}
 *        - `home_categories` → все секции категорий меню через
 *                              {@link HomeCategoriesSection}
 *      Переупорядочивание блоков в админке (`block.position`) меняет порядок
 *      секций на странице без изменений в коде.
 * @returns {Promise<JSX.Element>} JSX главной страницы.
 */
const HomePage = async ({
  searchParams,
}: {
  searchParams?: Promise<{ review_order?: string }>;
}): Promise<JSX.Element> => {
  const { page } = await getPageByUrl('home_web');
  if (!page) {
    notFound();
  }

  const sp = (await searchParams) ?? {};
  const reviewOrderRaw = sp.review_order;
  const reviewOrder = reviewOrderRaw
    ? await resolveReviewOrder(reviewOrderRaw)
    : null;

  const { blocks = [] } = await getBlocksByPageUrl({ pageUrl: 'home_web' });
  const sortedBlocks = [...blocks]
    .filter((b) => b.identifier && HOME_BLOCK_IDENTIFIERS.has(b.identifier))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <>
      {sortedBlocks.map((block) => {
        if (block.identifier === 'home_promo') {
          return <HomePromo key={block.id} />;
        }
        if (block.identifier === 'home_categories') {
          return <HomeCategoriesSection key={block.id} />;
        }
        return (
          <HomeBlockServer
            key={block.id}
            marker={block.identifier as string}
            className={
              'max-w-100 md:max-w-175 lg:max-w-250 xl:max-w-323 mx-auto w-full px-4 pt-3.75 md:pt-6.25 pb-1.25'
            }
          />
        );
      })}
      {reviewOrderRaw ? (
        <OrderReviewsPanel order={reviewOrder ?? null} />
      ) : null}
    </>
  );
};

export default HomePage;
