import type { JSX } from 'react';

import { getProductReviews } from '@/app/api';

import ProductReviewsList from './ProductReviewsList';

/**
 * ProductReviewsListServer — server wrapper over {@link ProductReviewsList}: fetches approved reviews.
 *
 * @param   {object} props           - Component props.
 * @param   {number} props.productId - Product id (becomes `entityIdentifier`).
 * @returns JSX of the rendered review list.
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
