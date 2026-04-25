import type { JSX } from 'react';

import { getProductReviews } from '@/app/api';

import ProductReviewsList from './ProductReviewsList';

/**
 * Server wrapper for `<ProductReviewsList />` — fetches approved reviews
 * for the given product via `getProductReviews` and forwards them to the
 * client carousel. Caching is disabled inside `getProductReviews` so freshly
 * submitted reviews appear without manual revalidation.
 * @param   {object}               props           - Component props.
 * @param   {number}               props.productId - Product id (becomes `entityIdentifier`).
 * @returns {Promise<JSX.Element>}                 Review list JSX (or empty render when there are no reviews).
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
