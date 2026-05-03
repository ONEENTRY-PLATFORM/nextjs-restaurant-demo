import type { JSX } from 'react';

import { getBlockProducts } from '@/app/api';

import HomeBlockSection from './HomeBlockSection';

/**
 * Асинхронная обёртка для {@link HomeBlockSection}, которая фетчит блок OneEntry
 * по маркеру и пробрасывает его title, курированный список продуктов и конфиг
 * layout (`quantity`, `countElementsPerRow`) в рендерер. Каждый home-блок
 * на `home_web` (например, `home_promo`, `recommended`) живёт за одной
 * из таких обёрток, чтобы `app/page.tsx` только диспетчил по
 * `block.identifier` и оставался декларативным.
 *
 * Возвращает `null`, если в блоке нет продуктов для отображения, чтобы пустые
 * блоки не оставляли фантомную секцию/заголовок на странице.
 * @param   {object}                  props        - Пропсы компонента.
 * @param   {string}                  props.marker - Идентификатор блока (например, `recommended`).
 * @param   {string}                  [props.className] - Переопределение className секции.
 * @returns {Promise<JSX.Element|null>}              JSX блока, либо `null`, если пусто.
 */
const HomeBlockServer = async ({
  marker,
  className,
}: {
  marker: string;
  className?: string;
}): Promise<JSX.Element | null> => {
  const data = await getBlockProducts(marker);
  if (data.isError || data.products.length === 0) return null;

  return (
    <HomeBlockSection
      title={data.title}
      products={data.products}
      countElementsPerRow={data.countElementsPerRow}
      className={className ?? 'section_layout'}
    />
  );
};

export default HomeBlockServer;
