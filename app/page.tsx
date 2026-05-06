import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import { getBlocksByPageUrl, getPageByUrl } from '@/app/api';
import HomeBlockServer from '@/components/home/HomeBlockServer';
import HomeCategoriesSection from '@/components/home/HomeCategoriesSection';
import HomePromo from '@/components/home/HomePromo';

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
const HOME_BLOCK_IDENTIFIERS = new Set(['home_promo', 'recommended', 'home_categories']);

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
const HomePage = async (): Promise<JSX.Element> => {
  const { page } = await getPageByUrl('home_web');
  if (!page) {
    notFound();
  }

  const { blocks = [] } = await getBlocksByPageUrl('home_web');
  const sortedBlocks = [...blocks]
    .filter(b => b.identifier && HOME_BLOCK_IDENTIFIERS.has(b.identifier))
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <>
      {sortedBlocks.map(block => {
        if (block.identifier === 'home_promo') {
          return <HomePromo key={block.id} />;
        }
        if (block.identifier === 'home_categories') {
          return <HomeCategoriesSection key={block.id} />;
        }
        return <HomeBlockServer key={block.id} marker={block.identifier as string} />;
      })}
    </>
  );
};

export default HomePage;
