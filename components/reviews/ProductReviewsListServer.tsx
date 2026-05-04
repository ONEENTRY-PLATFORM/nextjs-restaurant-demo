import type { JSX } from 'react';

import { getProductReviews } from '@/app/api';

import ProductReviewsList from './ProductReviewsList';

/**
 * Серверная обёртка для `<ProductReviewsList />` — запрашивает одобренные
 * отзывы для данного продукта через `getProductReviews` и передаёт их в
 * клиентскую карусель. Кеширование отключено внутри `getProductReviews`,
 * так что свежеотправленные отзывы появляются без ручной ревалидации.
 * @param   {object}               props           - Пропсы компонента.
 * @param   {number}               props.productId - Product id (становится `entityIdentifier`).
 * @returns {Promise<JSX.Element>}                 JSX списка отзывов (или пустой рендер, если отзывов нет).
 */
const ProductReviewsListServer = async ({
  productId,
}: {
  productId: number;
}): Promise<JSX.Element> => {
  const reviews = await getProductReviews(productId);
  return <ProductReviewsList reviews={reviews} productId={productId} />;
};

export default ProductReviewsListServer;
