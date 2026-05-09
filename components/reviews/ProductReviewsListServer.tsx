import type { JSX } from 'react';

import { getProductReviews } from '@/app/api';

import ProductReviewsList from './ProductReviewsList';

/**
 * ProductReviewsListServer — серверная обёртка над {@link ProductReviewsList}: фетчит одобренные отзывы.
 * @param   {object}               props           - Пропсы.
 * @param   {number}               props.productId - Product id (становится `entityIdentifier`).
 * @returns {Promise<JSX.Element>}                 JSX списка отзывов.
 */
const ProductReviewsListServer = async ({
  productId,
}: {
  productId: number;
}): Promise<JSX.Element> => {
  const reviews = await getProductReviews(productId);
  return <ProductReviewsList reviews={reviews} />;
};

export default ProductReviewsListServer;
