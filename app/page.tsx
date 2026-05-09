import { notFound } from 'next/navigation';
import type { JSX } from 'react';

import { getBlocksByPageUrl, getPageByUrl } from '@/app/api';
import HomeBlockServer from '@/components/home/HomeBlockServer';
import HomeCategoriesSection from '@/components/home/HomeCategoriesSection';
import HomePromo from '@/components/home/HomePromo';

// Force-dynamic: цепочка layout-ов содержит `useSearchParams()`.
export const dynamic = 'force-dynamic';

// Whitelisted block identifiers; неизвестные тихо пропускаются.
const HOME_BLOCK_IDENTIFIERS = new Set(['home_promo', 'recommended', 'home_categories']);

/**
 * HomePage — главная страница, управляется блоками CMS-страницы `home_web`.
 *
 * Грузит page + прикреплённые блоки (отсортированы по `block.position`) и для каждого
 * делает диспетч по `block.identifier`: `home_promo` → {@link HomePromo}, `recommended`
 * → {@link HomeBlockServer}, `home_categories` → {@link HomeCategoriesSection}.
 * Переупорядочивание блоков в админке меняет порядок секций без изменений в коде.
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
        return <HomeBlockServer key={block.id} marker={block.identifier as string} limit={4} />;
      })}
    </>
  );
};

export default HomePage;
