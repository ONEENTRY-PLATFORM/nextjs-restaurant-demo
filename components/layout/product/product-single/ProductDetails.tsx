import Image from 'next/image';
import Link from 'next/link';
import type { IProductsEntity } from 'oneentry/types';
import type { JSX } from 'react';

import { getProductCurrency } from '@/app/api';
import { t } from '@/app/dictionaries';
import ClockCircleIcon from '@/components/icons/clock-circle';
import StarPuffyIcon from '@/components/icons/star-puffy';
import { UsePrice } from '@/components/utils';

import AddToCartButton from '../components/AddToCartButton';

/**
 * ProductDetails — right column of the product page (metrics, tags, CTA).
 *
 * When `rating.value` is empty, the metrics row shows a `rating_not_formed` dictionary message instead of star+score.
 *
 * @param   {object}            props         - Component props.
 * @param   {IProductsEntity}   props.product - OneEntry product entity.
 * @returns JSX of the details panel.
 */
const ProductDetails = async ({ product }: { product: IProductsEntity }): Promise<JSX.Element> => {
  const {
    id,
    statusIdentifier,
    localizeInfos: { title },
    attributeValues: { weight, calories, cooking_time, preferences, ingredients, price },
  } = product;

  const weightVal = weight?.value as number | undefined;
  const caloriesVal = calories?.value as number | undefined;
  const ratingVal = product.rating?.value;
  const cookingVal = cooking_time?.value as number | undefined;

  const ratingNotFormedText = await t('rating_not_formed', 'Rating not yet formed');
  const ingredientsLabel = await t('ingredients_text', 'Ingredients:');

  const prefs =
    (preferences?.value as Array<{ title: string; value: string }>)?.filter(
      o => o?.title && o?.value
    ) ?? [];

  const ingredientsList = (ingredients?.value as Array<{ title: string; value: string }>) ?? [];
  const ingredientsText = ingredientsList
    .map(i => i?.title)
    .filter(Boolean)
    .join(', ');
  const priceVal = price?.value as number | undefined;
  const currency = getProductCurrency(product.attributeValues);
  const priceFormatted = priceVal != null ? UsePrice({ amount: priceVal, currency }) : '';

  return (
    <div className="flex flex-col gap-3.75">
      {/* Metrics row + price badge - single line per static-html/details.html:130 */}
      <div className="flex items-start justify-between gap-3.75 lg:flex-row-reverse">
        <div className="mt-2.5 flex flex-col gap-3.75">
          {/* Weight / calories / rating + cooking_time (on mobile) */}
          <div className="flex items-center gap-1.25 md:gap-3.75">
            {weightVal != null ? (
              <>
                <Image src="/images/icons/weight.svg" alt="weight" width={27} height={20} />
                <p className="text-[12px] font-bold tracking-fine text-white opacity-90">
                  {weightVal} g
                </p>
              </>
            ) : null}
            {caloriesVal != null ? (
              <>
                <Image src="/images/icons/flame.svg" alt="flame" width={15} height={20} />
                <p className="text-[12px] font-bold tracking-fine text-white opacity-90">
                  {caloriesVal} ccal
                </p>
              </>
            ) : null}
            {ratingVal != null ? (
              <>
                <StarPuffyIcon />
                <p className="text-[12px] font-bold tracking-fine text-white opacity-90">
                  {ratingVal}
                </p>
              </>
            ) : (
              <p className="text-[12px] font-normal tracking-fine text-white opacity-60">
                {ratingNotFormedText}
              </p>
            )}
            {/* Cooking time - mobile/tablet variant, in the same row as the metrics */}
            {cookingVal != null && cookingVal > 0 ? (
              <div className="flex items-center gap-1.25 lg:hidden">
                <ClockCircleIcon variant="orange" />
                <p className="text-[12px] font-bold tracking-fine text-white opacity-90">
                  {cookingVal} min
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {priceFormatted ? (
          <div className="hidden h-13 w-18 shrink-0 items-center justify-center rounded-panel bg-custom-gradient text-xl font-bold text-white md:mt-0 md:flex">
            {priceFormatted}
          </div>
        ) : null}
      </div>

      {/* Cooking time - desktop variant, on a separate line below (lg+) */}
      {cookingVal != null && cookingVal > 0 ? (
        <div className="mt-7.5 hidden items-center gap-3.75 lg:flex">
          <ClockCircleIcon variant="orange" />
          <p className="text-[12px] font-bold tracking-fine text-white opacity-90">
            {cookingVal} min
          </p>
        </div>
      ) : null}

      {/* Ingredients */}
      {ingredientsText ? (
        <h3 className="text-[14px] font-normal tracking-fine text-white opacity-90">
          <span className="text-brand">{ingredientsLabel}</span> {ingredientsText}
        </h3>
      ) : null}

      {/* Preferences / tags - pills, link to /shop?preferences=<value> (same contract as CategoriesScroller) */}
      {prefs.length > 0 ? (
        <div className="flex flex-wrap gap-3.75">
          {prefs.map(p => (
            <Link
              key={p.value}
              href={'/shop?preferences=' + encodeURIComponent(p.value)}
              className="list_item list_link"
            >
              {p.title}
            </Link>
          ))}
        </div>
      ) : null}

      {/* CTA Add to cart */}
      <div className="mt-2.5 min-h-16.5">
        <AddToCartButton
          id={id}
          units={0}
          statusIdentifier={statusIdentifier || ''}
          productTitle={title || ''}
          height={50}
          className="flex min-h-16.5 w-full items-center justify-center gap-2.5 rounded-panel bg-custom-gradient py-4.5 text-xl font-bold text-white uppercase transition-all duration-200 hover:bg-gradient-to-r-hover active:bg-gradient-to-r-hover"
        />
      </div>
    </div>
  );
};

export default ProductDetails;
