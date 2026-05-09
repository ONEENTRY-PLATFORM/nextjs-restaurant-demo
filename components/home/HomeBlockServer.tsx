import type { JSX } from 'react';

import { getBlockProducts } from '@/app/api';

import HomeBlockSection from './HomeBlockSection';

/**
 * HomeBlockServer — async-обёртка над {@link HomeBlockSection}: фетчит блок OneEntry по marker.
 * Возвращает `null`, если в блоке нет продуктов — чтобы не оставлять пустую секцию.
 * @param   {object}                    props             - Пропсы.
 * @param   {string}                    props.marker      - Идентификатор блока.
 * @param   {string}                    [props.className] - Переопределение className секции.
 * @param   {number}                    [props.limit]     - Ограничение по количеству продуктов.
 * @returns {Promise<JSX.Element|null>}                   JSX блока либо `null`.
 */
const HomeBlockServer = async ({
  marker,
  className,
  limit,
}: {
  marker: string;
  className?: string;
  limit?: number;
}): Promise<JSX.Element | null> => {
  const data = await getBlockProducts(marker);
  if (data.isError || data.products.length === 0) return null;

  const products = limit ? data.products.slice(0, limit) : data.products;

  return (
    <HomeBlockSection
      title={data.title}
      products={products}
      countElementsPerRow={data.countElementsPerRow}
      className={className ?? 'section_layout'}
    />
  );
};

export default HomeBlockServer;
