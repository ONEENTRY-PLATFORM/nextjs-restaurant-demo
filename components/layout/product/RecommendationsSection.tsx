import type { JSX } from 'react';

import getProductBlurMap from '@/app/api/lqip/getProductBlurMap';
import {
  getRecommendations,
  type RecommendationKind,
} from '@/app/api/server/blocks/getRecommendations';
import { t } from '@/app/dictionaries';

import CardsGridAnimations from '../products-grid/animations/CardsGridAnimations';
import ProductCard from '../products-grid/components/product-card/ProductCard';
import ProductAnimations from './animations/ProductAnimations';

/**
 * RecommendationsSection — a product row for a recommendation surface (recently viewed,
 * trending, cart upsell, personal). Server component mirroring {@link RelatedItems}.
 *
 * Renders nothing when there are no products (graceful — never an empty heading).
 *
 * @param   {object}             props             - Component props.
 * @param   {RecommendationKind} props.kind        - Which recommendation Block to read.
 * @param   {string}             props.titleMarker - `static_content` marker for the section title.
 * @param   {string}             props.titleFallback - English fallback for the title.
 * @param   {number}             [props.excludeId] - Product id to exclude (e.g. the current product).
 * @param   {number}             [props.limit]     - Max products to show.
 * @returns JSX of the section, or empty fragment when there is nothing to show.
 */
const RecommendationsSection = async ({
  kind,
  titleMarker,
  titleFallback,
  excludeId,
  limit,
}: {
  kind: RecommendationKind;
  titleMarker: string;
  titleFallback: string;
  excludeId?: number;
  limit?: number;
}): Promise<JSX.Element> => {
  const items = await getRecommendations(kind, {
    ...(excludeId != null ? { excludeId } : {}),
    ...(limit != null ? { limit } : {}),
  });

  if (!items.length) {
    return <></>;
  }

  const [title, blurMap] = await Promise.all([t(titleMarker, titleFallback), getProductBlurMap(items)]);

  return (
    <section className="flex flex-col max-md:max-w-full pt-15">
      <ProductAnimations className={''} index={0}>
        <h3 className="title_name mb-3 max-md:max-w-full text-paper!">{title}</h3>
      </ProductAnimations>
      <CardsGridAnimations className="menu_items">
        {items.map((product, i) => {
          const blur = blurMap[product.id];
          return (
            <ProductCard
              key={product.id}
              product={product}
              index={i}
              productsLimit={0}
              {...(blur ? { blurDataURL: blur } : {})}
            />
          );
        })}
      </CardsGridAnimations>
    </section>
  );
};

export default RecommendationsSection;
